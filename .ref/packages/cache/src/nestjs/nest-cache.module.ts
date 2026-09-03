/**
 * @file nest-cache.module.ts
 * @module @stackra/cache/nestjs
 * @description NestJS module wrapper for the cache system.
 *   Imports the core `CacheModule` and adds NestJS-specific features:
 *   - `CacheStoreLoader` — auto-discovers `@CacheStore()`-decorated providers
 *     using NestJS's `DiscoveryService` and registers them with the `CacheManager`.
 *
 *   The core `CacheModule.forRoot()` already works in NestJS (ts-container
 *   decorators are NestJS-compatible). This wrapper only adds auto-discovery.
 *   If you don't use `@CacheStore()` decorators, import the core module directly.
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { CacheModule } from '../core/cache.module';
import { CacheStoreLoader } from '../core/services/cache-store-loader.service';
import type { ICacheModuleConfig } from '../core/interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS cache module — thin wrapper over the core module.
 *
 * Adds:
 * - `CacheStoreLoader` — discovers `@CacheStore()`-decorated providers at
 *   bootstrap and registers them as cache drivers on the `CacheManager`.
 *
 * Everything else (CacheManager, CacheService, stores) comes from the core module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestCacheModule.forRoot({
 *       default: 'memory',
 *       stores: {
 *         memory: { driver: 'memory' },
 *       },
 *       ttl: 3600,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // In another module (e.g., @stackra/redis):
 * @CacheStore({ name: 'redis', driver: 'redis' })
 * @Injectable()
 * export class RedisCacheStore implements ICacheStore {
 *   // Auto-registered with CacheManager at bootstrap
 * }
 * ```
 */
@Module({})
export class NestCacheModule {
  /**
   * Register the NestJS cache module globally.
   *
   * Imports the core `CacheModule.forRoot()` and adds the `CacheStoreLoader`
   * for auto-discovery of `@CacheStore()`-decorated providers.
   *
   * @param config - Cache module configuration (passed through to core module)
   * @returns Dynamic module definition
   */
  public static forRoot(config?: Partial<ICacheModuleConfig>): IDynamicModule {
    return {
      module: NestCacheModule,
      global: true,
      imports: [
        // NestJS DiscoveryModule for provider scanning
        DiscoveryModule,
        // Core module provides CacheManager + CacheService
        CacheModule.forRoot(config),
      ],
      providers: [
        // Auto-discovery loader — scans for @CacheStore() decorated providers
        CacheStoreLoader,
      ],
    };
  }
}
