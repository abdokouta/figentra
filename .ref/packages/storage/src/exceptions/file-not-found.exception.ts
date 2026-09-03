import { StorageException } from './storage.exception';

/**
 * Exception thrown when a requested file does not exist in storage.
 *
 * This exception is thrown when attempting to perform operations on a file
 * that doesn't exist, such as downloading, deleting, or retrieving metadata.
 *
 * @class FileNotFoundException
 * @extends StorageException
 *
 * @example
 * ```typescript
 * throw FileNotFoundException.make('uploads/missing-file.pdf');
 * ```
 */
export class FileNotFoundException extends StorageException {
  /**
   * Creates a new FileNotFoundException instance.
   *
   * @param path - The path of the file that was not found
   *
   * @example
   * ```typescript
   * throw FileNotFoundException.make('uploads/document.pdf');
   * // Output: "File not found: uploads/document.pdf"
   * ```
   */
  constructor(path: string) {
    const message = `File not found: ${path}`;

    super(message, 'FILE_NOT_FOUND', {
      path,
    });

    this.name = 'FileNotFoundException';
  }
}
