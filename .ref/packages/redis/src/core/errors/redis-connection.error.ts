/**
 * @file redis-connection.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a Redis connection cannot be established,
 *   is lost, or fails during reconnection attempts.
 */

import { RedisError } from './redis.error';

/**
 * Redis connection error.
 *
 * Thrown when the backend is unreachable, the socket is closed
 * unexpectedly, or all reconnection attempts are exhausted.
 */
export class RedisConnectionError extends RedisError {
  /**
   * @param message - Human-readable error description.
   * @param connection - The connection name.
   * @param cause - The original upstream error.
   */
  public constructor(message: string, connection: string, cause?: Error) {
    super(message, connection, undefined, cause);
    this.name = 'RedisConnectionError';
  }
}
