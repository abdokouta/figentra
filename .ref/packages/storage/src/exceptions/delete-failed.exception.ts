import { StorageException } from './storage.exception';

/**
 * Exception thrown when a file deletion operation fails.
 *
 * This exception is thrown when deleting a file from storage fails due to
 * permission issues, file locks, or other storage backend problems.
 *
 * @class DeleteFailedException
 * @extends StorageException
 *
 * @example
 * ```typescript
 * try {
 *   await deleteFromStorage();
 * } catch (error: Error | any) {
 *   throw DeleteFailedException.make('uploads/file.pdf', error);
 * }
 * ```
 */
export class DeleteFailedException extends StorageException {
  /**
   * Creates a new DeleteFailedException instance.
   *
   * @param path - The path of the file that failed to delete
   * @param cause - The original error that caused the deletion to fail
   *
   * @example
   * ```typescript
   * throw DeleteFailedException.make(
   *   'uploads/document.pdf',
   *   new Error('Access denied')
   * );
   * // Output: "Failed to delete file 'uploads/document.pdf': Access denied"
   * ```
   */
  constructor(path: string, cause: Error) {
    const message = `Failed to delete file '${path}': ${cause.message}`;

    super(message, 'DELETE_FAILED', {
      path,
      cause: cause.message,
      causeStack: cause.stack,
    });

    this.name = 'DeleteFailedException';
  }
}
