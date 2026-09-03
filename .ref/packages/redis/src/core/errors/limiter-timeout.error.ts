/**
 * @file limiter-timeout.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a rate limiter cannot acquire a slot or
 *   permission within the configured timeout period.
 */

import { RedisError } from './redis.error';

/**
 * Limiter timeout error.
 *
 * Thrown when the ConcurrencyLimiter or DurationLimiter cannot acquire
 * a slot/permission within the configured block timeout. The caller
 * should decide whether to retry, fail, or use a fallback strategy.
 */
export class LimiterTimeoutError extends RedisError {
  /** The limiter name that timed out. */
  public readonly limiterName: string;

  /**
   * @param limiterName - The limiter resource name.
   * @param connection - The connection name.
   */
  public constructor(limiterName: string, connection: string) {
    super(`Limiter "${limiterName}" timed out waiting for a slot/permission.`, connection, 'EVAL');
    this.name = 'LimiterTimeoutError';
    this.limiterName = limiterName;
  }
}
