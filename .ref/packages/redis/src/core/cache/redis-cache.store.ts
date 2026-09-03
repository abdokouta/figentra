/**
 * @file redis-cache.store.ts
 * @module @stackra/ts-redis/cache
 * @description DI-managed Redis cache store implementing `ICacheStore` from
 *   `@stackra/contracts`. Auto-discovered by the cache manager when the
 *   `cacheStore` option is provided in module configuration.
 */

import { IInjectable, Inject, type IOnModuleInit } from '@stackra/ts-container';
import { Logger } from '@stackra/logger';
import { CacheStore } from '@stackra/cache';

import type {
  IRedisClient,
  IRedisManager,
  IRedisModuleOptions,
  ICacheStore,
} from '@stackra/contracts';
import { REDIS_CONFIG, REDIS_MANAGER } from '@stackra/contracts';

import { DEFAULT_CACHE_PREFIX, IDEFAULT_CACHE_TTL } from '../constants';
import { serializeValue, deserializeValue } from '../utils';

/**
 * DI-managed Redis cache store.
 *
 * Implements the `ICacheStore` interface from `@stackra/contracts` for
 * seamless integration with `@stackra/cache`. Auto-discovered by the
 * CacheStoreLoader via the `@CacheStore('redis')` decorator.
 */
@CacheStore('redis')
export class RedisCacheStore implements ICacheStore, IOnModuleInit {
  /** Scoped logger. */
  private readonly logger = new Logger(RedisCacheStore.name);

  /** Resolved Redis client (set in onModuleInit). */
  private client: IRedisClient | null = null;

  /** Key prefix for cache keys. */
  private readonly prefix: string;

  /** Default TTL in seconds. */
  private readonly defaultTtl: number;

  /**
   * @param manager - Redis manager for client resolution.
   * @param config - Module configuration.
   */
  public constructor(
    @Inject(REDIS_MANAGER) private readonly manager: IRedisManager,
    @Inject(REDIS_CONFIG) private readonly config: IRedisModuleOptions
  ) {
    this.prefix = config.cacheStore?.prefix ?? DEFAULT_CACHE_PREFIX;
    this.defaultTtl = config.cacheStore?.ttl ?? IDEFAULT_CACHE_TTL;
  }

  /**
   * Resolve the configured connection on bootstrap.
   */
  public async onModuleInit(): Promise<void> {
    try {
      const name = this.config.cacheStore?.connection ?? this.config.default;
      this.client = await this.manager.connection(name);
      this.logger.info(`[RedisCacheStore] Connected via "${name}".`);
    } catch (error: Error | any) {
      this.logger.warn(`[RedisCacheStore] Failed to connect: ${(error as Error).message}`);
    }
  }

  /**
   * Return the live client or throw if init never completed.
   *
   * @returns The resolved Redis client.
   */
  private requireClient(): IRedisClient {
    if (!this.client) {
      throw new Error('[RedisCacheStore] Not initialized — client unavailable.');
    }
    return this.client;
  }

  // ──────────────────────────────────────────────────────────────────
  // ICacheStore implementation (from @stackra/contracts)
  // ──────────────────────────────────────────────────────────────────

  /**
   * Retrieve a value from the cache.
   *
   * @typeParam T - Expected return type
   * @param key - Cache key
   * @returns The cached value, or undefined if not found
   */
  public async get<T = unknown>(key: string): Promise<T | undefined> {
    const raw = await this.requireClient().get(this.prefix + key);
    const value = deserializeValue(raw);
    return value !== null && value !== undefined ? (value as T) : undefined;
  }

