/**
 * @file subscription-state.state.ts
 * @module packages/platform/nestjs/webhook/states
 * @description State machine configuration for WebhookSubscription.state.
 *   Defines valid transitions between SubscriptionState values.
 */

import { defineState } from '@stackra/nestjs-orm';
import { SubscriptionState } from '../enums';

// ============================================================================
// State Configuration
// ============================================================================

/**
 * State machine for `WebhookSubscription.state`.
 *
 * Defines the allowed lifecycle transitions for the state field.
 * Used with `@Stateable(WebhookSubscriptionStateState)` on the entity class.
 */
export const WebhookSubscriptionStateState = defineState({
  name: 'webhook_subscription_state',
  field: 'state',
  enum: SubscriptionState,
  default: SubscriptionState.ACTIVE,
  transitions: {
    [SubscriptionState.ACTIVE]: [SubscriptionState.PAUSED, SubscriptionState.DISABLED],
    [SubscriptionState.PAUSED]: [SubscriptionState.ACTIVE, SubscriptionState.DISABLED],
    [SubscriptionState.DISABLED]: [SubscriptionState.ACTIVE, SubscriptionState.PAUSED],
  },
});
