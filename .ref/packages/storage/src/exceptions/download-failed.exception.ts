import { StorageException } from './storage.exception';

/**
 * Exception thrown when a file download operation fails.
 *
 * This exception is thrown when downloading a file from storage fails due to
 * network errors, permission issues, or other storage backend problems.
 *
 * @class DownloadFailedException
 * @extends StorageException
 *
 * @example
 * ```typescript
 * try {
 *   await downloadFromStorage();
 * } catch (error: Error | any) {
 *   throw DownloadFailedException.make('uploads/file.pdf', error);
 * }
 * ```
 */
export class DownloadFailedException extends StorageException {
  /**
   * Creates a new DownloadFailedException instance.
   *
   * @param path - The path of the file that failed to download
   * @param cause - The original error that caused the download to fail
   *
   * @example
   * ```typescript
   * throw DownloadFailedException.make(
   *   'uploads/document.pdf',
   *   new Error('Connection reset')
   * );
   * // Output: "Failed to download file from 'uploads/document.pdf': Connection reset"
   * ```
   */
  constructor(path: string, cause: Error) {
    const message = `Failed to download file from '${path}': ${cause.message}`;

    super(message, 'DOWNLOAD_FAILED', {
      path,
      cause: cause.message,
      causeStack: cause.stack,
    });

    this.name = 'DownloadFailedException';
  }
}
