/**
 * @file lock-timeout.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when a distributed lock cannot be acquired within
 *   the configured timeout period.
 */

import { RedisError } from './redis.error';

/**
 * Lock timeout error.
 *
 * Thrown when the LockService cannot acquire a distributed lock
 * within the configured retry timeout. The caller should decide
 * whether to retry, fail, or use a fallback strategy.
 */
export class LockTimeoutError extends RedisError {
  /** The resource that could not be locked. */
  public readonly resource: string;

  /**
   * @param resource - The resource identifier that could not be locked.
   * @param connection - The connection name.
   */
  public constructor(resource: string, connection: string) {
    super(
      `Failed to acquire lock on "${resource}" within the configured timeout.`,
      connection,
      'SET'
    );
    this.name = 'LockTimeoutError';
    this.resource = resource;
  }
}
