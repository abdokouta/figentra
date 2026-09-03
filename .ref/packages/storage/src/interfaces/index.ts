/**
 * Interfaces module exports.
 *
 * This module provides all interface definitions used throughout the
 * Storage package. Interfaces define contracts for drivers, options,
 * file metadata, and various operation configurations.
 */

export * from './storage-driver.interface';
export * from './storage-file.interface';
export * from './storage-metadata.interface';
export * from './storage-options.interface';
export * from './storage-options-factory.interface';
export * from './storage-async-options.interface';

import type { IStorageOptions } from './storage-options.interface';

/**
 * Type alias for Storage module configuration options.
 *
 * This is a convenience type alias that maps to IStorageOptions.
 * It can be used interchangeably with IStorageOptions for configuring
 * the Storage module during registration.
 *
 * @see {@link IStorageOptions}
 *
 * @example
 * ```typescript
 * const config: StorageConfig = {
 *   driver: StorageDriverType.S3,
 *   driverOptions: {
 *     region: 'us-east-1',
 *     bucket: 'my-bucket'
 *   }
 * };
 * ```
 */
export type StorageConfig = IStorageOptions;
export * from './storage-upload-options.interface';
export type { ValidationResult } from './validation-result.interface';
export type { FileValidationOptions } from './file-validation-options.interface';
export * from './storage-download-options.interface';
export * from './storage-list-options.interface';
export * from './storage-presigned-url-options.interface';
export * from './file-validation-options.interface';
export * from './validation-result.interface';
