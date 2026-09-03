/**
 * @file redis-timeout.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a Redis command or connection exceeds the
 *   configured timeout threshold.
 */

import { RedisError } from './redis.error';

/**
 * Redis timeout error.
 *
 * Thrown when a command exceeds the configured command timeout or
 * a connection attempt exceeds the connect timeout.
 */
export class RedisTimeoutError extends RedisError {
  /** The timeout threshold in milliseconds that was exceeded. */
  public readonly timeoutMs: number;

  /**
   * @param message - Human-readable error description.
   * @param connection - The connection name.
   * @param timeoutMs - The timeout threshold that was exceeded.
   * @param command - The command that timed out.
   * @param cause - The original upstream error.
   */
  public constructor(
    message: string,
    connection: string,
    timeoutMs: number,
    command?: string,
    cause?: Error
  ) {
    super(message, connection, command, cause);
    this.name = 'RedisTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
