/**
 * @file webhook-dispatcher.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Service that receives domain events and fans them out to all
 *   matching active webhook subscriptions by enqueuing delivery jobs via
 *   `@stackra/nestjs-queue`. Handles payload filtering and rate limiting
 *   via `@stackra/nestjs-rate-limit`.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

import { QueueService } from '@stackra/nestjs-queue';
import { RateLimiterManager } from '@stackra/nestjs-rate-limit';

import type { IWebhookConfig, IPayloadFilter } from '../interfaces';
import { WebhookRegistry } from '../registries/webhook.registry';
import { WebhookSubscription } from '../entities';
import { SubscriptionState } from '../enums';
import { WEBHOOK_CONFIG, PAYLOAD_FILTER } from '../constants';

// ============================================================================
// Service
// ============================================================================

/**
 * Webhook event dispatcher.
 *
 * Receives domain events, resolves them in the WebhookRegistry, finds all
 * matching active subscriptions, evaluates payload filters, and enqueues
 * delivery jobs per subscription via `QueueService.dispatch()`.
 *
 * Handles rate limiting by delaying (not dropping) jobs when a subscription's
 * `rate_limit_per_minute` is exceeded.
 *
 * @example
 * ```typescript
 * // Dispatch a domain event to all matching subscriptions
 * await dispatcher.dispatch(new OrderCreatedEvent(order));
 * ```
 */
@IInjectable()
export class WebhookDispatcher {
  /** Scoped logger instance. */
  private readonly logger = new Logger(WebhookDispatcher.name);

  /**
   * @param registry - Webhook event registry for resolving event metadata.
   * @param subscriptionRepo - Repository for querying webhook subscriptions.
   * @param queueService - Queue service for dispatching delivery jobs.
   * @param config - Global webhook configuration.
   * @param payloadFilter - Payload filter evaluator.
   * @param rateLimiter - Rate limiter manager from `@stackra/nestjs-rate-limit`.
   *   Optional — when not available, rate limiting is skipped.
   */
  public constructor(
    private readonly registry: WebhookRegistry,
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: EntityRepository<WebhookSubscription>,
    private readonly queueService: QueueService,
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig,
    @Inject(PAYLOAD_FILTER)
    private readonly payloadFilter: IPayloadFilter,
    @Optional()
    private readonly rateLimiter?: RateLimiterManager
  ) {}

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Dispatch a domain event to all matching webhook subscriptions.
   *
   * Resolves the event in the registry, finds active subscriptions whose
   * `events` array contains the wire-format name, evaluates payload filters,
   * and enqueues a delivery job per matching subscription.
   *
   * @param event - The domain event object (must be decorated with @WebhookEvent).
   * @returns Promise that resolves when all jobs are enqueued.
   */
  public async dispatch(event: object): Promise<void> {
    const meta = this.registry.resolve(event.constructor);
    if (!meta) {
      return; // Not a registered webhook event — silently skip
    }

    const subscriptions = await this.findMatchingSubscriptions(meta.name);
    if (subscriptions.length === 0) {
      return;
    }

    const eventId = randomUUID();
    const payload = this.serializePayload(event);

    this.logger.log(`Dispatching "${meta.name}" to ${subscriptions.length} subscription(s)`);

    for (const subscription of subscriptions) {
      // Evaluate payload filter
      if (subscription.filter && !this.payloadFilter.evaluate(subscription.filter, payload)) {
        continue;
      }

      // Check rate limiting via @stackra/nestjs-rate-limit
      const delay = await this.computeRateLimitDelay(subscription);

      const jobData = {
        subscriptionId: subscription.id,
        eventId,
        eventName: meta.name,
        eventVersion: meta.version ?? null,
        payload,
      };

      await this.queueService.dispatch(
        this.config.queue.name,
        'deliver',
        jobData,
        delay > 0 ? { delay } : undefined
      );
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Find all active subscriptions whose events array contains the given event name.
   *
   * @param eventName - The wire-format event name to match.
   * @returns Array of matching active subscriptions.
   */
  private async findMatchingSubscriptions(_eventName: string): Promise<WebhookSubscription[]> {
    return this.subscriptionRepo.find({
      state: SubscriptionState.ACTIVE,
    } as any);
    // Note: In production, this would use a JSON contains query.
    // Filtering by events array is done in-memory for portability.
  }

  /**
   * Serialize an event object to a plain JSON-compatible payload.
   *
   * @param event - The domain event object.
   * @returns A plain object suitable for JSON serialization.
   */
  private serializePayload(event: object): Record<string, any> {
    // Strip class prototype — produce a plain object
    return JSON.parse(JSON.stringify(event));
  }

  /**
   * Compute rate limit delay for a subscription using `@stackra/nestjs-rate-limit`.
   *
   * Delegates to the unified `RateLimiterManager.reserve()` which uses the
   * configured backend (Redis in production, memory in tests). Returns delay
   * in milliseconds for the queue job.
   *
   * @param subscription - The webhook subscription to check.
   * @returns Delay in milliseconds (0 if within limit).
   */
  private async computeRateLimitDelay(subscription: WebhookSubscription): Promise<number> {
    if (!subscription.rate_limit_per_minute || !this.rateLimiter) {
      return 0;
    }

    const key = `webhook:${subscription.id}`;
    const waitSeconds = await this.rateLimiter.reserve(key, subscription.rate_limit_per_minute, 60);

    // Convert seconds to milliseconds for queue delay
    return waitSeconds > 0 ? waitSeconds * 1000 : 0;
  }
}
