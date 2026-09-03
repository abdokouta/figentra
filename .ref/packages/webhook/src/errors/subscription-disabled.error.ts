/**
 * Subscription disabled error.
 *
 * Thrown when an operation is attempted on a subscription that has
 * been permanently disabled (e.g., delivering to a disabled endpoint,
 * resuming a disabled subscription).
 *
 * @module @stackra/nestjs-webhook/errors/subscription-disabled
 */

import { ForbiddenException } from '@nestjs/common';

/**
 * Error thrown when attempting to operate on a disabled subscription.
 *
 * Disabled is a terminal state — subscriptions cannot transition back
 * to Active or Paused once disabled.
 */
export class SubscriptionDisabledError extends ForbiddenException {
  /**
   * Create a new SubscriptionDisabledError.
   *
   * @param subscriptionId - The ID of the disabled subscription
   */
  public constructor(subscriptionId: string) {
    super(
      `Webhook subscription "${subscriptionId}" is disabled and cannot receive deliveries. ` +
        'Disabled is a terminal state — create a new subscription instead.'
    );
  }
}
