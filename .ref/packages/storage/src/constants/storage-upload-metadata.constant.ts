/**
 * Metadata key for file upload decorator.
 *
 * This constant is used as a metadata key to store upload configuration
 * attached by decorators. It enables reflection-based discovery of
 * upload handlers and their configuration.
 *
 * @constant
 * @type {string}
 *
 * @example
 * ```typescript
 * import { STORAGE_UPLOAD_METADATA } from '@constants/storage-upload-metadata.constant';
 *
 * const metadata = Reflect.getMetadata(
 *   STORAGE_UPLOAD_METADATA,
 *   target,
 *   propertyKey
 * );
 * ```
 */
export const STORAGE_UPLOAD_METADATA = 'storage:upload:metadata';
