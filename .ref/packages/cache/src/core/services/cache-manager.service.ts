/**
 * @file cache-manager.service.ts
 * @module @stackra/cache/core/services
 * @description Driver-based cache manager extending the Manager pattern.
 *   Resolves named cache stores lazily with caching. Supports built-in
 *   memory and null drivers, plus custom driver extension.
 */

import { IInjectable, Inject } from '@stackra/ts-container';
import { Manager } from '@stackra/ts-support';

import type { ICacheModuleConfig } from '../interfaces';
import { MemoryStore } from '../stores/memory.store';
import { NullStore } from '../stores/null.store';
import { CACHE_CONFIG, ICacheStore } from '@stackra/contracts';

/**
 * Driver-based cache manager.
 *
 * Extends the abstract Manager pattern to resolve named cache stores.
 * Each store is created lazily on first access and cached for subsequent calls.
 *
 * Built-in drivers:
 * - `memory` — in-process Map with passive TTL expiry
 * - `null` — no-op store for testing
 *
 * Custom drivers can be registered via `extend()`:
 * ```typescript
 * cacheManager.extend('redis', () => new RedisStore(config));
 * ```
 *
 * @example
 * ```typescript
 * const manager = container.get<CacheManager>(CACHE_MANAGER);
 * const memoryStore = manager.store('memory');
 * await memoryStore.set('key', 'value', 300);
 * ```
 */
@IInjectable()
export class CacheManager extends Manager<ICacheStore> {
  /**
   * @param config - Cache module configuration injected via DI
   */
  public constructor(@Inject(CACHE_CONFIG) private readonly config: ICacheModuleConfig) {
    super();
  }

  /**
   * Get the name of the default cache driver from configuration.
   *
   * @returns The configured default store name
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  /**
   * Resolve a named cache store instance.
   *
   * Alias for `driver()` with more descriptive naming for cache context.
   *
   * @param name - Store name (defaults to the configured default)
   * @returns The resolved cache store instance
   */
  public store(name?: string): ICacheStore {
    return this.driver(name);
  }

  /**
   * Create the built-in memory driver.
   *
   * @returns A new MemoryStore instance
   */
  protected createMemoryDriver(): ICacheStore {
    return new MemoryStore();
  }

  /**
   * Create the built-in null driver.
   *
   * @returns A new NullStore instance
   */
  protected createNullDriver(): ICacheStore {
    return new NullStore();
  }
}
