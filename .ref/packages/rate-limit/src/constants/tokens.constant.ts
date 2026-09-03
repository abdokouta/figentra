/**
 * @file tokens.constant.ts
 * @module @stackra/nestjs-rate-limit/constants
 * @description Internal DI tokens and event name constants for the rate limit module.
 */

// ============================================================================
// DI Tokens
// ============================================================================

/**
 * DI token for the resolved rate limit module configuration.
 */
export const RATE_LIMIT_CONFIG = Symbol.for('RATE_LIMIT_CONFIG');

/**
 * DI token for the RateLimiterManager instance.
 */
export const RATE_LIMITER = Symbol.for('RATE_LIMITER');

// ============================================================================
// Event Names
// ============================================================================

/**
 * Rate limit lifecycle event names.
 *
 * Emitted via IPubSubDriver with fail-open pattern.
 */
export const RATE_LIMIT_EVENTS = {
  /** Emitted when a request is throttled (bucket exhausted). */
  THROTTLED: 'rate-limit.throttled',
  /** Emitted when a bucket is manually reset. */
  RESET: 'rate-limit.reset',
} as const;
