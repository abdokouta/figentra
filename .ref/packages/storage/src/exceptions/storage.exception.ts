import { BaseException } from '@nesvel/exceptions';

/**
 * Base exception class for all Storage-related errors.
 *
 * This class extends BaseException from @nesvel/exceptions and provides
 * additional functionality for storage-specific exceptions, including error
 * codes and metadata for debugging.
 *
 * All custom exceptions in the Storage package should extend this class
 * to maintain consistency and enable centralized error handling.
 *
 * @class StorageException
 * @extends BaseException
 *
 * @example
 * ```typescript
 * throw StorageException.make(
 *   'An error occurred in storage operation',
 *   'STORAGE_ERROR',
 *   { operation: 'upload', path: 'file.pdf' }
 * );
 * ```
 */
export class StorageException extends BaseException {
  /**
   * Optional error code for categorizing the error.
   * Can be used for programmatic error handling and internationalization.
   */
  public readonly code?: string;

  /**
   * Optional metadata providing additional context about the error.
   * Can include details like file paths, sizes, or driver information.
   */
  public readonly metadata?: Record<string, any>;

  /**
   * Creates a new Storage exception.
   *
   * @param message - Human-readable error message
   * @param code - Optional error code for categorization
   * @param metadata - Optional additional context about the error
   *
   * @example
   * ```typescript
   * throw StorageException.make(
   *   'Failed to upload file to storage',
   *   'UPLOAD_FAILED',
   *   { path: 'uploads/file.pdf', size: 1024000 }
   * );
   * ```
   */
  constructor(message: string, code?: string, metadata?: Record<string, any>) {
    super(message);
    this.name = 'StorageException';
    this.code = code;
    this.metadata = metadata;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the exception to a plain object for serialization.
   *
   * This method is useful for logging, API responses, or storing error
   * information in a database.
   *
   * @returns A plain object representation of the exception
   *
   * @example
   * ```typescript
   * try {
   *   await storage.upload('file', buffer);
   * } catch (error: Error | any) {
   *   if (error instanceof StorageException) {
   *     logger.error(error.toJSON());
   *   }
   * }
   * ```
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}
