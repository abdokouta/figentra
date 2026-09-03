/**
 * @file redis-config.error.ts
 * @module @stackra/ts-redis/errors
 * @description Thrown when Redis module configuration validation fails
 *   at boot time.
 */

import { RedisError } from './redis.error';

/**
 * Redis configuration error.
 *
 * Thrown during `forRoot()` or `forRootAsync()` when the provided
 * configuration is invalid (missing default, missing driver, etc.).
 * These errors surface at boot time before the application serves traffic.
 */
export class RedisConfigError extends RedisError {
  /**
   * @param message - Human-readable description of the misconfiguration.
   */
  public constructor(message: string) {
    super(message, 'config');
    this.name = 'RedisConfigError';
  }
}
