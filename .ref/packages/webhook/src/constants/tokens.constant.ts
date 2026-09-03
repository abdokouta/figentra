/**
 * @file tokens.constant.ts
 * @module @stackra/nestjs-webhook/constants
 * @description Internal DI tokens and event name constants for the webhook module.
 *   These are package-internal — cross-package tokens belong in @stackra/contracts.
 */

// ============================================================================
// DI Tokens
// ============================================================================

/**
 * DI token for the resolved webhook configuration object.
 */
export const WEBHOOK_CONFIG = Symbol.for('WEBHOOK_CONFIG');

/**
 * DI token for the payload filter implementation.
 */
export const PAYLOAD_FILTER = Symbol.for('WEBHOOK_PAYLOAD_FILTER');

// ============================================================================
// Event Names
// ============================================================================

/**
 * Webhook lifecycle event names.
 *
 * Emitted via IPubSubDriver with fail-open pattern. Other modules can
 * subscribe to these events for alerting, metrics, or side effects.
 */
export const WEBHOOK_EVENTS = {
  /** Emitted when a delivery reaches Delivered state. */
  DELIVERY_SUCCEEDED: 'webhook.delivery.succeeded',

  /** Emitted when a delivery reaches FailedPermanent state. */
  DELIVERY_FAILED: 'webhook.delivery.failed',

  /** Emitted when a subscription transitions to Disabled state. */
  SUBSCRIPTION_DISABLED: 'webhook.subscription.disabled',

  /** Emitted when a health probe fails beyond the threshold. */
  PROBE_FAILED: 'webhook.probe.failed',
} as const;
