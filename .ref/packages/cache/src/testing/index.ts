/**
 * @file index.ts
 * @module @stackra/cache/testing
 * @description Mock cache manager for testing. Provides an in-memory, assertable
 *   implementation of ICacheManager that records all operations.
 *
 *   This is the canonical template for per-package mock implementations.
 *   Other platform packages should follow this same pattern:
 *   1. Create `src/testing/index.ts` in the package
 *   2. Add `./testing` subpath to package.json exports
 *   3. Implement the mock class with working in-memory behavior
 *   4. Export a `createMock{Name}()` factory that wraps with createAssertableProxy
 *
 * @example
 * ```typescript
 * import { createMockCache } from '@stackra/cache/testing';
 *
 * const cache = createMockCache();
 * await cache.set('key', 'value');
 * await cache.get('key'); // returns 'value'
 *
 * cache.assertCalled('get');
 * cache.assertCalledWith('set', 'key', 'value');
 * ```
 */

import { createAssertableProxy } from '@stackra/testing';

// ============================================================================
// Mock Implementation
// ============================================================================

/**
 * In-memory cache manager for testing.
 *
 * Stores values in a Map with optional TTL tracking.
 * All methods mirror the ICacheManager contract.
 */
class MockCacheManager {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  /**
   * Get a value from the cache.
   *
   * @param key - Cache key
   * @returns The cached value, or null if not found / expired
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Set a value in the cache.
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  /**
   * Check if a key exists in the cache (and is not expired).
   *
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from the cache.
   *
   * @param key - Cache key
   * @returns True if the key existed
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get or compute a value (cache-aside pattern).
   *
   * @param key - Cache key
   * @param ttl - TTL in seconds
   * @param factory - Function to compute the value if not cached
   * @returns The cached or computed value
   */
  async remember<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete multiple keys matching a tag/pattern.
   *
   * @param tag - Tag or prefix to match
   */
  async invalidateTag(tag: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(tag)) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an assertable mock cache manager.
 *
 * The returned instance:
 * - Implements the full ICacheManager interface (in-memory Map)
 * - Records all method calls for assertion via `assertCalled()`, `assertCalledWith()`
 * - Supports return value stubbing via `returns()`
 * - Auto-resets between tests when used with `@stackra/testing/setup`
 *
 * @returns Mock cache manager with Assertable methods
 */
export function createMockCache() {
  return createAssertableProxy(new MockCacheManager());
}

// Re-export the class for type usage
export { MockCacheManager };
