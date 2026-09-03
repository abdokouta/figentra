/**
 * @file redis-result.store.ts
 * @module @stackra/nestjs-health/stores
 * @description Redis-backed result store for persistent, multi-instance health history.
 *   Uses sorted sets for time-ordered storage with automatic TTL-based expiration.
 *   Shared across cluster nodes — all instances see the same health history.
 *
 *   Requires `@stackra/ts-redis` to be configured in the application.
 *   The Redis connection is injected via the `HEALTH_REDIS_CONNECTION` token.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import type { IResultStore, IAggregatedHealthResult } from '@stackra/contracts';

/**
 * DI token for the Redis connection used by the health store.
 * Injected from the app's Redis configuration.
 */
export const HEALTH_REDIS_CONNECTION = Symbol.for('HEALTH_REDIS_CONNECTION');

/**
 * Redis result store — persistent, multi-instance health history.
 *
 * Stores health check results in a Redis sorted set keyed by timestamp.
 * All application instances share the same history, enabling:
 * - Cluster-wide health dashboards
 * - Cross-instance trend analysis
 * - Persistent history surviving restarts
 *
 * @example
 * ```typescript
 * NestHealthModule.forRoot({
 *   resultStore: RedisResultStore,
 * });
 * ```
 */
@IInjectable()
export class RedisResultStore implements IResultStore {
  private readonly logger = new Logger(RedisResultStore.name);
  private readonly prefix: string;
  private readonly maxResults: number;
  private readonly ttlSeconds: number;

  /**
   * @param redis - Redis client instance
   * @param config - Store configuration
   */
  public constructor(
    @Optional() @Inject(HEALTH_REDIS_CONNECTION) private readonly redis?: IRedisClient,
    @Optional() @Inject('HEALTH_REDIS_STORE_CONFIG') config?: IRedisResultStoreConfig
  ) {
    this.prefix = config?.prefix ?? 'health:results';
    this.maxResults = config?.maxResults ?? 1000;
    this.ttlSeconds = config?.ttlSeconds ?? 86400;
  }

  /**
   * Store a health check result in Redis sorted set.
   * Score is the timestamp for time-ordered retrieval.
   *
   * @param result - The aggregated result to store
   */
  public async store(result: IAggregatedHealthResult): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redis client not available — health result not persisted.');
      return;
    }

    try {
      const score = result.timestamp.getTime();
      const member = JSON.stringify(this.serialize(result));

      await this.redis.zadd(this.prefix, score, member);
      await this.redis.expire(this.prefix, this.ttlSeconds);

      // Trim to max results (remove oldest)
      const count = await this.redis.zcard(this.prefix);
      if (count > this.maxResults) {
        await this.redis.zremrangebyrank(this.prefix, 0, count - this.maxResults - 1);
      }
    } catch (err: Error | any) {
      this.logger.warn(`Failed to store health result in Redis: ${(err as Error).message}`);
    }
  }

  /**
   * Get the most recent stored result.
   *
   * @returns The latest result, or null when empty
   */
  public async getLatest(): Promise<IAggregatedHealthResult | null> {
    if (!this.redis) return null;

    try {
      const results = await this.redis.zrevrangebyscore(
        this.prefix,
        '+inf',
        '-inf',
        'LIMIT',
        '0',
        '1'
      );

      if (!results || results.length === 0) return null;
      return this.deserialize(JSON.parse(results[0]!));
    } catch (err: Error | any) {
      this.logger.warn(`Failed to read latest health result from Redis: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Get the N most recent results in reverse chronological order.
   *
   * @param limit - Number of results to retrieve
   * @returns Array of results (most recent first)
   */
  public async getHistory(limit: number): Promise<IAggregatedHealthResult[]> {
    if (!this.redis) return [];

    try {
      const clampedLimit = Math.min(Math.max(1, limit), 1000);
      const results = await this.redis.zrevrangebyscore(
        this.prefix,
        '+inf',
        '-inf',
        'LIMIT',
        '0',
        String(clampedLimit)
      );

      return (results ?? []).map((raw) => this.deserialize(JSON.parse(raw)));
    } catch (err: Error | any) {
      this.logger.warn(`Failed to read health history from Redis: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Remove results older than the specified date.
   *
   * @param olderThan - Cutoff date
   * @returns Number of pruned entries
   */
  public async prune(olderThan: Date): Promise<number> {
    if (!this.redis) return 0;

    try {
      const cutoffScore = olderThan.getTime();
      return await this.redis.zremrangebyrank(this.prefix, 0, cutoffScore);
    } catch (err: Error | any) {
      this.logger.warn(`Failed to prune health results from Redis: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private — Serialization
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Serialize an aggregated result for Redis storage.
   * Converts Date objects to ISO strings.
   *
   * @param result - Result to serialize
   * @returns Serializable object
   */
  private serialize(result: IAggregatedHealthResult): Record<string, unknown> {
    return {
      status: result.status,
      timestamp: result.timestamp.toISOString(),
      duration: result.duration,
      results: Object.fromEntries(
        Object.entries(result.results).map(([name, r]) => [
          name,
          {
            ...r,
            startedAt: r.startedAt.toISOString(),
            endedAt: r.endedAt?.toISOString(),
          },
        ])
      ),
    };
  }

  /**
   * Deserialize a stored result back into the IAggregatedHealthResult shape.
   *
   * @param raw - Raw parsed JSON from Redis
   * @returns Hydrated result object
   */
  private deserialize(raw: Record<string, any>): IAggregatedHealthResult {
    return {
      status: raw.status,
      timestamp: new Date(raw.timestamp),
      duration: raw.duration,
      results: Object.fromEntries(
        Object.entries(raw.results ?? {}).map(([name, r]: [string, any]) => [
          name,
          {
            ...r,
            startedAt: new Date(r.startedAt),
            endedAt: r.endedAt ? new Date(r.endedAt) : undefined,
          },
        ])
      ),
    };
  }
}
