/**
 * @file in-memory-result.store.ts
 * @module @stackra/nestjs-health/stores
 * @description Default result store using a bounded circular buffer in memory.
 *   For persistent storage, use `RedisResultStore` or `DatabaseResultStore`.
 */

import { IInjectable } from '@nestjs/common';
import type { IResultStore, IAggregatedHealthResult } from '@stackra/contracts';
import { DEFAULT_STORE_CAPACITY, MIN_STORE_CAPACITY, MAX_STORE_CAPACITY } from '../constants';

/**
 * In-memory result store with bounded circular buffer.
 *
 * Zero external dependencies. Results are lost on process restart.
 * Use DatabaseResultStore for persistent history.
 */
@IInjectable()
export class InMemoryResultStore implements IResultStore {
  private readonly buffer: IAggregatedHealthResult[] = [];
  private readonly maxSize: number;

  /**
   * @param maxSize - Maximum number of entries to keep (1–10000, default 100)
   */
  public constructor(maxSize: number = DEFAULT_STORE_CAPACITY) {
    if (maxSize < MIN_STORE_CAPACITY || maxSize > MAX_STORE_CAPACITY) {
      throw new Error(
        `InMemoryResultStore maxSize must be between ${MIN_STORE_CAPACITY} and ${MAX_STORE_CAPACITY}. Got: ${maxSize}`
      );
    }
    this.maxSize = maxSize;
  }

  /**
   * Store a health check result. Evicts oldest entry when buffer is full.
   *
   * @param result - The aggregated result to store
   */
  public async store(result: IAggregatedHealthResult): Promise<void> {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(result);
  }

  /**
   * Get the most recent stored result.
   *
   * @returns The latest result, or null when empty
   */
  public async getLatest(): Promise<IAggregatedHealthResult | null> {
    if (this.buffer.length === 0) return null;
    return this.buffer[this.buffer.length - 1]!;
  }

  /**
   * Get the N most recent results in reverse chronological order.
   *
   * @param limit - Number of results to retrieve (1–1000)
   * @returns Array of results (most recent first)
   */
  public async getHistory(limit: number): Promise<IAggregatedHealthResult[]> {
    const clampedLimit = Math.min(Math.max(1, limit), 1000);
    return this.buffer.slice(-clampedLimit).reverse();
  }

  /**
   * Remove results older than the specified date.
   *
   * @param olderThan - Cutoff date
   * @returns Number of pruned entries
   */
  public async prune(olderThan: Date): Promise<number> {
    const cutoff = olderThan.getTime();
    const originalLength = this.buffer.length;

    let i = 0;
    while (i < this.buffer.length) {
      if (this.buffer[i]!.timestamp.getTime() < cutoff) {
        this.buffer.splice(i, 1);
      } else {
        i++;
      }
    }

    return originalLength - this.buffer.length;
  }
}
