/**
 * @file delivery-state.enum.ts
 * @module @stackra/nestjs-webhook/enums
 * @description Delivery state machine enum.
 *   Tracks the lifecycle of a single webhook delivery attempt from
 *   creation through completion or permanent failure.
 */

// ============================================================================
// Enum
// ============================================================================

/**
 * Webhook delivery state machine.
 *
 * - **PENDING** — delivery created, waiting to be processed.
 * - **IN_FLIGHT** — delivery is currently being sent.
 * - **DELIVERED** — terminal success; receiver acknowledged.
 * - **FAILED** — transient failure; eligible for retry.
 * - **FAILED_PERMANENT** — terminal failure; no more retries.
 */
export enum DeliveryState {
  /** Delivery is queued and waiting to be processed. */
  PENDING = 'pending',

  /** Delivery is currently being sent to the receiver. */
  IN_FLIGHT = 'in_flight',

  /** Delivery succeeded (terminal state). */
  DELIVERED = 'delivered',

  /** Delivery failed but is eligible for retry. */
  FAILED = 'failed',

  /** Delivery permanently failed (terminal state). */
  FAILED_PERMANENT = 'failed_permanent',
}
