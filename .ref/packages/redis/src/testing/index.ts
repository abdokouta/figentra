/**
 * @file index.ts
 * @module @stackra/redis/testing
 * @description Mock implementation of IRedisManager for testing.
 *   Provides an in-memory, assertable implementation that records all operations.
 */

import { createAssertableProxy } from '@stackra/testing';

class MockRedisManager {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, _ttl?: number): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return [...this.store.keys()].filter((k) => regex.test(k));
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Create an assertable mock for IRedisManager.
 *
 * @returns Assertable mock with call recording and assertion methods
 */
export function createMockRedis() {
  return createAssertableProxy(new MockRedisManager());
}

export { MockRedisManager };
