/**
 * @file hashing.module.ts
 * @module @stackra/ts-hashing
 * @description DI module for the hashing system.
 *   Registers the HashManager as a global singleton and provides the
 *   HASHING_CONFIG token for driver configuration.
 *
 *   Supports both synchronous (`forRoot`) and asynchronous (`forRootAsync`)
 *   configuration patterns.
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { HASH_MANAGER, HASHING_CONFIG } from '@stackra/contracts';

import { HashManager } from './services';
import type { IHashingModuleConfig, IHashingModuleAsyncOptions } from './interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Hashing DI module.
 *
 * Provides:
 * - `HashManager` — global singleton bound to the `HASH_MANAGER` token
 * - `HASHING_CONFIG` — merged configuration for driver selection and options
 *
 * Supports three built-in drivers: bcrypt, argon2, and scrypt.
 * Custom drivers can be registered via `HashManager.extend()`.
 *
 * @example
 * ```typescript
 * import { HashingModule } from '@stackra/ts-hashing';
 *
 * @Module({
 *   imports: [
 *     HashingModule.forRoot({
 *       default: 'bcrypt',
 *       drivers: {
 *         bcrypt: { rounds: 12 },
 *         argon2: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
 *         scrypt: { cost: 16384, blockSize: 8, parallelization: 1, keyLength: 64 },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Async configuration with factory
 * HashingModule.forRootAsync({
 *   useFactory: (configService) => ({
 *     default: configService.get('HASH_DRIVER'),
 *     drivers: { bcrypt: { rounds: 14 } },
 *   }),
 *   inject: [ConfigService],
 * });
 * ```
 */
@Module({})
export class HashingModule {
  /**
   * Register the hashing module globally with static configuration.
   *
   * @param config - Hashing module configuration (driver selection and options)
   * @returns Dynamic module definition with HashManager and config
   */
  public static forRoot(config: IHashingModuleConfig): IDynamicModule {
    return {
      module: HashingModule,
      global: true,
      providers: [
        {
          provide: HASHING_CONFIG,
          useValue: config,
        },
        {
          provide: HASH_MANAGER,
          useClass: HashManager,
        },
        HashManager,
      ],
      exports: [HASH_MANAGER, HASHING_CONFIG, HashManager],
    };
  }

  /**
   * Register the hashing module globally with async configuration.
   *
   * Use this when the configuration depends on other DI providers
   * (e.g., a ConfigService or environment variables).
   *
   * @param options - Async configuration options with factory and inject
   * @returns Dynamic module definition with HashManager and async config
   */
  public static forRootAsync(options: IHashingModuleAsyncOptions): IDynamicModule {
    return {
      module: HashingModule,
      global: true,
      providers: [
        {
          provide: HASHING_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: HASH_MANAGER,
          useClass: HashManager,
        },
        HashManager,
      ],
      exports: [HASH_MANAGER, HASHING_CONFIG, HashManager],
    };
  }
}
