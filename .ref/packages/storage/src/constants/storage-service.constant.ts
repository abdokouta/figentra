/**
 * Injection token for Storage service.
 *
 * This symbol is used as a unique identifier for dependency injection
 * of the StorageService. It enables type-safe injection and is used
 * internally by the @InjectStorage() decorator.
 *
 * @constant
 * @type {symbol}
 *
 * @example
 * ```typescript
 * import { Inject } from '@nestjs/common';
 * import { STORAGE_SERVICE } from '@constants/storage-service.constant';
 * import { StorageService } from '@services/storage.service';
 *
 * constructor(
 *   @Inject(STORAGE_SERVICE) private storage: StorageService
 * ) {}
 * ```
 */
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
