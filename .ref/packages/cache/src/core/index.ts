/**
 * @file index.ts
 * @module @stackra/cache/core
 * @description Public API for the cache core module.
 *   Re-exports all public symbols organized by category.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { CacheModule } from './cache.module';
export type { ICacheModuleAsyncOptions } from './cache.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { CacheManager } from './services';
export { CacheService, CACHE_EVENTS } from './services';
export { CacheStoreLoader } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Stores
// ════════════════════════════════════════════════════════════════════════════════
export { MemoryStore } from './stores';
export { NullStore } from './stores';
export { StorageStore, type StorageStoreOptions } from './stores';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { CacheError } from './errors';
export { CacheDriverError } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Tags
// ════════════════════════════════════════════════════════════════════════════════
export { TagSet } from './tags';
export { TaggedCache } from './tags';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { CacheStore } from './decorators';
export { Cacheable, setCacheableContainer, type CacheableOptions } from './decorators';
export { CacheEvict, setCacheEvictContainer, type CacheEvictOptions } from './decorators';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export {
  CACHE_MANAGER,
  CACHE_CONFIG,
  CACHE_STORE_METADATA_KEY,
  DEFAULT_TTL,
  DEFAULT_PREFIX,
  DEFAULT_STORE,
} from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { ICacheStore, ICacheModuleConfig, ICacheStoreConfig } from './interfaces';
