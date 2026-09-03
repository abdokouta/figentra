/**
 * @file rate-limiter-manager.service.ts
 * @module @stackra/nestjs-rate-limit/services
 * @description RateLimiterManager — single-driver manager extending
 *   `Manager<IRateLimiterBackend>` from `@stackra/ts-support`.
 *
 *   Resolves the configured backend at boot time and provides the
 *   high-level `reserve()` / `attempts()` / `reset()` API that all
 *   consumers use. Backend selection is config-driven; custom backends
 *   are registered via `forFeature()` which calls `manager.extend()`.
 *
 *   The Redis backend uses `@stackra/ts-redis`'s `RedisManager` for
 *   connection management — sharing the same connection pool as
 *   `@stackra/nestjs-pubsub` and `@stackra/nestjs-queue`.
 *
 * @example
 * ```typescript
 * // Reserve a token (returns 0 = proceed, >0 = wait N seconds)
 * const wait = await rateLimiter.reserve('user:123', 60, 60);
 * if (wait > 0) throw new TooManyRequestsException(wait);
 *
 * // Full result with headers info
 * const result = await rateLimiter.reserveWithInfo('user:123', 60, 60);
 * res.setHeader('X-RateLimit-Remaining', result.remaining);
 * ```
 */

import { IInjectable, Inject, Optional, type IOnModuleInit } from '@nestjs/common';
import { Manager } from '@stackra/ts-support';
import { REDIS_MANAGER } from '@stackra/contracts';
import type { IRedisManager } from '@stackra/contracts';
import { RATE_LIMIT_CONFIG } from '../constants';
import { MemoryBackend } from '../backends/memory.backend';
import { RedisBackend } from '../backends/redis.backend';
import type { IRateLimiterBackend } from '../interfaces';
import type { IRateLimitConfig } from '../interfaces';
import type { IReserveResult } from '../interfaces';

// ============================================================================
// Service
// ============================================================================

/**
 * RateLimiterManager — unified rate limiting facade.
 *
 * Extends `Manager<IRateLimiterBackend>` from `@stackra/ts-support` to provide:
 * - Backend resolution from config (`memory` or `redis`)
 * - Custom backend registration via `extend(name, creator)` (used by `forFeature()`)
 * - High-level `reserve()` API with token-bucket semantics
 * - `reserveWithInfo()` for full response header data
 * - `attempts()` for current counter inspection
 * - `reset()` for manual bucket clearing
 * - `reserveByPolicy()` for named policy resolution
 *
 * Consumers inject this service and call `reserve()` — they never
 * interact with backends directly.
 */
@IInjectable()
export class RateLimiterManager extends Manager<IRateLimiterBackend> implements IOnModuleInit {
  /** Eagerly resolved Redis backend (set in onModuleInit). */
  private redisBackend: RedisBackend | null = null;

