/**
 * @file deliver-webhook.job.ts
 * @module @stackra/nestjs-webhook/jobs
 * @description BullMQ processor for the 'webhooks' queue. Creates a WebhookDelivery
 *   record, delegates to WebhookSender for the actual HTTP delivery, handles retry
 *   scheduling with configurable backoff, and auto-disables subscriptions on
 *   consecutive failure threshold breach.
 */

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@stackra/nestjs-queue';
import type { Job } from '@stackra/nestjs-queue';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';

import { WebhookSender } from '../services/webhook-sender.service';
import { StaticArrayBackoffStrategy } from '../strategies/static-array-backoff.strategy';
import { ExponentialBackoffStrategy } from '../strategies/exponential-backoff.strategy';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';
import { DeliveryState, SubscriptionState } from '../enums';
import { SubscriptionDisabledError } from '../errors';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Processor
// ============================================================================

/**
 * BullMQ processor for webhook delivery jobs.
 *
 * Processes jobs from the 'webhooks' queue by:
 * 1. Loading the target subscription
 * 2. Creating a WebhookDelivery audit record
 * 3. Delegating to WebhookSender for the actual HTTP delivery
 * 4. Handling retry scheduling with the appropriate backoff strategy
 * 5. Throwing on retryable failures so BullMQ schedules the next attempt
 *
 * @example
 * ```typescript
 * // Jobs are dispatched by WebhookDispatcher — this processor handles them.
 * // Registration happens automatically via WebhookModule.forRoot().
 * ```
 */
@Processor('webhooks')
export class DeliverWebhookJob extends WorkerHost {
  /** Scoped logger instance. */
  private readonly logger = new Logger(DeliverWebhookJob.name);

