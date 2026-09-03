/**
 * @file reserve-result.interface.ts
 * @module @stackra/nestjs-rate-limit/interfaces
 * @description Result interface returned by the rate limiter's reserve method.
 *   Provides all information needed for response headers and retry logic.
 */

// ============================================================================
// Interface
// ============================================================================

/**
 * Result of a rate limit reservation attempt.
 *
 * Contains all information needed to:
 * - Decide whether to proceed or reject
 * - Set response headers (X-RateLimit-*)
 * - Calculate retry-after delay
 */
export interface IReserveResult {
  /** Whether the request is allowed (wait === 0). */
  readonly allowed: boolean;
  /** Seconds to wait before retrying (0 = proceed immediately). */
  readonly retryAfter: number;
  /** Maximum requests permitted in the window. */
  readonly limit: number;
  /** Remaining requests in the current window. */
  readonly remaining: number;
  /** Unix timestamp (seconds) when the window resets. */
  readonly resetAt: number;
}
