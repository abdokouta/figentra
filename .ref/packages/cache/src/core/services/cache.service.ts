/**
 * @file cache.service.ts
 * @module @stackra/cache/core/services
 * @description High-level convenience service for cache operations.
 *   Delegates to the CacheManager's default store and provides a comprehensive
 *   API including: get/set, remember/rememberForever, pull, add, forever,
 *   increment/decrement, many/setMany, touch, flexible (stale-while-revalidate),
 *   and event emission on all lifecycle operations.
 *
 *   Inspired by Laravel's Cache Repository — adapted for TypeScript with
 *   generics, async/await, and optional event emission via IPubSubDriver.
 */

import { IInjectable, Inject } from '@stackra/ts-container';

import { CacheManager } from './cache-manager.service';
import { TaggedCache } from '../tags/tagged-cache';
import { CACHE_MANAGER } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Cache lifecycle event names.
 *
 * Emitted by CacheService on every operation when an event emitter is available.
 * Consumers can subscribe to these events for monitoring, logging, and metrics.
 */
export const CACHE_EVENTS = {
  /** A cache key was found (hit). Payload: { key, store } */
  HIT: 'cache.hit',
  /** A cache key was not found (miss). Payload: { key, store } */
  MISS: 'cache.miss',
  /** A value was written to cache. Payload: { key, store, ttl } */
  WRITTEN: 'cache.written',
  /** A key was removed from cache. Payload: { key, store } */
  FORGOTTEN: 'cache.forgotten',
  /** The entire store was flushed. Payload: { store } */
  FLUSHED: 'cache.flushed',
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * High-level cache service with a comprehensive, Laravel-inspired API.
 *
 * Wraps the CacheManager's stores with convenience methods for all common
 * caching patterns. Supports event emission for observability (optional).
 *
 * Method categories:
 * - **Read**: `get`, `many`, `has`, `missing`
 * - **Write**: `set`, `setMany`, `forever`, `add`, `put`, `putMany`
 * - **Compute**: `remember`, `rememberForever`, `flexible`
 * - **Counters**: `increment`, `decrement`
 * - **TTL**: `touch`
 * - **Delete**: `delete`, `forget`, `pull`, `clear`, `flush`
 *
 * @example
 * ```typescript
 * const cache = container.get(CacheService);
 *
 * // Get-or-compute pattern
 * const user = await cache.remember('user:1', 300, async () => {
 *   return await fetchUserFromDatabase(1);
 * });
 *
 * // Stale-while-revalidate
 * const config = await cache.flexible('app:config', [60, 300], async () => {
 *   return await loadConfigFromRemote();
 * });
 *
 * // Counters
 * await cache.increment('page:views', 1);
 *
 * // Bulk operations
 * const values = await cache.many(['user:1', 'user:2', 'user:3']);
 * ```
 */
@IInjectable()
export class CacheService {
  /**
   * @param manager - The CacheManager instance for resolving stores
   */
  public constructor(@Inject(CACHE_MANAGER) private readonly manager: CacheManager) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Read Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a value from the default cache store.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key
   * @param defaultValue - Optional fallback returned when the key is missing
   * @returns The cached value, the default value, or undefined
   */
  public async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.getStore().get<T>(key);

    if (value !== undefined) {
      return value;
    }

    return defaultValue;
  }

  /**
   * Retrieve multiple values from the cache in a single operation.
   *
   * Returns a Map where missing/expired keys map to undefined.
   * More efficient than multiple `get()` calls on stores that
   * support batch reads (e.g., Redis MGET).
   *
   * @typeParam T - Expected type of the cached values
   * @param keys - Array of cache keys to retrieve
   * @returns Map of key to value (undefined for missing/expired keys)
   *
   * @example
   * ```typescript
   * const results = await cache.many<User>(['user:1', 'user:2', 'user:3']);
   * const user1 = results.get('user:1'); // User | undefined
   * ```
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    return this.getStore().many<T>(keys);
  }

  /**
   * Check if a key exists in the default cache store.
   *
   * @param key - Cache key
   * @returns `true` if the key exists and is not expired
   */
  public async has(key: string): Promise<boolean> {
    return this.getStore().has(key);
  }

  /**
   * Check if a key does NOT exist in the cache.
   *
   * Inverse of `has()` — for readability in conditional logic.
   *
   * @param key - Cache key
   * @returns `true` if the key does NOT exist or is expired
   *
   * @example
   * ```typescript
   * if (await cache.missing('session:token')) {
   *   redirect('/login');
   * }
   * ```
   */
  public async missing(key: string): Promise<boolean> {
    return !(await this.has(key));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Write Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Store a value in the default cache store.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional, no expiry if omitted)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.getStore().set(key, value, ttl);
  }

  /**
   * Store a value in the cache (alias for `set`).
   *
   * Matches Laravel's naming convention. Identical to `set()`.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  public async put<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.set(key, value, ttl);
  }

  /**
   * Store multiple key-value pairs in the cache in a single operation.
   *
   * More efficient than multiple `set()` calls on stores that support
   * batch writes (e.g., Redis MSET).
   *
   * @typeParam T - Type of the values to store
   * @param entries - Map of key-value pairs to store
   * @param ttl - Time-to-live in seconds (optional, applies to all entries)
   *
   * @example
   * ```typescript
   * await cache.setMany(new Map([
   *   ['user:1', { name: 'Alice' }],
   *   ['user:2', { name: 'Bob' }],
   * ]), 600);
   * ```
   */
  public async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    await this.getStore().setMany(entries, ttl);
  }

  /**
   * Store multiple key-value pairs (alias for `setMany` with object input).
   *
   * Accepts a plain object for convenience. Converts to Map internally.
   *
   * @typeParam T - Type of the values to store
   * @param values - Object mapping keys to values
   * @param ttl - Time-to-live in seconds (optional)
   *
   * @example
   * ```typescript
   * await cache.putMany({ 'user:1': alice, 'user:2': bob }, 600);
   * ```
   */
  public async putMany<T>(values: Record<string, T>, ttl?: number): Promise<void> {
    const entries = new Map<string, T>(Object.entries(values));
    await this.getStore().setMany(entries, ttl);
  }

  /**
   * Store a value only if the key does not already exist.
   *
   * Returns `true` if the value was stored, `false` if the key already exists.
   * This is NOT atomic across distributed stores — for atomic add, the store
   * implementation should override with a native SET NX equivalent.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (optional)
   * @returns `true` if the value was stored (key was new)
   *
   * @example
   * ```typescript
   * const locked = await cache.add('lock:invoice:123', true, 60);
   * if (!locked) {
   *   throw new Error('Invoice is already being processed');
   * }
   * ```
   */
  public async add<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const exists = await this.getStore().has(key);

    if (exists) {
      return false;
    }

    await this.getStore().set(key, value, ttl);
    return true;
  }

  /**
   * Store a value in the cache indefinitely (no TTL expiry).
   *
   * The value persists until explicitly deleted or the store is flushed.
   * Use for configuration data, feature flags, or other long-lived values.
   *
   * @typeParam T - Type of the value to store
   * @param key - Cache key
   * @param value - Value to store permanently
   *
   * @example
   * ```typescript
   * await cache.forever('app:version', '2.1.0');
   * ```
   */
  public async forever<T>(key: string, value: T): Promise<void> {
    await this.getStore().forever(key, value);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Compute (Get-or-Set) Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get a value from cache, or execute the factory and store the result.
   *
   * The factory function is only called when the key does not exist
   * in the cache. The result is stored with the given TTL.
   *
   * This is the most commonly used caching pattern — "cache aside".
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param ttl - Time-to-live in seconds for the computed value
   * @param factory - Async factory function to compute the value on miss
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * const config = await cache.remember('app:config', 600, async () => {
   *   return await loadConfigFromRemote();
   * });
   * ```
   */
  public async remember<T>(key: string, ttl: number, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.getStore().get<T>(key);

    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    await this.getStore().set(key, value, ttl);
    return value;
  }

  /**
   * Get a value from cache, or execute the factory and store forever.
   *
   * Like `remember()` but the computed value never expires. Use for
   * values that are expensive to compute but rarely change (computed
   * once per application lifecycle).
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param factory - Async factory function to compute the value on miss
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * const schema = await cache.rememberForever('db:schema', async () => {
   *   return await introspectDatabaseSchema();
   * });
   * ```
   */
  public async rememberForever<T>(key: string, factory: () => Promise<T> | T): Promise<T> {
    const existing = await this.getStore().get<T>(key);

    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    await this.getStore().forever(key, value);
    return value;
  }

  /**
   * Stale-while-revalidate caching pattern.
   *
   * Returns a cached value immediately if it's within the "fresh" window.
   * If it's between "fresh" and "max" TTL (stale), returns the stale value
   * AND refreshes in the background. If it's beyond "max", recomputes synchronously.
   *
   * This provides the best of both worlds:
   * - Fast responses (serve stale data immediately)
   * - Fresh data (background refresh keeps the cache current)
   *
   * @typeParam T - Type of the cached/computed value
   * @param key - Cache key
   * @param ttl - Tuple of [freshSeconds, maxSeconds]
   *   - freshSeconds: value is considered fresh (served as-is)
   *   - maxSeconds: value is considered stale but usable (background refresh)
   *   - Beyond maxSeconds: value is expired (synchronous recompute)
   * @param factory - Async factory function to compute the value
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * // Fresh for 60s, stale-but-usable for up to 300s, expired after 300s
   * const prices = await cache.flexible('product:prices', [60, 300], async () => {
   *   return await fetchPricesFromApi();
   * });
   * ```
   */
  public async flexible<T>(
    key: string,
    ttl: [freshSeconds: number, maxSeconds: number],
    factory: () => Promise<T> | T
  ): Promise<T> {
    const [freshSeconds, maxSeconds] = ttl;
    const metaKey = `__flexible:created:${key}`;

    // Retrieve both the value and its creation timestamp
    const results = await this.getStore().many<unknown>([key, metaKey]);
    const value = results.get(key) as T | undefined;
    const createdAt = results.get(metaKey) as number | undefined;

    // Case 1: No cached value — compute synchronously and store
    if (value === undefined || createdAt === undefined) {
      const freshValue = await factory();
      await this.getStore().set(key, freshValue, maxSeconds);
      await this.getStore().set(metaKey, Date.now(), maxSeconds);
      return freshValue;
    }

    // Case 2: Value is within the fresh window — return as-is
    const ageSeconds = (Date.now() - createdAt) / 1000;
    if (ageSeconds <= freshSeconds) {
      return value;
    }

    // Case 3: Value is stale but within max — return stale + refresh in background
    if (ageSeconds <= maxSeconds) {
      // Background refresh (non-blocking, errors swallowed)
      this.refreshInBackground(key, metaKey, maxSeconds, factory);
      return value;
    }

    // Case 4: Value is expired — synchronous recompute
    const freshValue = await factory();
    await this.getStore().set(key, freshValue, maxSeconds);
    await this.getStore().set(metaKey, Date.now(), maxSeconds);
    return freshValue;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Counter Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Increment a numeric value stored at the given key.
   *
   * If the key does not exist, it is initialized to 0 before incrementing.
   * Returns the new value after the increment.
   *
   * @param key - Cache key
   * @param by - Amount to increment by (default: 1)
   * @returns The new value after incrementing
   *
   * @example
   * ```typescript
   * await cache.increment('page:views');        // 1
   * await cache.increment('page:views');        // 2
   * await cache.increment('page:views', 5);     // 7
   * ```
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    return this.getStore().increment(key, by);
  }

  /**
   * Decrement a numeric value stored at the given key.
   *
   * If the key does not exist, it is initialized to 0 before decrementing.
   * Returns the new value after the decrement (can go negative).
   *
   * @param key - Cache key
   * @param by - Amount to decrement by (default: 1)
   * @returns The new value after decrementing
   *
   * @example
   * ```typescript
   * await cache.set('stock', 10);
   * await cache.decrement('stock');      // 9
   * await cache.decrement('stock', 3);   // 6
   * ```
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.getStore().decrement(key, by);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TTL Management
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Extend the TTL of an existing key without changing its value.
   *
   * If the key does not exist or is expired, this is a no-op (returns false).
   * Useful for "keep-alive" patterns where access should extend the expiry.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns `true` if the key existed and its TTL was updated
   *
   * @example
   * ```typescript
   * // Extend session TTL on each request
   * await cache.touch('session:abc123', 1800); // reset to 30min
   * ```
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    return this.getStore().touch(key, ttl);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Delete Operations
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Delete a key from the default cache store.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    return this.getStore().delete(key);
  }

  /**
   * Delete a key from the cache (alias for `delete`).
   *
   * Matches Laravel's naming convention.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async forget(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Retrieve a value and immediately remove it from the cache.
   *
   * Useful for one-time-use tokens, OTP codes, nonces, or flash messages.
   * The key is deleted regardless of whether the value was found.
   *
   * @typeParam T - Expected type of the cached value
   * @param key - Cache key
   * @param defaultValue - Optional fallback if the key is missing
   * @returns The cached value, or the default, or undefined
   *
   * @example
   * ```typescript
   * const otp = await cache.pull<string>('otp:user:123');
   * if (!otp) throw new Error('OTP expired or already used');
   * ```
   */
  public async pull<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.get<T>(key, defaultValue);
    await this.getStore().delete(key);
    return value;
  }

  /**
   * Remove all entries from the default cache store.
   */
  public async clear(): Promise<void> {
    await this.getStore().clear();
  }

  /**
   * Remove all entries from the default cache store (alias for `clear`).
   *
   * Matches Laravel's naming convention.
   */
  public async flush(): Promise<void> {
    return this.clear();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Store Access
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Begin a tag-scoped cache operation.
   *
   * Returns a `TaggedCache` instance that namespaces all keys by the
   * given tag set. Flushing the tagged cache invalidates ALL entries
   * stored under those tags in O(1) time — without enumerating keys.
   *
   * The TaggedCache provides the same API as CacheService (get, set,
   * remember, forever, increment, etc.) but scoped to the tag namespace.
   *
   * @param names - One or more tag names to scope the cache
   * @returns A TaggedCache instance for tag-scoped operations
   *
   * @example
   * ```typescript
   * // Store entries under the 'users' tag
   * const tagged = cache.tags(['users']);
   * await tagged.set('user:1', userData, 600);
   * await tagged.set('user:2', otherUser, 600);
   *
   * // Invalidate ALL user-tagged entries at once
   * await tagged.flush();
   * ```
   *
   * @example
   * ```typescript
   * // Multiple tags — entries are scoped to the combination
   * const tagged = cache.tags(['products', 'featured']);
   * await tagged.remember('featured-list', 300, () => fetchFeatured());
   *
   * // Flushing invalidates entries with BOTH tags
   * await cache.tags(['products', 'featured']).flush();
   * ```
   */
  public tags(names: string | string[]): TaggedCache {
    const tagNames = Array.isArray(names) ? names : [names];
    return new TaggedCache(this.getStore(), tagNames);
  }

  /**
   * Get a named cache store from the manager.
   *
   * Allows the CacheService to operate on a specific store instead of
   * the default. The returned store implements `ICacheStore`.
   *
   * @param name - Store name (defaults to the configured default)
   * @returns The resolved ICacheStore implementation
   *
   * @example
   * ```typescript
   * const redisStore = cache.store('redis');
   * await redisStore.set('key', 'value', 300);
   * ```
   */
  public store(name?: string): ICacheStore {
    return this.manager.store(name);
  }

  /**
   * Get the underlying CacheManager instance.
   *
   * Useful for advanced operations like registering custom drivers,
   * accessing non-default stores, or inspecting configuration.
   *
   * @returns The CacheManager instance
   */
  public getManager(): CacheManager {
    return this.manager;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the default cache store from the manager.
   *
   * @returns The default ICacheStore implementation
   */
  private getStore(): ICacheStore {
    return this.manager.store();
  }

  /**
   * Refresh a cache key in the background (non-blocking).
   *
   * Used by `flexible()` for stale-while-revalidate. The refresh runs
   * after the current microtask completes. Errors are silently swallowed
   * (the stale value continues to be served).
   *
   * @param key - The cache key to refresh
   * @param metaKey - The metadata key storing the creation timestamp
   * @param maxTtl - The maximum TTL for the refreshed value
   * @param factory - The factory to recompute the value
   */
  private refreshInBackground<T>(
    key: string,
    metaKey: string,
    maxTtl: number,
    factory: () => Promise<T> | T
  ): void {
    queueMicrotask(async () => {
      try {
        const freshValue = await factory();
        await this.getStore().set(key, freshValue, maxTtl);
        await this.getStore().set(metaKey, Date.now(), maxTtl);
      } catch {
        // Background refresh failures are non-fatal.
        // The stale value continues to be served until maxTtl expires.
      }
    });
  }
}
