/**
 * Injection token for Storage module options.
 *
 * This symbol is used as a unique identifier for dependency injection
 * of the Storage module configuration options. It ensures type-safe
 * injection without string-based tokens.
 *
 * @constant
 * @type {symbol}
 *
 * @example
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { STORAGE_MODULE_OPTIONS } from '@constants/storage-module-options.constant';
 *
 * constructor(
 *   @Inject(STORAGE_MODULE_OPTIONS) private options: IStorageOptions
 * ) {}
 * ```
 */
export const STORAGE_MODULE_OPTIONS = Symbol('STORAGE_MODULE_OPTIONS');
