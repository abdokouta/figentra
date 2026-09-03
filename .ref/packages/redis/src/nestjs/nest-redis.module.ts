/**
 * @file nest-redis.module.ts
 * @module @stackra/redis/nestjs
 * @description NestJS Redis module. Wraps the core `RedisModule` with automatic
 *   ioredis backend registration and provides distributed primitives (locks,
 *   limiters, streams) as injectable services.
 */

import { Module, type IDynamicModule } from '@nestjs/common';

import { RedisModule } from '../core/redis.module';
import { RedisManager } from '../core/manager';
import { IoredisBackend } from '../core/backends/ioredis';
import { REDIS_MANAGER, REDIS_CONFIG } from '@stackra/contracts';
import type { IRedisModuleOptions, IRedisModuleAsyncOptions } from '@stackra/contracts';

import { LockService } from './locks';
import { ConcurrencyLimiterService } from './limiters';
import { DurationLimiterService } from './limiters';
import { LimiterBuilder } from './limiters';
import { RedisHealthIndicator } from './health';
import { SlowQueryLogger } from './listeners';
import { StreamProducerService, StreamConsumerService, StreamManager } from './streams';
import { JsonSerializer, SerializerRegistry } from './serialization';

/**
 * NestJS Redis module.
 *
 * Auto-registers the ioredis backend and provides distributed primitives
 * (locks, limiters, streams) as injectable services. Use this instead of
 * `RedisModule.forRoot()` in NestJS applications.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestRedisModule.forRoot({
 *       default: 'main',
 *       connections: {
 *         main: { driver: 'ioredis', host: 'localhost', port: 6379 },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestRedisModule {
  /**
   * Configure Redis with ioredis auto-registered and distributed primitives.
   *
   * @param config - Redis module configuration.
   * @returns A global NestJS dynamic module.
   */
  public static forRoot(config: IRedisModuleOptions): IDynamicModule {
    const BACKEND_REG = Symbol.for('NEST_REDIS_ALL_BACKENDS_REG');

    return {
      module: NestRedisModule,
      global: true,
      imports: [RedisModule.forRoot(config)],
      providers: [
        // Register ioredis backend
        IoredisBackend,
        {
          provide: BACKEND_REG,
          useFactory: (manager: RedisManager, ioredis: IoredisBackend) => {
            manager.extend('ioredis', ((cfg: any) => ioredis.connect(cfg)) as any);
            return 'registered';
          },
          inject: [RedisManager, IoredisBackend],
        },
        // Distributed primitives
        LockService,
        ConcurrencyLimiterService,
        DurationLimiterService,
        LimiterBuilder,
        RedisHealthIndicator,
        SlowQueryLogger,
        StreamProducerService,
        StreamConsumerService,
        StreamManager,
        JsonSerializer,
        SerializerRegistry,
      ],
      exports: [
        LockService,
        ConcurrencyLimiterService,
        DurationLimiterService,
        LimiterBuilder,
        RedisHealthIndicator,
        StreamProducerService,
        StreamConsumerService,
        StreamManager,
        SerializerRegistry,
      ],
    };
  }

  /**
   * Configure Redis asynchronously with ioredis auto-registered.
   *
   * @param options - Async options with useFactory/inject.
   * @returns A global NestJS dynamic module.
   */
  public static forRootAsync(options: IRedisModuleAsyncOptions): IDynamicModule {
    const BACKEND_REG = Symbol.for('NEST_REDIS_ALL_BACKENDS_REG');

    const configProvider = {
      provide: REDIS_CONFIG,
      useFactory: options.useFactory!,
      inject: options.inject ?? [],
    } as any;

    return {
      module: NestRedisModule,
      global: true,
      imports: (options.imports ?? []) as any[],
      providers: [
        configProvider,
        {
          provide: RedisManager,
          useFactory: (config: IRedisModuleOptions) => new RedisManager(config),
          inject: [REDIS_CONFIG],
        },
        { provide: REDIS_MANAGER, useExisting: RedisManager },
        IoredisBackend,
        {
          provide: BACKEND_REG,
          useFactory: (manager: RedisManager, backend: IoredisBackend) => {
            manager.extend('ioredis', ((cfg: any) => backend.connect(cfg)) as any);
            return 'registered';
          },
          inject: [RedisManager, IoredisBackend],
        },
        LockService,
        ConcurrencyLimiterService,
        DurationLimiterService,
        LimiterBuilder,
        RedisHealthIndicator,
        SlowQueryLogger,
        StreamProducerService,
        StreamConsumerService,
        StreamManager,
        JsonSerializer,
        SerializerRegistry,
      ],
      exports: [
        RedisManager,
        REDIS_MANAGER,
        LockService,
        ConcurrencyLimiterService,
        DurationLimiterService,
        LimiterBuilder,
        RedisHealthIndicator,
        StreamProducerService,
        StreamConsumerService,
        StreamManager,
        SerializerRegistry,
      ],
    };
  }
}
