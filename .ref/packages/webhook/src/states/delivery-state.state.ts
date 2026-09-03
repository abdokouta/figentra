/**
 * @file delivery-state.state.ts
 * @module packages/platform/nestjs/webhook/states
 * @description State machine configuration for WebhookDelivery.state.
 *   Defines valid transitions between DeliveryState values.
 */

import { defineState } from '@stackra/nestjs-orm';
import { DeliveryState } from '../enums';

// ============================================================================
// State Configuration
// ============================================================================

/**
 * State machine for `WebhookDelivery.state`.
 *
 * Defines the allowed lifecycle transitions for the state field.
 * Used with `@Stateable(WebhookDeliveryStateState)` on the entity class.
 */
export const WebhookDeliveryStateState = defineState({
  name: 'webhook_delivery_state',
  field: 'state',
  enum: DeliveryState,
  default: DeliveryState.PENDING,
  transitions: {
    [DeliveryState.PENDING]: [
      DeliveryState.IN_FLIGHT,
      DeliveryState.DELIVERED,
      DeliveryState.FAILED,
      DeliveryState.FAILED_PERMANENT,
    ],
    [DeliveryState.IN_FLIGHT]: [
      DeliveryState.PENDING,
      DeliveryState.DELIVERED,
      DeliveryState.FAILED,
      DeliveryState.FAILED_PERMANENT,
    ],
    [DeliveryState.DELIVERED]: [
      DeliveryState.PENDING,
      DeliveryState.IN_FLIGHT,
      DeliveryState.FAILED,
      DeliveryState.FAILED_PERMANENT,
    ],
    [DeliveryState.FAILED]: [],
    [DeliveryState.FAILED_PERMANENT]: [],
  },
});
