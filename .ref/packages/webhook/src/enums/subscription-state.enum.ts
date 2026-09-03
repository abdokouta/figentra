/**
 * @file subscription-state.enum.ts
 * @module @stackra/nestjs-webhook/enums
 * @description Subscription state machine enum.
 *   Three states: Active (receives deliveries), Paused (manual hold),
 *   Disabled (terminal — auto-set after persistent failures or 410).
 */

// ============================================================================
// Enum
// ============================================================================

/**
 * Webhook subscription state machine.
 *
 * - **ACTIVE** — subscription receives deliveries during fan-out.
 * - **PAUSED** — manually paused by operator; skipped during fan-out.
 * - **DISABLED** — terminal state; auto-set when consecutive failures
 *   exceed threshold or receiver returns 410 Gone.
 */
export enum SubscriptionState {
  /** Subscription is active and receives deliveries. */
  ACTIVE = 'active',

  /** Subscription is manually paused (can be resumed). */
  PAUSED = 'paused',

  /** Subscription is permanently disabled (terminal state). */
  DISABLED = 'disabled',
}