  /**
   * @param config - Resolved rate limit module configuration
   * @param redisManager - Optional RedisManager from `@stackra/ts-redis`.
   *   Required when backend is 'redis'. Injected optionally so the package
   *   doesn't hard-depend on Redis when using the memory backend.
   */
  public constructor(
    @Inject(RATE_LIMIT_CONFIG)
    private readonly config: IRateLimitConfig,
    @Optional()
    @Inject(REDIS_MANAGER)
    private readonly redisManager?: IRedisManager
  ) {
    super();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Eagerly resolve the Redis connection at boot time.
   *
   * This ensures configuration errors surface immediately rather than
   * on the first rate-limited request. The connection is guaranteed to
   * be ready by the time the first request arrives.
   */
  public async onModuleInit(): Promise<void> {
    if (this.config.backend === 'redis') {
      if (!this.redisManager) {
        throw new Error(
          '[@stackra/nestjs-rate-limit] Redis backend requires @stackra/ts-redis. ' +
            'Import RedisModule.forRoot() before RateLimitModule.forRoot({ backend: "redis" }).'
        );
      }

      const connectionName = this.config.redis?.connection;
      const client = await this.redisManager.connection(connectionName);
      this.redisBackend = new RedisBackend(client, this.config.redis?.prefix ?? 'rl:');
    }
  }

  // ==========================================================================
  // Manager Abstract Implementation
  // ==========================================================================

  /**
   * Get the default backend driver name from configuration.
   *
   * @returns The configured backend name (e.g., 'redis', 'memory')
   */
  public getDefaultDriver(): string {
    return this.config.backend;
  }

  // ==========================================================================
  // Backend Factory Methods (Convention: create{Studly}Driver)
  // ==========================================================================

  /**
   * Create the in-memory backend.
   * Suitable for tests, development, and single-instance deployments.
   *
   * @returns A new MemoryBackend instance
   */
  protected createMemoryDriver(): IRateLimiterBackend {
    return new MemoryBackend();
  }

  /**
   * Create the Redis backend from the eagerly resolved connection.
   *
   * The connection is resolved in `onModuleInit()` — by the time this
   * factory is called, the backend is guaranteed to be ready.
   *
   * @returns The pre-initialized RedisBackend instance
   * @throws Error when Redis was not initialized (module ordering issue)
   */
  protected createRedisDriver(): IRateLimiterBackend {
    if (!this.redisBackend) {
      throw new Error(
        '[@stackra/nestjs-rate-limit] Redis backend not initialized. ' +
          'Ensure RedisModule.forRoot() is imported before RateLimitModule.forRoot().'
      );
    }
    return this.redisBackend;
  }

  // ==========================================================================
  // High-Level API
  // ==========================================================================

  /**
   * Try to consume one token from the bucket.
   *
   * Returns 0 when the request may proceed, or a positive number of
   * seconds to wait when the bucket is exhausted.
   *
   * @param key - Bucket identifier (already namespaced by caller)
   * @param limit - Maximum requests permitted in the window
   * @param windowSeconds - Length of the rolling window in seconds
   * @returns 0 to proceed, or seconds to wait before retrying
   *
   * @example
   * ```typescript
   * const wait = await rateLimiter.reserve(`api:${userId}`, 60, 60);
   * if (wait > 0) {
   *   throw new TooManyRequestsException(`Rate limit exceeded. Retry in ${wait}s.`);
   * }
   * ```
   */
  public async reserve(key: string, limit: number, windowSeconds: number): Promise<number> {
    const backend = this.driver();
    const current = await backend.attempts(key);

    if (current >= limit) {
      return backend.availableIn(key);
    }

    await backend.hit(key, windowSeconds);
    return 0;
  }

  /**
   * Reserve with full result information for response headers.
   *
   * Same as `reserve()` but returns a structured result with limit,
   * remaining, and reset timestamp — everything needed for
   * `X-RateLimit-*` response headers.
   *
   * @param key - Bucket identifier
   * @param limit - Maximum requests permitted in the window
   * @param windowSeconds - Length of the rolling window in seconds
   * @returns Full reservation result with header data
   */
  public async reserveWithInfo(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<IReserveResult> {
    const backend = this.driver();
    const current = await backend.attempts(key);

    if (current >= limit) {
      const retryAfter = await backend.availableIn(key);
      return {
        allowed: false,
        retryAfter,
        limit,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + retryAfter,
      };
    }

    await backend.hit(key, windowSeconds);
    const remaining = Math.max(0, limit - current - 1);
    const availableIn = await backend.availableIn(key);

    return {
      allowed: true,
      retryAfter: 0,
      limit,
      remaining,
      resetAt: Math.ceil(Date.now() / 1000) + availableIn,
    };
  }

  /**
   * Get the current attempt count for a bucket.
   *
   * @param key - Bucket identifier
   * @returns Current number of requests recorded in the window
   */
  public async attempts(key: string): Promise<number> {
    return this.driver().attempts(key);
  }

  /**
   * Reset a bucket — clears the counter entirely.
   *
   * Used for testing and operator-initiated clears (e.g., after
   * resolving a false-positive block).
   *
   * @param key - Bucket identifier to reset
   */
  public async reset(key: string): Promise<void> {
    return this.driver().clear(key);
  }

  // ==========================================================================
  // Policy Resolution
  // ==========================================================================

  /**
   * Resolve a named policy from configuration.
   *
   * @param policyName - Policy name (e.g., 'api', 'login', 'webhook')
   * @returns The policy definition or undefined if not found
   */
  public getPolicy(policyName: string): { limit: number; window: number; key: string } | undefined {
    return this.config.policies?.[policyName];
  }

  /**
   * Reserve using a named policy.
   *
   * Resolves the policy from config, interpolates the key template
   * with provided context, and calls `reserve()`.
   *
   * @param policyName - Named policy from config
   * @param context - Key template variables (userId, ownerId, ip, etc.)
   * @returns 0 to proceed, or seconds to wait
   * @throws Error when policy is not configured
   *
   * @example
   * ```typescript
   * const wait = await rateLimiter.reserveByPolicy('api', { userId: '123' });
   * ```
   */
  public async reserveByPolicy(
    policyName: string,
    context: Record<string, string>
  ): Promise<number> {
    const policy = this.getPolicy(policyName);
    if (!policy) {
      throw new Error(`Rate limit policy "${policyName}" is not configured.`);
    }

    const key = this.interpolateKey(policy.key, context);
    return this.reserve(key, policy.limit, policy.window);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Interpolate placeholders in a key template.
   *
   * @param template - Key template with {placeholder} syntax
   * @param context - Values to substitute
   * @returns Interpolated key string
   */
  private interpolateKey(template: string, context: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }
}
