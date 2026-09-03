/**
 * @file webhook-sender.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Service that performs the actual HTTP delivery for a single webhook.
 *   Signs the payload, selects the destination driver, delivers, records the result
 *   on the delivery entity, updates subscription stats, and transitions delivery state.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@stackra/nestjs-orm';
import { EntityRepository } from '@mikro-orm/core';
import type { IPubSubDriver, IPubSubMessage } from '@stackra/contracts';
import { IPUBSUB_SERVICE } from '@stackra/contracts';

import type { IWebhookConfig, IDeliveryResult } from '../interfaces';
import { DestinationManager } from './destination-manager.service';
import { WebhookSigner } from './webhook-signer.service';
import { WebhookDelivery } from '../entities';
import { WebhookSubscription } from '../entities';
import { DeliveryState, SubscriptionState } from '../enums';
import { WEBHOOK_CONFIG, WEBHOOK_EVENTS } from '../constants';

// ============================================================================
// Service
// ============================================================================

/**
 * Webhook delivery sender.
 *
 * Performs the actual HTTP request for a single delivery attempt:
 * 1. Signs the payload using the subscription's secret and algorithm
 * 2. Selects the appropriate destination driver
 * 3. Delivers the payload with configured headers
 * 4. Records the result on the delivery entity (status, duration, response)
 * 5. Updates subscription statistics (attempts, successes, failures)
 * 6. Transitions delivery state based on the status code policy
 * 7. Auto-disables subscription when consecutive failures exceed threshold
 *
 * @example
 * ```typescript
 * await sender.send(delivery, subscription);
 * ```
 */
@IInjectable()
export class WebhookSender {
  /** Scoped logger instance. */
  private readonly logger = new Logger(WebhookSender.name);

  /**
   * @param destinationManager - Multi-driver destination manager.
   * @param signer - HMAC signature service.
   * @param deliveryRepo - Repository for persisting delivery results.
   * @param config - Global webhook configuration.
   * @param pubsub - Optional PubSub driver for emitting lifecycle events.
   */
  public constructor(
    private readonly destinationManager: DestinationManager,
    private readonly signer: WebhookSigner,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: EntityRepository<WebhookDelivery>,
    @Inject(WEBHOOK_CONFIG)
    private readonly config: IWebhookConfig,
    @Optional()
    @Inject(IPUBSUB_SERVICE)
    private readonly pubsub?: IPubSubDriver
  ) {}

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Send a webhook delivery to the subscription's endpoint.
   *
   * Signs the payload, delivers via the appropriate destination driver,
   * records the result, updates subscription stats, and transitions state.
   *
   * @param delivery - The webhook delivery entity to send.
   * @param subscription - The target subscription entity.
   * @returns The delivery result from the destination driver.
   */
  public async send(
    delivery: WebhookDelivery,
    subscription: WebhookSubscription
  ): Promise<IDeliveryResult> {
    // Mark delivery as in-flight
    delivery.state = DeliveryState.IN_FLIGHT;
    delivery.attempted_at = new Date();
    await this.deliveryRepo.getEntityManager().flush();

    // Serialize payload
    const payloadString = JSON.stringify(delivery.payload);

    // Build signed headers
    const signedHeaders = this.signer.buildHeaders(
      delivery.id,
      delivery.event_name,
      delivery.attempt,
      payloadString,
      {
        secret: subscription.secret,
        signature_algorithm: subscription.signature_algorithm,
        secret_previous: subscription.secret_previous,
        secret_rotated_at: subscription.secret_rotated_at,
      }
    );

    // Merge custom subscription headers
    const allHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.config.defaults.user_agent,
      ...((subscription.headers as Record<string, string>) ?? {}),
      ...signedHeaders,
    };

    // Get destination driver
    const destination = this.destinationManager.instance(subscription.destination ?? 'https');

    // Deliver
    const result = await destination.deliver({
      url: subscription.url,
      method: subscription.http_verb ?? this.config.defaults.http_verb,
      headers: allHeaders,
      body: payloadString,
      timeout_seconds: subscription.timeout_seconds ?? this.config.defaults.timeout_seconds,
      compress: subscription.compress_payload ?? this.config.defaults.compress_payload,
      verify_ssl: subscription.verify_ssl ?? this.config.defaults.verify_ssl,
      destination_config: subscription.destination_config ?? undefined,
    });

    // Record result on delivery
    this.recordResult(delivery, result, signedHeaders);

    // Transition delivery state based on status code policy
    this.transitionDeliveryState(delivery, result);

    // Update subscription stats
    this.updateSubscriptionStats(subscription, delivery, result);

    // Persist all changes
    await this.deliveryRepo.getEntityManager().flush();

    // Emit lifecycle events (fail-open)
    this.emitLifecycleEvent(delivery, subscription);

    return result;
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Record the delivery result on the delivery entity.
   *
   * @param delivery - The delivery entity to update.
   * @param result - The result from the destination driver.
   * @param requestHeaders - The request headers that were sent.
   */
  private recordResult(
    delivery: WebhookDelivery,
    result: IDeliveryResult,
    requestHeaders: Record<string, string>
  ): void {
    delivery.status_code = result.status_code ?? undefined;
    delivery.duration_ms = result.duration_ms ?? undefined;
    delivery.response_headers = result.response_headers ?? undefined;
    delivery.response_body = result.response_body
      ? result.response_body.substring(0, this.config.audit.max_response_body_bytes)
      : undefined;
    delivery.response_body_sha256 = result.response_body_sha256 ?? undefined;
    delivery.error_message = result.error_message ?? undefined;
    delivery.request_headers = requestHeaders;
    delivery.signature = requestHeaders[this.config.signing.header_signature] ?? undefined;
  }

