/**
 * @file duration-limiter.service.ts
 * @module @stackra/nestjs-redis/limiters
 * @description Duration limiter (throttle pattern). Restricts the number
 *   of executions within a sliding time window using a Lua-based hash counter.
 *   Mirrors Laravel's DurationLimiter.
 */

import { IInjectable, Inject } from '@nestjs/common';

import type { IRedisManager, ILimiterResult } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';
import { LimiterTimeoutError, DURATION_ACQUIRE_SCRIPT } from '../../core/index';
import { DEFAULT_LIMITER_BLOCK_TIMEOUT, DEFAULT_LIMITER_SLEEP_MS } from '../../core/constants';

/**
 * Duration limiter service (throttle pattern).
 *
 * Restricts the number of executions within a sliding time window.
 * Uses a Lua script with a hash containing `start`, `end`, and `count`
 * fields for atomic window management.
 */
@IInjectable()
export class DurationLimiterService {
  /**
   * @param manager - Redis manager for client access.
   */
  public constructor(@Inject(REDIS_MANAGER) private readonly manager: IRedisManager) {}

  /**
   * Attempt to acquire permission within the rate limit.
   *
   * @param name - The limiter name (resource identifier).
   * @param maxAttempts - Maximum attempts allowed per window.
   * @param decaySeconds - Window duration in seconds.
   * @returns The limiter result with remaining attempts.
   */
  public async acquire(
    name: string,
    maxAttempts: number,
    decaySeconds: number
  ): Promise<ILimiterResult> {
    const client = await this.manager.connection();
    const now = Date.now() / 1000;

    const results = (await client.eval(
      DURATION_ACQUIRE_SCRIPT,
      [name],
      [String(now), String(Math.floor(now)), decaySeconds, maxAttempts]
    )) as [number, number, number];

    const allowed = Boolean(results[0]);
    const decaysAt = Number(results[1]);
    const remaining = Math.max(0, Number(results[2]));

    return {
      allowed,
      remaining,
      decaysAt,
      retryAfter: allowed ? undefined : decaysAt - Math.floor(now),
    };
  }

  /**
   * Check if the limit has been exceeded without consuming an attempt.
   *
   * @param name - The limiter name.
   * @param maxAttempts - Maximum attempts allowed per window.
   * @param decaySeconds - Window duration in seconds.
   * @returns `true` if the limit is exceeded.
   */
  public async tooManyAttempts(
    name: string,
    maxAttempts: number,
    _decaySeconds: number
  ): Promise<boolean> {
    const client = await this.manager.connection();
    const exists = await client.exists(name);
    if (!exists) return false;

    const count = await client.hget(name, 'count');
    return count !== null && Number(count) >= maxAttempts;
  }

  /**
   * Clear the limiter state for a resource.
   *
   * @param name - The limiter name.
   */
  public async clear(name: string): Promise<void> {
    const client = await this.manager.connection();
    await client.del(name);
  }

  /**
   * Execute a callback within the rate limit.
   *
   * @param name - The limiter name.
   * @param maxAttempts - Maximum attempts per window.
   * @param decaySeconds - Window duration in seconds.
   * @param timeout - Maximum wait time in seconds.
   * @param callback - The rate-limited operation.
   * @param sleepMs - Sleep between retries in milliseconds.
   * @returns The callback's return value.
   * @throws {LimiterTimeoutError} If permission cannot be acquired within timeout.
   */
  public async block<T>(
    name: string,
    maxAttempts: number,
    decaySeconds: number,
    timeout: number = DEFAULT_LIMITER_BLOCK_TIMEOUT,
    callback: () => Promise<T> | T,
    sleepMs: number = DEFAULT_LIMITER_SLEEP_MS
  ): Promise<T> {
    const startTime = Date.now();
    const client = await this.manager.connection();

    while (true) {
      const result = await this.acquire(name, maxAttempts, decaySeconds);

      if (result.allowed) {
        return callback();
      }

      if ((Date.now() - startTime) / 1000 >= timeout) {
        throw new LimiterTimeoutError(name, client.getName());
      }

      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }
}
