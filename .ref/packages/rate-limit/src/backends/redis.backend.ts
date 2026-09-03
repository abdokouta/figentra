/**
 * @file redis.backend.ts
 * @module @stackra/nestjs-rate-limit/backends
 * @description Redis rate limiter backend using an atomic Lua script.
 *   Production-grade — no race conditions between check and increment.
 *   Uses `IRedisClient` from `@stackra/contracts` (provided by
 *   `@stackra/ts-redis`'s `RedisManager`) for connection management.
 */

import type { IRedisClient } from '@stackra/contracts';
import type { IRateLimiterBackend } from '../interfaces';

// ============================================================================
// Constants
// ============================================================================

/**
 * Lua script: atomically INCR the counter and set EXPIRE on first hit.
 * Returns the new counter value.
 *
 * This eliminates the race window between checking the counter and
 * incrementing it — critical at sustained high throughput.
 */
const HIT_SCRIPT = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, window)
  end
  return count
`;

// ============================================================================
// Backend
// ============================================================================

/**
 * Redis-backed rate limiter using an atomic Lua script.
 *
 * Provides race-condition-free token-bucket rate limiting suitable for
 * multi-instance production deployments. The Lua script ensures that
 * INCR + EXPIRE happen atomically on the Redis server.
 *
 * Uses `IRedisClient` from `@stackra/ts-redis` — shares the same
 * connection pool as `@stackra/nestjs-pubsub` and `@stackra/nestjs-queue`.
 */
export class RedisBackend implements IRateLimiterBackend {
  /** Key prefix for all rate limit buckets. */
  private readonly prefix: string;

  /**
   * Create a new Redis backend.
   *
   * @param connection - An `IRedisClient` instance from `RedisManager`.
   *   Obtained via `redisManager.connection('rate-limit')` or the default.
   * @param prefix - Key prefix for bucket keys (default: 'rl:')
   */
  public constructor(
    private readonly connection: IRedisClient,
    prefix?: string
  ) {
    this.prefix = prefix ?? 'rl:';
  }

  /**
   * Backend identifier.
   *
   * @returns 'redis'
   */
  public name(): string {
    return 'redis';
  }

  /**
   * Atomically increment the counter and set TTL on first hit.
   *
   * @param key - Bucket identifier
   * @param windowSeconds - TTL for the bucket key
   * @returns New counter value after increment
   */
  public async hit(key: string, windowSeconds: number): Promise<number> {
    const result = await this.connection.eval(HIT_SCRIPT, [this.prefixed(key)], [windowSeconds]);

    return Number(result);
  }

  /**
   * Get the current attempt count for a bucket.
   *
   * @param key - Bucket identifier
   * @returns Current counter value (0 if bucket doesn't exist)
   */
  public async attempts(key: string): Promise<number> {
    const value = await this.connection.get(this.prefixed(key));
    return value === null ? 0 : Number(value);
  }

  /**
   * Get seconds remaining until the bucket resets (TTL).
   *
   * @param key - Bucket identifier
   * @returns Seconds until reset (0 if bucket doesn't exist or has no TTL)
   */
  public async availableIn(key: string): Promise<number> {
    const ttl = await this.connection.ttl(this.prefixed(key));
    return Math.max(0, ttl);
  }

  /**
   * Clear a bucket entirely (delete the key).
   *
   * @param key - Bucket identifier
   */
  public async clear(key: string): Promise<void> {
    await this.connection.del(this.prefixed(key));
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Apply the configured prefix to a bucket key.
   *
   * @param key - Raw bucket key
   * @returns Prefixed key for Redis storage
   */
  private prefixed(key: string): string {
    return `${this.prefix}${key}`;
  }
}
