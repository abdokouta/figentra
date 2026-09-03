import { DynamicModule, Module, Provider } from '@nestjs/common';
import type { IStorageOptions } from '@interfaces/storage-options.interface';
import type { IStorageAsyncOptions } from '@interfaces/storage-async-options.interface';
import type { IStorageOptionsFactory } from '@interfaces/storage-options-factory.interface';
import { StorageService } from '@services/storage.service';
import { StorageFactoryService } from '@services/storage-factory.service';
import { STORAGE_MODULE_OPTIONS } from '@constants/storage-module-options.constant';
import { STORAGE_DRIVER } from '@constants/storage-driver.constant';
import { STORAGE_SERVICE } from '@constants/storage-service.constant';
import { DEFAULT_STORAGE_CONFIG } from '@constants/default-storage-config.constant';

/**
 * Storage module for NestJS applications.
 *
 * This module provides object storage functionality with support for multiple
 * storage backends (S3, MinIO, etc.). It can be registered synchronously with
 * static configuration or asynchronously with dynamic configuration from
 * ConfigService or other providers.
 *
 * The module supports both local and global registration, allowing flexible
 * integration patterns based on application architecture.
 *
 * @module StorageModule
 *
 * @example Synchronous registration
 * ```typescript
 * @Module({
 *   imports: [
 *     StorageModule.register({
 *       driver: StorageDriverType.S3,
 *       driverOptions: {
 *         region: 'us-east-1',
 *         bucket: 'my-bucket',
 *         credentials: {
 *           accessKeyId: 'key',
 *           secretAccessKey: 'secret'
 *         }
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @example Asynchronous registration with ConfigService
 * ```typescript
 * @Module({
 *   imports: [
 *     StorageModule.registerAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         driver: config.get('STORAGE_DRIVER'),
 *         driverOptions: {
 *           region: config.get('S3_REGION'),
 *           bucket: config.get('S3_BUCKET')
 *         }
 *       })
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class StorageModule {
  /**
   * Registers the Storage module with static configuration.
   *
   * This method is used when configuration values are known at compile time
   * or can be provided directly without dependency injection.
   *
   * @param options - Storage configuration options
   *
   * @returns Dynamic module configuration
   *
   * @example
   * ```typescript
   * StorageModule.register({
   *   driver: StorageDriverType.S3,
   *   driverOptions: {
   *     region: 'us-east-1',
   *     bucket: 'my-bucket',
   *     credentials: {
   *       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   *       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
   *     }
   *   },
   *   global: true,
   *   autoConnect: true
   * })
   * ```
   */
  static register(options: IStorageOptions): DynamicModule {
    // Merge with defaults
    const mergedOptions = {
      ...DEFAULT_STORAGE_CONFIG,
      ...options,
    };

    return {
      module: StorageModule,
      global: mergedOptions.global ?? false,
      providers: [
        {
          provide: STORAGE_MODULE_OPTIONS,
          useValue: mergedOptions,
        },
        StorageFactoryService,
        {
          provide: STORAGE_DRIVER,
          useFactory: async (factory: StorageFactoryService) => {
            return await factory.createDriverAsync(
              mergedOptions,
              mergedOptions.autoConnect ?? true
            );
          },
          inject: [StorageFactoryService],
        },
        {
          provide: STORAGE_SERVICE,
          useClass: StorageService,
        },
        StorageService,
      ],
      exports: [STORAGE_SERVICE, StorageService, STORAGE_DRIVER],
    };
  }

  /**
   * Registers the Storage module with asynchronous configuration.
   *
   * This method is used when configuration needs to be loaded asynchronously,
   * typically from ConfigService, database, or other async sources. It supports
   * three patterns: useFactory, useClass, and useExisting.
   *
   * @param options - Async storage configuration options
   *
   * @returns Dynamic module configuration
   *
   * @example Using useFactory
   * ```typescript
   * StorageModule.registerAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     driver: config.get('STORAGE_DRIVER'),
   *     driverOptions: {
   *       region: config.get('S3_REGION'),
   *       bucket: config.get('S3_BUCKET'),
   *       credentials: {
   *         accessKeyId: config.get('S3_ACCESS_KEY_ID'),
   *         secretAccessKey: config.get('S3_SECRET_ACCESS_KEY')
   *       }
   *     }
   *   })
   * })
   * ```
   *
   * @example Using useClass
   * ```typescript
   * @Injectable()
   * class StorageConfigService implements IStorageOptionsFactory {
   *   createStorageOptions(): IStorageOptions {
   *     return {
   *       driver: StorageDriverType.S3,
   *       driverOptions: { ... }
   *     };
   *   }
   * }
   *
   * StorageModule.registerAsync({
   *   useClass: StorageConfigService
   * })
   * ```
   */
  static registerAsync(options: IStorageAsyncOptions): DynamicModule {
    return {
      module: StorageModule,
      global: options.global ?? false,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        StorageFactoryService,
        {
          provide: STORAGE_DRIVER,
          useFactory: async (moduleOptions: IStorageOptions, factory: StorageFactoryService) => {
            const mergedOptions = {
              ...DEFAULT_STORAGE_CONFIG,
              ...moduleOptions,
            };
            return await factory.createDriverAsync(
              mergedOptions,
              mergedOptions.autoConnect ?? true
            );
          },
          inject: [STORAGE_MODULE_OPTIONS, StorageFactoryService],
        },
        {
          provide: STORAGE_SERVICE,
          useClass: StorageService,
        },
        StorageService,
      ],
      exports: [STORAGE_SERVICE, StorageService, STORAGE_DRIVER],
    };
  }

  /**
   * Creates async providers based on the async options pattern.
   *
   * This method handles the three different async configuration patterns:
   * - useFactory: Factory function that returns options
   * - useClass: Class that implements IStorageOptionsFactory
   * - useExisting: Existing provider that implements IStorageOptionsFactory
   *
   * @param options - Async storage configuration options
   *
   * @returns Array of providers for dependency injection
   *
   * @private
   */
  private static createAsyncProviders(options: IStorageAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: STORAGE_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: STORAGE_MODULE_OPTIONS,
          useFactory: async (optionsFactory: IStorageOptionsFactory) =>
            await optionsFactory.createStorageOptions(),
          inject: [options.useClass],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: STORAGE_MODULE_OPTIONS,
          useFactory: async (optionsFactory: IStorageOptionsFactory) =>
            await optionsFactory.createStorageOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    return [];
  }
}