  /**
   * Store a value in the cache with optional TTL.
   *
   * @typeParam T - Value type
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time-to-live in seconds (uses default if omitted)
   */
  public async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    const seconds = ttl != null && ttl > 0 ? ttl : this.defaultTtl;
    await this.requireClient().set(this.prefix + key, serializeValue(value), { ex: seconds });
  }

  /**
   * Check if a key exists and has not expired.
   *
   * @param key - Cache key
   * @returns True if the key exists
   */
  public async has(key: string): Promise<boolean> {
    const result = await this.requireClient().exists(this.prefix + key);
    return result > 0;
  }

  /**
   * Delete a key from the cache.
   *
   * @param key - Cache key
   * @returns True if the key existed and was deleted
   */
  public async delete(key: string): Promise<boolean> {
    const deleted = await this.requireClient().del(this.prefix + key);
    return deleted > 0;
  }

  /**
   * Remove all entries with the configured prefix from the cache.
   */
  public async clear(): Promise<void> {
    const client = this.requireClient();
    let cursor = 0;
    do {
      const [next, keys] = await client.scan(cursor, { match: `${this.prefix}*`, count: 100 });
      cursor = next;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== 0);
  }

  /**
   * Retrieve multiple values from the cache.
   *
   * @typeParam T - Expected value type
   * @param keys - Array of cache keys
   * @returns Map of key to value (undefined for missing keys)
   */
  public async many<T = unknown>(keys: string[]): Promise<Map<string, T | undefined>> {
    if (keys.length === 0) return new Map();

    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await this.requireClient().mget(...prefixedKeys);

    const result = new Map<string, T | undefined>();
    for (let i = 0; i < keys.length; i++) {
      const raw = values[i] ?? null;
      const deserialized = deserializeValue(raw);
      result.set(keys[i]!, deserialized !== null ? (deserialized as T) : undefined);
    }
    return result;
  }

  /**
   * Store multiple values in the cache.
   *
   * @typeParam T - Value type
   * @param entries - Map of key-value pairs
   * @param ttl - Time-to-live in seconds
   */
  public async setMany<T = unknown>(entries: Map<string, T>, ttl?: number): Promise<void> {
    const seconds = ttl != null && ttl > 0 ? ttl : this.defaultTtl;
    const pipe = this.requireClient().pipeline();
    for (const [key, value] of entries) {
      pipe.set(this.prefix + key, serializeValue(value), { ex: seconds });
    }
    await pipe.exec();
  }

  /**
   * Store a value indefinitely (no TTL).
   *
   * @typeParam T - Value type
   * @param key - Cache key
   * @param value - Value to store permanently
   */
  public async forever<T = unknown>(key: string, value: T): Promise<void> {
    await this.requireClient().set(this.prefix + key, serializeValue(value));
  }

  /**
   * Atomically increment a numeric value.
   *
   * @param key - Cache key
   * @param by - Amount to increment (default: 1)
   * @returns The new value after incrementing
   */
  public async increment(key: string, by: number = 1): Promise<number> {
    return this.requireClient().incrby(this.prefix + key, by);
  }

  /**
   * Atomically decrement a numeric value.
   *
   * @param key - Cache key
   * @param by - Amount to decrement (default: 1)
   * @returns The new value after decrementing
   */
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.requireClient().decrby(this.prefix + key, by);
  }

  /**
   * Extend the TTL of an existing key.
   *
   * @param key - Cache key
   * @param ttl - New time-to-live in seconds
   * @returns True if the key existed and TTL was updated
   */
  public async touch(key: string, ttl: number): Promise<boolean> {
    const result = await this.requireClient().expire(this.prefix + key, ttl);
    return result === 1;
  }

  // ──────────────────────────────────────────────────────────────────
  // Legacy aliases (backward compatibility)
  // ──────────────────────────────────────────────────────────────────

  /** @deprecated Use `set()` instead. */
  public async put(key: string, value: unknown, seconds: number): Promise<boolean> {
    await this.set(key, value, seconds);
    return true;
  }

  /** @deprecated Use `setMany()` instead. */
  public async putMany(values: Record<string, unknown>, seconds: number): Promise<boolean> {
    const entries = new Map(Object.entries(values));
    await this.setMany(entries, seconds);
    return true;
  }

  /** @deprecated Use `delete()` instead. */
  public async forget(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /** @deprecated Use `clear()` instead. */
  public async flush(): Promise<boolean> {
    await this.clear();
    return true;
  }

  /**
   * Get the configured key prefix.
   *
   * @returns The prefix string
   */
  public getPrefix(): string {
    return this.prefix;
  }
}
