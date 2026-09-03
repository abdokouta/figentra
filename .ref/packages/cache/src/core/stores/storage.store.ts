/**
 * @file storage.store.ts
 * @module @stackra/cache/core/stores
 * @description Web Storage-backed cache store (localStorage / sessionStorage).
 *   Persists cache entries to the browser's Storage API with JSON serialization,
 *   TTL expiration, and max entry limits. Falls back to an in-memory polyfill
 *   in SSR/Node.js environments where Web Storage is unavailable.
 *
 *   Each entry is stored as a separate key in the storage backend (prefixed),
 *   allowing individual access without loading the entire cache into memory.
 */

import { CacheStore } from '../decorators';
import type { ICacheStore } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Internal serialized cache entry stored in Web Storage.
 */
interface IStorageEntry {
  /** The cached value (JSON-serializable). */
  value: unknown;
  /** Unix timestamp (ms) when the entry was created. */
  createdAt: number;
  /** TTL in milliseconds. Undefined = never expires. */
  ttl?: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// In-Memory Polyfill
// ════════════════════════════════════════════════════════════════════════════════

/**
 * In-memory Storage polyfill for SSR/Node.js environments.
 *
 * Implements the subset of the Web Storage API that StorageStore needs.
 * Data is lost when the process exits (expected for SSR).
 */
class MemoryStorage {
  private readonly data = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  public removeItem(key: string): void {
    this.data.delete(key);
  }

  public clear(): void {
    this.data.clear();
  }

  public get length(): number {
    return this.data.size;
  }

  public key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Web Storage-backed cache store with TTL and eviction support.
 *
 * Each cache entry is stored as a separate key in localStorage/sessionStorage
 * with JSON-serialized metadata (value + createdAt + ttl). This allows
 * individual key access without loading the entire cache.
 *
 * Features:
 * - Passive TTL expiry (checked on read, cleaned up on access)
 * - Max entry eviction (oldest removed when limit exceeded)
 * - Prefix isolation (multiple apps can share the same storage)
 * - SSR-safe (falls back to in-memory polyfill in Node.js)
 * - Graceful quota handling (silently fails on storage quota errors)
 *
 * @example
 * ```typescript
 * const store = new StorageStore({ prefix: 'app:', maxEntries: 500 });
 * await store.set('user:1', { name: 'Alice' }, 3600);
 * const user = await store.get<{ name: string }>('user:1');
 * ```
 */
@CacheStore('storage')
export class StorageStore implements ICacheStore {
  /** Key prefix for all entries. */
  private readonly prefix: string;

  /** Maximum entries to retain. */
  private readonly maxEntries: number;

  /** The storage backend (localStorage, sessionStorage, or polyfill). */
  private readonly storage: Storage;

