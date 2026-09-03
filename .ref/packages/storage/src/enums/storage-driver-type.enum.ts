/**
 * Enum representing supported storage driver types.
 *
 * This enum defines all available storage backends that can be used
 * with the Storage module. Each value corresponds to a specific driver
 * implementation.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * import { StorageDriverType } from '@nestjs-storage/core';
 *
 * const config = {
 *   driver: StorageDriverType.S3,
 *   // ...
 * };
 * ```
 */
export enum StorageDriverType {
  /**
   * Amazon S3 storage driver.
   *
   * Uses AWS SDK v3 for S3 operations. Supports all AWS S3 features
   * including multipart uploads, presigned URLs, and bucket policies.
   */
  S3 = 's3',

  /**
   * MinIO storage driver.
   *
   * Compatible with S3 API but designed for self-hosted object storage.
   * Ideal for on-premise deployments and development environments.
   */
  MINIO = 'minio',

  /**
   * Local filesystem storage driver.
   *
   * Stores files on the local filesystem. Ideal for development,
   * testing, and simple deployments without cloud dependencies.
   */
  LOCAL = 'local',
}
