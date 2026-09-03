/**
 * @file rate-limit-config.interface.ts
 * @module @stackra/nestjs-rate-limit/interfaces
 * @description Configuration interfaces for the rate limit module.
 *   Defines backend selection, Redis connection reference, named policies,
 *   and response headers.
 */

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Root configuration interface for the rate limit module.
 */
export interface IRateLimitConfig {
  /** Backend driver name: 'redis' | 'memory'. Default: 'memory'. */
  readonly backend: string;
  /** Redis backend configuration (connection name + prefix). */
  readonly redis?: IRedisConfig;
  /** Named rate limit policies. */
  readonly policies?: Record<string, IRateLimitPolicy>;
  /** Response header names. */
  readonly headers?: IHeadersConfig;
  /** Whether to include rate limit headers in responses (default: true). */
  readonly includeHeaders?: boolean;
  /**
   * When set, registers the RateLimitGuard globally via APP_GUARD.
   * The value is the default policy name applied to all routes
   * unless overridden by a method/class-level `@RateLimit()` decorator.
   * Set to `false` or omit to disable global guard.
   */
  readonly globalGuard?: string | false;
}
