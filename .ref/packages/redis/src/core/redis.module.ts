/**
 * @file redis.module.ts
 * @module @stackra/redis/core
 * @description Core DI module for the Redis manager. Registers the
 *   `RedisManager` under the `REDIS_MANAGER` token using `@stackra/ts-container`.
 *   NestJS applications should use `NestRedisModule` from the `./nestjs` subpath
 *   which imports this module and adds distributed primitives.
 */

import { Module, type IDynamicModule } from '@stackra/ts-container';
import type { IRedisModuleOptions } from '@stackra/contracts';
import { REDIS_MANAGER, REDIS_CONFIG } from '@stackra/contracts';

import { RedisManager } from './manager';
import { RedisCacheStore } from './cache/redis-cache.store';
import { getRedisClientToken } from './utils';

/**
 * Core Redis DI module.
 *
 * Provides the `RedisManager` with named connection resolution.
 * Import via `RedisModule.forRoot(config)` in your application module.
 *
 * @example
 * ```typescript
 * import { RedisModule } from '@stackra/redis';
 *
 * @Module({
 *   imports: [
 *     RedisModule.forRoot({
 *       default: 'main',
 *       connections: {
 *         main: { driver: 'upstash', url: '...', token: '...' },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RedisModule {
  /**
   * Register the Redis module globally with static configuration.
   *
   * @param config - Redis module options with named connections.
   * @returns A global dynamic module definition.
   */
  public static forRoot(config: IRedisModuleOptions): IDynamicModule {
    const connectionProviders = Object.keys(config.connections).map((name) => ({
      provide: getRedisClientToken(name),
      useFactory: async (manager: RedisManager) => manager.connection(name),
      inject: [RedisManager],
    }));

    const defaultConnectionProvider = {
      provide: getRedisClientToken(),
      useFactory: async (manager: RedisManager) => manager.connection(),
      inject: [RedisManager],
    };

    return {
      module: RedisModule,
      global: true,
      providers: [
        { provide: REDIS_CONFIG, useValue: config },
        RedisManager,
        { provide: REDIS_MANAGER, useExisting: RedisManager },
        RedisCacheStore,
        defaultConnectionProvider,
        ...connectionProviders,
      ],
      exports: [
        RedisManager,
        REDIS_MANAGER,
        RedisCacheStore,
        getRedisClientToken(),
        ...Object.keys(config.connections).map(getRedisClientToken),
      ],
    };
  }
}