  /**
   * @param subscriptionRepo - Repository for querying subscriptions.
   * @param deliveryRepo - Repository for creating delivery records.
   * @param sender - Webhook sender service for performing HTTP delivery.
   * @param staticBackoff - Static array backoff strategy.
   * @param exponentialBackoff - Exponential backoff strategy.
   */
  public constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: EntityRepository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: EntityRepository<WebhookDelivery>,
    private readonly sender: WebhookSender,
    private readonly staticBackoff: StaticArrayBackoffStrategy,
    private readonly exponentialBackoff: ExponentialBackoffStrategy
  ) {
    super();
  }

  // ── Main processor ────────────────────────────────────────────────────

  /**
   * Process a webhook delivery job.
   *
   * Creates a delivery record, sends the webhook via WebhookSender,
   * and handles retry logic based on the delivery outcome.
   *
   * @param job - The BullMQ job containing delivery data.
   * @returns The delivery ID on success.
   * @throws Error on retryable failures (triggers BullMQ retry).
   */
  public async process(job: Job<IDeliverJobData>): Promise<string> {
    const { subscriptionId, eventId, eventName, eventVersion, payload } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;

    this.logger.log(
      `Processing delivery: event="${eventName}" subscription="${subscriptionId}" attempt=${attempt}`
    );

    // Load subscription
    const subscription = await this.subscriptionRepo.findOne({
      id: subscriptionId,
    } as any);

    if (!subscription) {
      this.logger.warn(`Subscription "${subscriptionId}" not found — skipping delivery`);
      return 'skipped:not_found';
    }

    // Guard: skip disabled/paused subscriptions
    if (subscription.state === SubscriptionState.DISABLED) {
      throw new SubscriptionDisabledError(subscriptionId);
    }

    if (subscription.state === SubscriptionState.PAUSED) {
      this.logger.debug(`Subscription "${subscriptionId}" is paused — skipping delivery`);
      return 'skipped:paused';
    }

    // Create delivery record
    const em = this.deliveryRepo.getEntityManager();
    const delivery = em.create(WebhookDelivery, {
      subscription_id: subscriptionId,
      owner_id: subscription.owner_id,
      event_name: eventName,
      event_version: eventVersion ?? undefined,
      event_id: eventId,
      payload,
      state: DeliveryState.PENDING,
      attempt,
      max_attempts: subscription.max_attempts ?? 5,
    } as any);

    em.persist(delivery);
    await em.flush();

    // Send via WebhookSender
    const result = await this.sender.send(delivery, subscription);

    // Handle outcome
    if (delivery.state === DeliveryState.DELIVERED) {
      this.logger.log(
        `Delivery "${delivery.id}" succeeded (${result.status_code}, ${result.duration_ms}ms)`
      );
      return delivery.id;
    }

    if (delivery.state === DeliveryState.FAILED_PERMANENT) {
      this.logger.warn(
        `Delivery "${delivery.id}" permanently failed (status=${result.status_code})`
      );
      return delivery.id;
    }

    // Retryable failure — check if we have attempts remaining
    if (delivery.state === DeliveryState.FAILED) {
      if (attempt >= delivery.max_attempts) {
        // Exhausted all attempts — mark as permanent failure
        delivery.state = DeliveryState.FAILED_PERMANENT;
        delivery.completed_at = new Date();
        await this.deliveryRepo.getEntityManager().flush();

        this.logger.warn(
          `Delivery "${delivery.id}" exhausted all ${delivery.max_attempts} attempts`
        );
        return delivery.id;
      }

      // Compute backoff delay for BullMQ retry
      const delay = this.computeBackoff(attempt, subscription);
      delivery.next_retry_at = new Date(Date.now() + delay);
      await this.deliveryRepo.getEntityManager().flush();

      // Throw to trigger BullMQ retry with the computed delay
      const error = new Error(
        `Delivery failed (attempt ${attempt}/${delivery.max_attempts}): ` +
          `status=${result.status_code ?? 'network_error'}, retrying in ${Math.round(delay / 1000)}s`
      );
      (error as any).retryDelay = delay;
      throw error;
    }

    return delivery.id;
  }

  // ── Backoff computation ───────────────────────────────────────────────

  /**
   * Compute the backoff delay for the next retry attempt.
   *
   * Strategy selection order:
   * 1. Subscription's `backoff_strategy` field (if set)
   * 2. Subscription's `backoff_seconds` array (if set) → StaticArrayBackoff
   * 3. Global default → StaticArrayBackoff with default delays
   *
   * @param attempt - The current attempt number (1-based).
   * @param subscription - The subscription with backoff configuration.
   * @returns Delay in milliseconds before the next retry.
   */
  private computeBackoff(attempt: number, subscription: WebhookSubscription): number {
    const config = {
      backoff_seconds: subscription.backoff_seconds ?? undefined,
      max_attempts: subscription.max_attempts ?? 5,
    };

    // Use subscription's configured strategy
    if (subscription.backoff_strategy === 'exponential') {
      return this.exponentialBackoff.computeDelay(attempt, config);
    }

    // Default: static array backoff
    return this.staticBackoff.computeDelay(attempt, config);
  }

  // ── Worker event handlers ─────────────────────────────────────────────

  /**
   * Handler invoked when a delivery job completes successfully.
   *
   * @param job - The completed job.
   */
  @OnWorkerEvent('completed')
  public onCompleted(job: Job<IDeliverJobData>): void {
    this.logger.debug(
      `Job completed: event="${job.data.eventName}" subscription="${job.data.subscriptionId}"`
    );
  }

  /**
   * Handler invoked when a delivery job fails permanently.
   *
   * @param job - The failed job (may be undefined).
   * @param error - The error that caused the failure.
   */
  @OnWorkerEvent('failed')
  public onFailed(job: Job<IDeliverJobData> | undefined, error: Error): void {
    if (job) {
      this.logger.error(
        `Job permanently failed: event="${job.data.eventName}" ` +
          `subscription="${job.data.subscriptionId}": ${error.message}`
      );
    } else {
      this.logger.error(`A delivery job failed without reference: ${error.message}`);
    }
  }
}
