import { StorageDriverType } from '@enums/storage-driver-type.enum';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import type { IS3Options } from '@drivers/s3/s3-options.interface';
import type { IMinIOOptions } from '@drivers/minio/minio-options.interface';
import type { ILocalOptions } from '@drivers/local/local-options.interface';

/**
 * Interface representing configuration options for the Storage module.
 *
 * This interface defines all configuration options that can be provided
 * when registering the Storage module. It includes driver selection,
 * driver-specific options, and general storage settings.
 *
 * @interface IStorageOptions
 *
 * @example
 * ```typescript
 * const options: IStorageOptions = {
 *   driver: StorageDriverType.S3,
 *   s3: {
 *     region: 'us-east-1',
 *     bucket: 'my-bucket',
 *     credentials: {
 *       accessKeyId: 'key',
 *       secretAccessKey: 'secret'
 *     }
 *   },
 *   autoConnect: true,
 *   global: true
 * };
 * ```
 */
export interface IStorageOptions {
  /**
   * Storage driver type to use.
   * Determines which storage backend will handle operations.
   *
   * @example StorageDriverType.S3
   */
  driver: StorageDriverType | string;

  /**
   * S3-specific configuration options.
   * Used when driver is set to StorageDriverType.S3.
   *
   * @see {@link IS3Options}
   */
  s3?: IS3Options;

  /**
   * MinIO-specific configuration options.
   * Used when driver is set to StorageDriverType.MINIO.
   *
   * @see {@link IMinIOOptions}
   */
  minio?: IMinIOOptions;

  /**
   * Local filesystem configuration options.
   * Used when driver is set to StorageDriverType.LOCAL.
   *
   * @see {@link ILocalOptions}
   */
  local?: ILocalOptions;

  /**
   * Whether to register the module globally.
   * If true, the module will be available throughout the application
   * without needing to import it in every module.
   *
   * @default false
   */
  global?: boolean;

  /**
   * Whether to automatically connect to storage on module initialization.
   * If false, you must manually call connect() before using storage operations.
   *
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Default visibility for uploaded files.
   * Can be overridden per-upload operation.
   *
   * @default StorageVisibility.PRIVATE
   */
  defaultVisibility?: StorageVisibility;

  /**
   * Maximum allowed file size in bytes.
   * Uploads exceeding this size will be rejected.
   *
   * @default 104857600 (100 MB)
   */
  maxFileSize?: number;

  /**
   * Default expiration time for presigned URLs in seconds.
   *
   * @default 3600 (1 hour)
   */
  presignedUrlExpiration?: number;

  /**
   * Maximum number of retry attempts for failed operations.
   *
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retry attempts in milliseconds.
   *
   * @default 1000
   */
  retryDelay?: number;
}
