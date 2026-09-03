/**
 * @file nest-encryption.module.ts
 * @module @stackra/nestjs-encryption
 * @description NestJS DI module for the encryption system.
 *   Registers the EncryptionService and EncryptionFactory as global singletons
 *   with AES-256-GCM/CBC encryption and key rotation support.
 */

import { Module, type IDynamicModule } from '@nestjs/common';

import { ENCRYPTION_SERVICE } from './constants';
import { EncryptionService } from './services/encryption.service';
import { EncryptionFactory } from './services/encryption-factory.service';
import type { IEncryptionConfig, IEncryptionModuleAsyncOptions } from './interfaces';
import { ENCRYPTION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Module Options
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NestJS encryption module.
 *
 * Provides AES-256-GCM and AES-256-CBC encryption with key rotation
 * support. Register globally via `forRoot()` in the AppModule.
 *
 * Registers:
 * - `EncryptionService` — high-level encryption API
 * - `EncryptionFactory` — driver instance creation
 * - `ENCRYPTION_SERVICE` token — for token-based injection
 * - `ENCRYPTION_CONFIG` token — for config access
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestEncryptionModule.forRoot({
 *       key: process.env.APP_KEY!,
 *       cipher: 'aes-256-gcm',
 *       previousKeys: [],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestEncryptionModule {
  /**
   * Register the encryption module globally with static configuration.
   *
   * @param options - Encryption configuration (key, cipher, previousKeys)
   * @returns Dynamic module definition
   */
  public static forRoot(options: IEncryptionModuleOptions): IDynamicModule {
    return {
      module: NestEncryptionModule,
      global: true,
      providers: [
        {
          provide: ENCRYPTION_CONFIG,
          useValue: options,
        },
        {
          provide: ENCRYPTION_SERVICE,
          useClass: EncryptionService,
        },
        EncryptionService,
        EncryptionFactory,
      ],
      exports: [ENCRYPTION_SERVICE, ENCRYPTION_CONFIG, EncryptionService, EncryptionFactory],
    };
  }

  /**
   * Register the encryption module globally with async configuration.
   *
   * Use this when configuration depends on other DI providers
   * (e.g., a ConfigService or environment variables).
   *
   * @param options - Async configuration with factory and inject tokens
   * @returns Dynamic module definition
   *
   * @example
   * ```typescript
   * NestEncryptionModule.forRootAsync({
   *   useFactory: (configService: ConfigService) => ({
   *     key: configService.get('APP_KEY'),
   *     cipher: 'aes-256-gcm',
   *     previousKeys: configService.get('PREVIOUS_KEYS')?.split(',') ?? [],
   *   }),
   *   inject: [ConfigService],
   * });
   * ```
   */
  public static forRootAsync(options: IEncryptionModuleAsyncOptions): IDynamicModule {
    return {
      module: NestEncryptionModule,
      global: true,
      providers: [
        {
          provide: ENCRYPTION_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: ENCRYPTION_SERVICE,
          useClass: EncryptionService,
        },
        EncryptionService,
        EncryptionFactory,
      ],
      exports: [ENCRYPTION_SERVICE, ENCRYPTION_CONFIG, EncryptionService, EncryptionFactory],
    };
  }
}
