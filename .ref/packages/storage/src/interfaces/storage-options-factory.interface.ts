import type { IStorageOptions } from './storage-options.interface';

/**
 * Interface for factory that creates Storage module options.
 *
 * This interface defines the contract for classes that provide
 * Storage module configuration dynamically. It's used with the
 * useClass option in registerAsync().
 *
 * @interface IStorageOptionsFactory
 *
 * @example
 * ```typescript
 * @Injectable()
 * class StorageConfigService implements IStorageOptionsFactory {
 *   createStorageOptions(): IStorageOptions {
 *     return {
 *       driver: StorageDriverType.S3,
 *       driverOptions: {
 *         region: process.env.AWS_REGION,
 *         bucket: process.env.S3_BUCKET
 *       }
 *     };
 *   }
 * }
 * ```
 */
export interface IStorageOptionsFactory {
  /**
   * Creates Storage module options.
   *
   * This method is called by the module to obtain configuration options.
   * It can perform any necessary logic to construct the options object.
   *
   * @returns Storage module options or a Promise resolving to options
   *
   * @example
   * ```typescript
   * createStorageOptions(): IStorageOptions {
   *   return {
   *     driver: StorageDriverType.S3,
   *     driverOptions: {
   *       region: 'us-east-1',
   *       bucket: 'my-bucket'
   *     }
   *   };
   * }
   * ```
   */
  createStorageOptions(): Promise<IStorageOptions> | IStorageOptions;
}
