/**
 * @file cache.module.ts
 * @module @stackra/cache/core
 * @description DI module for the cache system.
 *   Registers the CacheManager and CacheService globally.
 *   Supports both static `forRoot()` and async `forRootAsync()` configuration.
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';

import { DEFAULT_STORE, DEFAULT_TTL } from './constants';
import type { ICacheModuleConfig } from './interfaces';
import { CacheManager } from './services/cache-manager.service';
import { CacheService } from './services/cache.service';
import { CACHE_MANAGER, CACHE_CONFIG } from '@stackra/contracts';

/**
 * Cache DI module.
 *
 * Provides the CacheManager and CacheService globally. The CacheModule
 * works directly in both ts-container and NestJS contexts (no separate
 * adapter package needed).
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     CacheModule.forRoot({
 *       default: 'memory',
 *       stores: {
 *         memory: { driver: 'memory' },
 *         null: { driver: 'null' },
 *       },
 *       ttl: 3600,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class CacheModule {
  /**
   * Register the cache module globally with static configuration.
   *
   * @param config - Cache module configuration
   * @returns Dynamic module definition
   */
  public static forRoot(config?: Partial<ICacheModuleConfig>): IDynamicModule {
    const mergedConfig: ICacheModuleConfig = {
      default: config?.default ?? DEFAULT_STORE,
      stores: config?.stores ?? { memory: { driver: 'memory' } },
      prefix: config?.prefix,
      ttl: config?.ttl ?? DEFAULT_TTL,
    };

    return {
      module: CacheModule,
      global: true,
      providers: [
        {
          provide: CACHE_CONFIG,
          useValue: mergedConfig,
        },
        {
          provide: CACHE_MANAGER,
          useClass: CacheManager,
        },
        CacheService,
      ],
      exports: [CACHE_CONFIG, CACHE_MANAGER, CacheService],
    };
  }

  /**
   * Register the cache module globally with async configuration.
   *
   * Useful when cache config depends on other services (e.g., ConfigService).
   *
   * @param options - Async configuration options with factory and inject
   * @returns Dynamic module definition
   */
  public static forRootAsync(options: ICacheModuleAsyncOptions): IDynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: [
        {
          provide: CACHE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: CACHE_MANAGER,
          useClass: CacheManager,
        },
        CacheService,
      ],
      exports: [CACHE_CONFIG, CACHE_MANAGER, CacheService],
    };
  }

  /**
   * Register a custom cache store driver.
   *
   * The driver class is instantiated via DI and registered on the
   * CacheManager via `extend(driver, factory)`. This enables external
   * packages to add store implementations (redis, indexeddb, etc.)
   * without modifying the cache configuration.
   *
   * @param driver - Driver name (e.g., 'redis', 'indexeddb')
   * @param storeClass - Store class implementing ICacheStore
   * @returns Dynamic module definition
   *
   * @example
   * ```typescript
   * CacheModule.forFeature('redis', RedisCacheStore);
   * ```
   */
  public static forFeature(driver: string, storeClass: Function): IDynamicModule {
    const registrationToken = Symbol.for(`CACHE_STORE_REGISTRATION:${driver}`);

    return {
      module: CacheModule,
      providers: [
        storeClass as any,
        {
          provide: registrationToken,
          useFactory: (manager: CacheManager, store: any) => {
            manager.extend(driver, () => store);
            return null;
          },
          inject: [CacheManager, storeClass as any],
        },
      ],
      exports: [storeClass as any],
    };
  }
}
