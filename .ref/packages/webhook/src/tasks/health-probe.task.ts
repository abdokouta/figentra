/**
 * @file health-probe.task.ts
 * @module @stackra/nestjs-webhook/tasks
 * @description Scheduled task that sends HEAD requests to all active webhook
 *   subscriptions to verify endpoint reachability. Tracks consecutive probe
 *   failures and emits `webhook.probe.failed` after the configured threshold.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';
import type { IPubSubDriver, IPubSubMessage } from '@stackra/contracts';
import { IPUBSUB_SERVICE } from '@stackra/contracts';

import type { IWebhookConfig } from '../interfaces';
import { WebhookSubscription } from '../entities';
import { SubscriptionState } from '../enums';
import { WEBHOOK_CONFIG, WEBHOOK_EVENTS } from '../constants';

// ============================================================================
// Task
// ============================================================================

/**
 * Health probe scheduled task.
 *
 * Runs every 5 minutes and sends a HEAD request to every active subscription's
 * URL to verify reachability without delivering real events. Tracks consecutive
 * probe failures per subscription and emits `webhook.probe.failed` when the
 * configured failure threshold is exceeded.
 *
 * @example
 * ```typescript
 * // Manually trigger (for testing)
 * await healthProbeTask.probe();
 * ```
 */
@IInjectable()
export class HealthProbeTask {
  /** Scoped logger instance. */
  private readonly logger = new Logger(HealthProbeTask.name);

  /** In-memory tracker for consecutive probe failures per subscription. */
  private readonly probeFailures: Map<string, number> = new Map();

  /**
   * @param subscriptionRepo - Repository for querying subscriptions.
   * @param config - Global webhook configuration.
   * @param pubsub - Optional PubSub driver for emitting probe failure events.
   */
  public constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: EntityRepository<WebhookSubscription>,
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig,
    @Optional()
    @Inject(IPUBSUB_SERVICE)
    private readonly pubsub?: IPubSubDriver
  ) {}

  // ── Scheduled execution ───────────────────────────────────────────────

  /**
   * Execute the health probe on all active subscriptions.
   *
   * Runs every 5 minutes via `@Cron`. Sends a HEAD request to each active
   * subscription's URL and tracks failures.
   */
  @Cron('*/5 * * * *')
  public async probe(): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({
      state: SubscriptionState.ACTIVE,
    } as any);

    if (subscriptions.length === 0) {
      return;
    }

    this.logger.log(`Probing ${subscriptions.length} active subscription(s)`);

    for (const subscription of subscriptions) {
      await this.probeSubscription(subscription);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Probe a single subscription endpoint.
   *
   * @param subscription - The subscription to probe.
   */
  private async probeSubscription(subscription: WebhookSubscription): Promise<void> {
    const method = this.config.probe.method ?? 'HEAD';
    const timeoutMs = (this.config.probe.timeout_seconds ?? 5) * 1000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(subscription.url, {
        method,
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.defaults.user_agent,
        },
      });

      if (response.ok) {
        // Reset failure counter on success
        this.probeFailures.delete(subscription.id);
      } else {
        this.recordProbeFailure(subscription);
      }
    } catch {
      this.recordProbeFailure(subscription);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Record a probe failure and emit event if threshold is exceeded.
   *
   * @param subscription - The subscription that failed the probe.
   */
  private recordProbeFailure(subscription: WebhookSubscription): void {
    const current = (this.probeFailures.get(subscription.id) ?? 0) + 1;
    this.probeFailures.set(subscription.id, current);

    const threshold = this.config.probe.failure_threshold ?? 3;

    if (current >= threshold) {
      this.logger.warn(
        `Subscription "${subscription.id}" (${subscription.url}) failed ${current} consecutive probes`
      );

      this.emit(WEBHOOK_EVENTS.PROBE_FAILED, {
        subscriptionId: subscription.id,
        name: subscription.name,
        url: subscription.url,
        consecutiveFailures: current,
      });

      // Reset counter after emitting (will re-trigger on next threshold breach)
      this.probeFailures.set(subscription.id, 0);
    }
  }

  /**
   * Emit an event via the PubSub driver (fail-open pattern).
   *
   * @param channel - The event channel name.
   * @param data - The event payload.
   */
  private emit(channel: string, data: unknown): void {
    if (!this.pubsub) return;

    const message: IPubSubMessage = {
      event: channel,
      data,
      metadata: { source: '@stackra/nestjs-webhook', timestamp: new Date() },
    };

    this.pubsub.publish(channel, message).catch(() => {
      // Fail open — event emission must never break the operation
    });
  }
}
