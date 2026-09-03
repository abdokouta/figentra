import type { IStorageOptions } from '@interfaces/storage-options.interface';
import type { IS3Options } from '@drivers/s3/s3-options.interface';
import type { IMinIOOptions } from '@drivers/minio/minio-options.interface';
import type { ILocalOptions } from '@drivers/local/local-options.interface';
import { StorageDriverType } from '@enums/storage-driver-type.enum';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import { DEFAULT_STORAGE_CONFIG } from '@constants/default-storage-config.constant';

/**
 * Storage Module Configuration
 *
 * Production-ready storage configuration for NestJS.
 * Provides comprehensive cloud storage integration with multiple drivers.
 *
 * Features:
 * - Multi-driver support (S3, MinIO)
 * - Automatic connection management
 * - Type-safe operations
 * - Configurable retry mechanisms
 * - File validation and size limits
 *
 * All configuration values can be overridden via environment variables.
 *
 * @see {@link https://aws.amazon.com/s3/ | Amazon S3}
 * @see {@link https://min.io/ | MinIO}
 *
 * @example
 * ```typescript
 * // Access configuration values
 * const driver = storageConfig.driver;
 * const maxRetries = storageConfig.maxRetries;
 * const bucket = storageConfig.s3?.bucket;
 * ```
 */
export const storageConfig: IStorageOptions = {
  /**
   * Storage driver type
   *
   * Determines which storage system to use.
   * Options: S3, MINIO
   *
   * @env STORAGE_DRIVER
   * @default StorageDriverType.S3
   */
  driver: (process.env.STORAGE_DRIVER as StorageDriverType) || StorageDriverType.S3,

  /**
   * S3 driver configuration
   *
   * Configuration options specific to the S3 driver.
   * Used when driver is set to StorageDriverType.S3.
   *
   * @env S3_REGION - S3 bucket region
   * @env S3_BUCKET - S3 bucket name
   * @env S3_ACCESS_KEY_ID - AWS access key ID
   * @env S3_SECRET_ACCESS_KEY - AWS secret access key
   * @env S3_SESSION_TOKEN - AWS session token
   * @env S3_ENDPOINT - Custom S3 endpoint
   * @env S3_FORCE_PATH_STYLE - Force path-style URLs
   * @env S3_USE_SSL - Use SSL/TLS
   */
  s3: {
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || '',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.S3_SESSION_TOKEN,
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    useSSL: process.env.S3_USE_SSL !== 'false',
  } as IS3Options,

  /**
   * MinIO driver configuration
   *
   * Configuration options specific to the MinIO driver.
   * Used when driver is set to StorageDriverType.MINIO.
   *
   * @env MINIO_ENDPOINT - MinIO server hostname
   * @env MINIO_PORT - MinIO server port
   * @env MINIO_USE_SSL - Use SSL/TLS
   * @env MINIO_ACCESS_KEY - MinIO access key
   * @env MINIO_SECRET_KEY - MinIO secret key
   * @env MINIO_BUCKET - MinIO bucket name
   * @env MINIO_REGION - MinIO region
   */
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || '',
    region: process.env.MINIO_REGION || 'us-east-1',
  } as IMinIOOptions,

  /**
   * Local filesystem driver configuration
   *
   * Configuration options specific to the Local driver.
   * Used when driver is set to StorageDriverType.LOCAL.
   *
   * @env LOCAL_STORAGE_ROOT - Root directory for file storage
   * @env LOCAL_STORAGE_BASE_URL - Base URL for file access
   * @env LOCAL_STORAGE_ENSURE_DIR - Create directory if not exists
   */
  local: {
    root: process.env.LOCAL_STORAGE_ROOT || './storage',
    baseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/files',
    ensureDirectoryExists: process.env.LOCAL_STORAGE_ENSURE_DIR !== 'false',
  } as ILocalOptions,

  /**
   * Register module globally
   *
   * When true, the module will be available globally without imports.
   *
   * @env STORAGE_GLOBAL
   * @default false
   */
  global: process.env.STORAGE_GLOBAL === 'true',

  /**
   * Auto-connect on module initialization
   *
   * When true, connects to the storage system on app bootstrap.
   *
   * @env STORAGE_AUTO_CONNECT
   * @default true
   */
  autoConnect: process.env.STORAGE_AUTO_CONNECT !== 'false',

  /**
   * Default visibility for uploaded files
   *
   * @env STORAGE_DEFAULT_VISIBILITY
   * @default StorageVisibility.PRIVATE
   */
  defaultVisibility:
    (process.env.STORAGE_DEFAULT_VISIBILITY as StorageVisibility) ||
    DEFAULT_STORAGE_CONFIG.defaultVisibility,

  /**
   * Maximum allowed file size in bytes
   *
   * @env STORAGE_MAX_FILE_SIZE
   * @default 104857600 (100 MB)
   */
  maxFileSize: parseInt(
    process.env.STORAGE_MAX_FILE_SIZE || String(DEFAULT_STORAGE_CONFIG.maxFileSize),
    10
  ),

  /**
   * Default expiration time for presigned URLs in seconds
   *
   * @env STORAGE_PRESIGNED_URL_EXPIRATION
   * @default 3600 (1 hour)
   */
  presignedUrlExpiration: parseInt(
    process.env.STORAGE_PRESIGNED_URL_EXPIRATION ||
      String(DEFAULT_STORAGE_CONFIG.presignedUrlExpiration),
    10
  ),

  /**
   * Maximum retry attempts for failed operations
   *
   * @env STORAGE_MAX_RETRIES
   * @default 3
   */
  maxRetries: parseInt(
    process.env.STORAGE_MAX_RETRIES || String(DEFAULT_STORAGE_CONFIG.maxRetries),
    10
  ),

  /**
   * Delay between retry attempts (in milliseconds)
   *
   * @env STORAGE_RETRY_DELAY
   * @default 1000
   */
  retryDelay: parseInt(
    process.env.STORAGE_RETRY_DELAY || String(DEFAULT_STORAGE_CONFIG.retryDelay),
    10
  ),
};