  /**
   * Transition the delivery state based on the HTTP status code policy.
   *
   * @param delivery - The delivery entity to transition.
   * @param result - The delivery result containing the status code.
   */
  private transitionDeliveryState(delivery: WebhookDelivery, result: IDeliveryResult): void {
    const statusCode = result.status_code;

    if (statusCode === null || statusCode === undefined) {
      // Network error — retryable
      delivery.state = DeliveryState.FAILED;
      return;
    }

    if (this.config.status_policy.success_codes.includes(statusCode)) {
      delivery.state = DeliveryState.DELIVERED;
      delivery.completed_at = new Date();
      return;
    }

    if (this.config.status_policy.permanent_disable_codes.includes(statusCode)) {
      delivery.state = DeliveryState.FAILED_PERMANENT;
      delivery.completed_at = new Date();
      return;
    }

    if (this.config.status_policy.retryable_codes.includes(statusCode)) {
      delivery.state = DeliveryState.FAILED;
      return;
    }

    // Other 4xx — permanent failure (no retry, no disable)
    delivery.state = DeliveryState.FAILED_PERMANENT;
    delivery.completed_at = new Date();
  }

  /**
   * Update subscription statistics after a delivery attempt.
   *
   * Increments total attempts, updates success/failure counters,
   * resets or increments consecutive failures, and auto-disables
   * the subscription when the failure threshold is exceeded.
   *
   * @param subscription - The subscription entity to update.
   * @param delivery - The delivery entity with the current state.
   * @param result - The delivery result.
   */
  private updateSubscriptionStats(
    subscription: WebhookSubscription,
    delivery: WebhookDelivery,
    result: IDeliveryResult
  ): void {
    subscription.total_attempts = (subscription.total_attempts ?? 0) + 1;
    subscription.last_attempted_at = new Date();

    if (delivery.state === DeliveryState.DELIVERED) {
      // Success
      subscription.consecutive_failures = 0;
      subscription.total_successes = (subscription.total_successes ?? 0) + 1;
      subscription.last_succeeded_at = new Date();
    } else {
      // Failure
      subscription.consecutive_failures = (subscription.consecutive_failures ?? 0) + 1;
      subscription.total_failures = (subscription.total_failures ?? 0) + 1;
      subscription.last_failed_at = new Date();

      // Auto-disable on threshold breach
      const threshold =
        subscription.consecutive_failure_threshold ??
        this.config.defaults.consecutive_failure_threshold;

      if (subscription.consecutive_failures >= threshold) {
        subscription.state = SubscriptionState.DISABLED;
        this.logger.warn(
          `Subscription "${subscription.id}" auto-disabled after ${subscription.consecutive_failures} consecutive failures`
        );
        this.emitSubscriptionDisabled(subscription);
      }

      // Auto-disable on 410 Gone
      if (
        result.status_code !== null &&
        result.status_code !== undefined &&
        this.config.status_policy.permanent_disable_codes.includes(result.status_code)
      ) {
        subscription.state = SubscriptionState.DISABLED;
        this.logger.warn(
          `Subscription "${subscription.id}" auto-disabled due to ${result.status_code} response`
        );
        this.emitSubscriptionDisabled(subscription);
      }
    }
  }

  /**
   * Emit delivery lifecycle events via PubSub (fail-open).
   *
   * @param delivery - The delivery entity.
   * @param subscription - The subscription entity.
   */
  private emitLifecycleEvent(delivery: WebhookDelivery, subscription: WebhookSubscription): void {
    if (delivery.state === DeliveryState.DELIVERED) {
      this.emit(WEBHOOK_EVENTS.DELIVERY_SUCCEEDED, {
        deliveryId: delivery.id,
        subscriptionId: subscription.id,
        eventName: delivery.event_name,
        statusCode: delivery.status_code,
        durationMs: delivery.duration_ms,
      });
    } else if (
      delivery.state === DeliveryState.FAILED_PERMANENT ||
      (delivery.state === DeliveryState.FAILED && delivery.attempt >= delivery.max_attempts)
    ) {
      this.emit(WEBHOOK_EVENTS.DELIVERY_FAILED, {
        deliveryId: delivery.id,
        subscriptionId: subscription.id,
        eventName: delivery.event_name,
        statusCode: delivery.status_code,
        errorMessage: delivery.error_message,
        attempt: delivery.attempt,
      });
    }
  }

  /**
   * Emit subscription disabled event via PubSub (fail-open).
   *
   * @param subscription - The disabled subscription entity.
   */
  private emitSubscriptionDisabled(subscription: WebhookSubscription): void {
    this.emit(WEBHOOK_EVENTS.SUBSCRIPTION_DISABLED, {
      subscriptionId: subscription.id,
      name: subscription.name,
      url: subscription.url,
      consecutiveFailures: subscription.consecutive_failures,
    });
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
