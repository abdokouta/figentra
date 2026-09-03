import { StorageVisibility } from '@enums/storage-visibility.enum';

/**
 * Default configuration values for Storage module.
 *
 * This constant provides sensible defaults for storage configuration.
 * These values are used when specific options are not provided in the
 * module configuration.
 *
 * @constant
 * @type {object}
 *
 * @property {boolean} autoConnect - Whether to automatically connect on module init
 * @property {boolean} global - Whether to register the module globally
 * @property {string} defaultVisibility - Default visibility for uploaded files
 * @property {number} maxFileSize - Maximum file size in bytes (100MB)
 * @property {number} presignedUrlExpiration - Default presigned URL expiration in seconds (1 hour)
 * @property {number} maxRetries - Maximum number of retry attempts for failed operations
 * @property {number} retryDelay - Delay between retry attempts in milliseconds
 *
 * @example
 * ```typescript
 * import { DEFAULT_STORAGE_CONFIG } from '@constants/default-storage-config.constant';
 *
 * const config = {
 *   ...DEFAULT_STORAGE_CONFIG,
 *   driver: StorageDriverType.S3,
 *   driverOptions: { ... }
 * };
 * ```
 */
export const DEFAULT_STORAGE_CONFIG = {
  /**
   * Automatically connect to storage backend on module initialization.
   * Set to false if you want to manually control connection lifecycle.
   */
  autoConnect: true,

  /**
   * Register the module globally, making it available throughout the application
   * without needing to import it in every module.
   */
  global: false,

  /**
   * Default visibility level for uploaded files.
   * Can be overridden per-upload operation.
   */
  defaultVisibility: StorageVisibility.PRIVATE,

  /**
   * Maximum allowed file size in bytes.
   * Default: 104857600 bytes (100 MB)
   */
  maxFileSize: 104857600,

  /**
   * Default expiration time for presigned URLs in seconds.
   * Default: 3600 seconds (1 hour)
   */
  presignedUrlExpiration: 3600,

  /**
   * Maximum number of retry attempts for failed operations.
   * Default: 3 retries
   */
  maxRetries: 3,

  /**
   * Delay between retry attempts in milliseconds.
   * Default: 1000ms (1 second)
   */
  retryDelay: 1000,
} as const;
