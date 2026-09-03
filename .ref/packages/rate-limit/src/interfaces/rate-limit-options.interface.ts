/**
 * @file rate-limit-options.interface.ts
 * @module @stackra/rate-limit/src/interfaces
 * @description IRateLimitOptions interface.
 */

/**
 * Options for the `@RateLimit()` decorator.
 *
 * Either provide `policy` (resolved from config) OR inline `limit` + `window`.
 */
export interface IRateLimitOptions {
  /** Named policy from `RateLimitModule.forRoot({ policies })`. */
  readonly policy?: string;
  /** Maximum requests in the window (required when policy is not set). */
  readonly limit?: number;
  /** Window length in seconds (required when policy is not set). */
  readonly window?: number;
  /**
   * Bucket key template with placeholder support.
   * Placeholders: {userId}, {ownerId}, {ip}, {method}
   * Default: 'ip:{ip}' when using inline config.
   */
  readonly key?: string;
  /** Skip rate limiting for this route (useful for overriding class-level). */
  readonly skip?: boolean;
}