  /**
   * Create a new StorageStore.
   *
   * @param options - Store configuration
   */
  public constructor(options: StorageStoreOptions = {}) {
    this.prefix = options.prefix ?? 'cache:';
    this.maxEntries = options.maxEntries ?? 1000;

    // Guard for SSR/Node.js environments
    if (typeof globalThis.localStorage === 'undefined') {
      this.storage = new MemoryStorage() as unknown as Storage;
    } else {
      this.storage = options.session ? globalThis.sessionStorage : globalThis.localStorage;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ICacheStore Implementation
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a value from the storage cache.
   *
   * Returns undefined if the key does not exist or has expired.
   * Expired entries are removed on access (passive expiry).
   *
   * @param key - Cache key
   * @returns The cached value, or undefined if not found / expired
   */
  public async get<T>(key: string): Promise<T | undefined> {
    const entry = this.readEntry(key);

    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.removeKey(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Store a value in the storage cache.
   *
   * @param key - Cache key
   * @param value - Value to store (must be JSON-serializable)
   * @param ttl - Time-to-live in seconds (optional, no expiry if omitted)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: IStorageEntry = {
      value,
      createdAt: Date.now(),
      ttl: ttl != null && ttl > 0 ? ttl * 1000 : undefined,
    };

    this.writeEntry(key, entry);
    this.enforceLimit();
  }

  /**
   * Check if a key exists and has not expired.
   *
   * @param key - Cache key
   * @returns `true` if the key exists and is not expired
   */
  public async has(key: string): Promise<boolean> {
    const entry = this.readEntry(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.removeKey(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the storage cache.
   *
   * @param key - Cache key
   * @returns `true` if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    const prefixed = this.prefix + key;
    const existed = this.storage.getItem(prefixed) !== null;
    this.storage.removeItem(prefixed);
    return existed;
  }

  /**
   * Remove all entries managed by this store (with matching prefix).
   *
   * Only removes keys that start with this store's prefix, leaving
   * other applications' data intact.
   */
  public async clear(): Promise<void> {
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.storage.removeItem(key);
    }
  }

  /**
   * Retrieve multiple values from the storage cache.
   *
   * @param keys - Array of cache keys to retrieve
   * @returns Map of key to value (undefined for missing/expired keys)
   */
  public async many<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>();

    for (const key of keys) {
      results.set(key, await this.get<T>(key));
    }

    return results;
  }

  /**
   * Store multiple values in the storage cache.
   *
   * @param entries - Map of key-value pairs to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  public async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Store a value in the cache indefinitely (no TTL expiry).
   *
   * @param key - Cache key
   * @param value - Value to store permanently
   */
  public async forever<T>(key: string, value: T): Promise<void> {
    const entry: IStorageEntry = {
      value,
      createdAt: Date.now(),
      // No ttl = never expires
    };

    this.writeEntry(key, entry);
    this.enforceLimit();
  }

  /**
   * Increment a numeric value at the given key.
   *
   * If the key does not exist, it is initialized to 0 before incrementing.
   * The entry's TTL is preserved.
   *
   * @param key - Cache key
   * @param by - Amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    const entry = this.readEntry(key);

    // If expired, treat as non-existent
    if (entry && this.isExpired(entry)) {
      this.removeKey(key);
    }

    const existing = this.readEntry(key);
    const currentValue = existing ? (typeof existing.value === 'number' ? existing.value : 0) : 0;
    const newValue = currentValue + by;

    // Preserve existing TTL metadata
    const newEntry: IStorageEntry = {
      value: newValue,
      createdAt: existing?.createdAt ?? Date.now(),
      ttl: existing?.ttl,
    };

    this.writeEntry(key, newEntry);
    return newValue;
  }

  /**
   * Decrement a numeric value at the given key.
   *
   * @param key - Cache key
   * @param by - Amount to decrement by (default: 1)
   * @returns The new value after decrementing
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.increment(key, -by);
  }

  /**
   * Extend the TTL of an existing key without changing its value.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns `true` if the key existed and its TTL was updated
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const entry = this.readEntry(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.removeKey(key);
      return false;
    }

    // Update the creation time and TTL to effectively reset the expiry
    entry.createdAt = Date.now();
    entry.ttl = ttl > 0 ? ttl * 1000 : undefined;
    this.writeEntry(key, entry);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Read and parse a single entry from storage.
   *
   * @param key - Cache key (without prefix)
   * @returns The parsed entry, or null if not found or unparseable
   */
  private readEntry(key: string): IStorageEntry | null {
    try {
      const raw = this.storage.getItem(this.prefix + key);
      if (!raw) return null;
      return JSON.parse(raw) as IStorageEntry;
    } catch {
      return null;
    }
  }

  /**
   * Serialize and write an entry to storage.
   *
   * Silently swallows quota exceeded errors.
   *
   * @param key - Cache key (without prefix)
   * @param entry - The entry to write
   */
  private writeEntry(key: string, entry: IStorageEntry): void {
    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch {
      // Silently fail on quota exceeded — caller continues normally
    }
  }

  /**
   * Remove a single key from storage.
   *
   * @param key - Cache key (without prefix)
   */
  private removeKey(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  /**
   * Check if a cache entry has expired.
   *
   * @param entry - The entry to check
   * @returns `true` if the entry has a TTL and has expired
   */
  private isExpired(entry: IStorageEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * Remove oldest entries if the store exceeds maxEntries.
   *
   * Scans all prefixed keys, sorts by creation time, and removes
   * the oldest entries until within the limit.
   */
  private enforceLimit(): void {
    if (this.maxEntries <= 0 || this.maxEntries === Infinity) return;

    // Collect all prefixed keys with their creation times
    const entries: Array<{ key: string; createdAt: number }> = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const raw = this.storage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as IStorageEntry;
            entries.push({ key, createdAt: parsed.createdAt });
          }
        } catch {
          // Skip unparseable entries
        }
      }
    }

    // If within limit, nothing to do
    if (entries.length <= this.maxEntries) return;

    // Sort by creation time (oldest first) and remove excess
    entries.sort((a, b) => a.createdAt - b.createdAt);
    const toRemove = entries.length - this.maxEntries;

    for (let i = 0; i < toRemove; i++) {
      this.storage.removeItem(entries[i]!.key);
    }
  }
}
