/**
 * @file secret-rotator.service.ts
 * @module @stackra/nestjs-webhook/services
 * @description Service for managing webhook secret rotation.
 *   Delegates to WebhookSubscriptionService for the actual rotation logic.
 *   Used by the clear-rotated-secrets scheduled task.
 */

import { IInjectable, Logger } from '@nestjs/common';

import { WebhookSubscriptionService } from './webhook-subscription.service';
import { WebhookSubscription } from '../entities';

// ============================================================================
// Service
// ============================================================================

/**
 * Secret rotation service.
 *
 * Provides a focused API for secret rotation operations, delegating to
 * `WebhookSubscriptionService` for the actual state changes. Used by
 * the `ClearRotatedSecretsTask` to clean up expired rotation windows.
 *
 * @example
 * ```typescript
 * // Rotate a subscription's secret
 * await secretRotator.rotate(subscriptionId);
 *
 * // Rotate with a specific new secret
 * await secretRotator.rotate(subscriptionId, 'new-secret-value');
 * ```
 */
@IInjectable()
export class SecretRotator {
  /** Scoped logger instance. */
  private readonly logger = new Logger(SecretRotator.name);

  /**
   * @param subscriptionService - Webhook subscription service for rotation operations.
   */
  public constructor(private readonly subscriptionService: WebhookSubscriptionService) {}

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Rotate the secret for a webhook subscription.
   *
   * Copies the current secret to `secret_previous`, sets a new secret,
   * and records the rotation timestamp. During the grace window, both
   * old and new signatures are sent with deliveries.
   *
   * @param subscriptionId - The subscription UUID to rotate.
   * @param newSecret - Optional new secret. Auto-generated if not provided.
   * @returns The updated subscription entity.
   */
  public async rotate(subscriptionId: string, newSecret?: string): Promise<WebhookSubscription> {
    this.logger.log(`Rotating secret for subscription "${subscriptionId}"`);
    return this.subscriptionService.rotateSecret(subscriptionId, newSecret);
  }
}
