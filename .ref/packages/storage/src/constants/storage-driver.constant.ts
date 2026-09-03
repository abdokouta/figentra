/**
 * Injection token for Storage driver.
 *
 * This symbol is used as a unique identifier for dependency injection
 * of the storage driver implementation. It allows the module to inject
 * the appropriate driver (S3, MinIO, etc.) based on configuration.
 *
 * @constant
 * @type {symbol}
 *
 * @example
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { STORAGE_DRIVER } from '@constants/storage-driver.constant';
 * import { IStorageDriver } from '@interfaces/storage-driver.interface';
 *
 * constructor(
 *   @Inject(STORAGE_DRIVER) private driver: IStorageDriver
 * ) {}
 * ```
 */
export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
