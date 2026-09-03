/**
 * @file index.ts
 * @module @stackra/cache/nestjs
 * @description NestJS subpath for the cache module.
 *   The core `CacheModule.forRoot()` is already NestJS-compatible. This
 *   subpath adds the `NestCacheModule` which layers NestJS-specific features:
 *   - `CacheStoreLoader` auto-discovery via NestJS `DiscoveryService`
 *
 *   For basic usage, you can import `CacheModule.forRoot()` directly from
 *   the core subpath. Use `NestCacheModule.forRoot()` when you want
 *   auto-discovery of `@CacheStore()`-decorated providers.
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestCacheModule } from './nest-cache.module';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export core (convenience — consumers only import one subpath)
// ════════════════════════════════════════════════════════════════════════════════
export {
  CacheModule,
  CacheManager,
  CacheService,
  CACHE_EVENTS,
  CacheStoreLoader,
  MemoryStore,
  NullStore,
  StorageStore,
  type StorageStoreOptions,
  CacheError,
  CacheDriverError,
  TagSet,
  TaggedCache,
  CacheStore,
  Cacheable,
  setCacheableContainer,
  type CacheableOptions,
  CacheEvict,
  setCacheEvictContainer,
  type CacheEvictOptions,
  defineConfig,
} from '../core';
export type {
  ICacheModuleAsyncOptions,
  ICacheStore,
  ICacheModuleConfig,
  ICacheStoreConfig,
} from '../core';
