import { StorageException } from './storage.exception';

/**
 * Exception thrown when a file upload operation fails.
 *
 * This exception is thrown when uploading a file to storage fails due to
 * network errors, permission issues, or other storage backend problems.
 * It includes the original error cause for debugging.
 *
 * @class UploadFailedException
 * @extends StorageException
 *
 * @example
 * ```typescript
 * try {
 *   await uploadToStorage();
 * } catch (error: Error | any) {
 *   throw UploadFailedException.make('uploads/file.pdf', error);
 * }
 * ```
 */
export class UploadFailedException extends StorageException {
  /**
   * Creates a new UploadFailedException instance.
   *
   * @param path - The path where the file was being uploaded
   * @param cause - The original error that caused the upload to fail
   * @param size - Optional file size in bytes
   *
   * @example
   * ```typescript
   * throw UploadFailedException.make(
   *   'uploads/document.pdf',
   *   new Error('Network timeout'),
   *   1024000
   * );
   * // Output: "Failed to upload file to 'uploads/document.pdf': Network timeout"
   * ```
   */
  constructor(path: string, cause: Error, size?: number) {
    const message = `Failed to upload file to '${path}': ${cause.message}`;

    super(message, 'UPLOAD_FAILED', {
      path,
      size,
      cause: cause.message,
      causeStack: cause.stack,
    });

    this.name = 'UploadFailedException';
  }
}
