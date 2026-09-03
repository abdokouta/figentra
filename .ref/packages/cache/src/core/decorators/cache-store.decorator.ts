/**
 * @file cache-store.decorator.ts
 * @module @stackra/cache/core/decorators
 * @description Decorator that marks a class as a cache store for auto-discovery.
 *   Classes decorated with @CacheStore('name') are automatically registered
 *   with the CacheManager at boot time via the discovery pattern.
 */

import { defineMetadata } from '@vivtel/metadata';
import { IInjectable } from '@nestjs/common';

import { CACHE_STORE_METADATA_KEY } from '@stackra/contracts';

/**
 * Marks a class as a discoverable cache store.
 *
 * The cache module discovers all classes decorated with `@CacheStore()`
 * during module initialization and registers them with the CacheManager
 * as custom drivers.
 *
 * @param name - Unique store driver identifier (e.g., 'redis', 'filesystem')
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @CacheStore('redis')
 * @IInjectable()
 * export class RedisCacheStore implements ICacheStore {
 *   async get<T>(key: string): Promise<T | undefined> { ... }
 *   async set<T>(key: string, value: T, ttl?: number): Promise<void> { ... }
 *   // ...
 * }
 * ```
 */
export function CacheStore(name: string): ClassDecorator {
  return (target: Function) => {
    IInjectable()(target);

    defineMetadata(CACHE_STORE_METADATA_KEY, name, target);
  };
}
