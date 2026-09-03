/**
 * @file memory.backend.ts
 * @module @stackra/nestjs-rate-limit/backends
 * @description In-memory rate limiter backend for development and single-instance deployments.
 *   Uses a Map with TTL-based expiration. Not suitable for multi-instance production
 *   environments — use the Redis backend instead.
 */

import { IInjectable } from '@nestjs/common';

import type { IRateLimiterBackend } from '../interfaces';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal bucket state for the memory backend.
 */
interface IBucket {
  /** Current hit count in this window. */
  count: number;
  /** Unix timestamp (ms) when this bucket expires. */
  expiresAt: number;
}

// ============================================================================
// Backend
// ============================================================================

/**
 * Volatile in-memory rate limiter backend.
 *
 * Stores counters in a `Map` with lazy expiration on access.
 * Suitable for development, testing, and single-instance deployments.
 *
 * Characteristics:
 * - Zero external dependencies
 * - Per-process state (not shared across instances)
 * - Lazy cleanup on access (no background timer)
 * - Periodic sweep every 1000 operations to prevent memory leaks
 *
 * @example
 * ```typescript
 * const backend = new MemoryBackend();
 * const count = await backend.hit('user:123', 60);
 * ```
 */
@IInjectable()
export class MemoryBackend implements IRateLimiterBackend {
  /** Internal bucket storage. */
  private readonly buckets: Map<string, IBucket> = new Map();

  /** Operation counter for periodic sweep. */
  private operationCount: number = 0;

  /** Sweep interval (every N operations). */
  private static readonly SWEEP_INTERVAL: number = 1000;

  /**
   * Returns the backend identifier.
   *
   * @returns The string 'memory'
   */
  public name(): string {
    return 'memory';
  }

  /**
   * Increment the counter for a bucket and return the new count.
   * Creates the bucket with TTL on first hit.
   *
   * @param key - Bucket identifier (already namespaced by caller)
   * @param windowSeconds - TTL for the bucket key in seconds
   * @returns The new counter value after increment
   */
  public async hit(key: string, windowSeconds: number): Promise<number> {
    this.maybeSweep();
    this.expireIfStale(key);

    const existing = this.buckets.get(key);

    if (existing) {
      existing.count += 1;
      return existing.count;
    }

    const bucket: IBucket = {
      count: 1,
      expiresAt: Date.now() + windowSeconds * 1000,
    };

    this.buckets.set(key, bucket);
    return 1;
  }

  /**
   * Get the current attempt count for a bucket.
   *
   * @param key - Bucket identifier
   * @returns Current counter value (0 if bucket doesn't exist or expired)
   */
  public async attempts(key: string): Promise<number> {
    this.expireIfStale(key);
    const bucket = this.buckets.get(key);
    return bucket?.count ?? 0;
  }

  /**
   * Get seconds remaining until the bucket resets (TTL).
   *
   * @param key - Bucket identifier
   * @returns Seconds until reset (0 if bucket doesn't exist or expired)
   */
  public async availableIn(key: string): Promise<number> {
    this.expireIfStale(key);
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return 0;
    }

    const remainingMs = bucket.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * Clear a bucket entirely (reset counter).
   *
   * @param key - Bucket identifier
   */
  public async clear(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  /**
   * Drop the entry when its window has elapsed.
   *
   * @param key - Bucket identifier to check
   */
  private expireIfStale(key: string): void {
    const bucket = this.buckets.get(key);

    if (bucket && bucket.expiresAt <= Date.now()) {
      this.buckets.delete(key);
    }
  }

  /**
   * Periodically sweep all expired entries to prevent memory leaks
   * in long-running processes.
   */
  private maybeSweep(): void {
    this.operationCount += 1;

    if (this.operationCount < MemoryBackend.SWEEP_INTERVAL) {
      return;
    }

    this.operationCount = 0;
    const now = Date.now();

    for (const [key, bucket] of this.buckets) {
      if (bucket.expiresAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
