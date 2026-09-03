import { ModuleMetadata, Type } from '@nestjs/common';
import type { IStorageOptions } from './storage-options.interface';
import type { IStorageOptionsFactory } from './storage-options-factory.interface';

/**
 * Interface representing async configuration options for the Storage module.
 *
 * This interface defines the various ways to provide Storage module
 * configuration asynchronously, supporting dependency injection and
 * integration with other modules like ConfigModule.
 *
 * @interface IStorageAsyncOptions
 *
 * @example Using useFactory
 * ```typescript
 * StorageModule.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     driver: config.get('STORAGE_DRIVER'),
 *     driverOptions: {
 *       region: config.get('AWS_REGION'),
 *       bucket: config.get('S3_BUCKET')
 *     }
 *   })
 * });
 * ```
 *
 * @example Using useClass
 * ```typescript
 * StorageModule.registerAsync({
 *   useClass: StorageConfigService
 * });
 * ```
 */
export interface IStorageAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Whether to register the module globally.
   *
   * @default false
   */
  global?: boolean;

  /**
   * Factory function that returns Storage options.
   * This function can inject dependencies and return options dynamically.
   *
   * @param args - Injected dependencies
   * @returns Storage options or Promise resolving to options
   *
   * @example
   * ```typescript
   * useFactory: (config: ConfigService) => ({
   *   driver: config.get('STORAGE_DRIVER'),
   *   driverOptions: { ... }
   * })
   * ```
   */
  useFactory?: (...args: any[]) => Promise<IStorageOptions> | IStorageOptions;

  /**
   * Dependencies to inject into the factory function.
   * These are the services that will be passed as arguments to useFactory.
   *
   * @example
   * ```typescript
   * inject: [ConfigService]
   * ```
   */
  inject?: any[];

  /**
   * Class that implements IStorageOptionsFactory.
   * The class will be instantiated and its createStorageOptions() method
   * will be called to obtain configuration.
   *
   * @example
   * ```typescript
   * useClass: StorageConfigService
   * ```
   */
  useClass?: Type<IStorageOptionsFactory>;

  /**
   * Existing instance that implements IStorageOptionsFactory.
   * The instance's createStorageOptions() method will be called to
   * obtain configuration.
   *
   * @example
   * ```typescript
   * useExisting: StorageConfigService
   * ```
   */
  useExisting?: Type<IStorageOptionsFactory>;
}
