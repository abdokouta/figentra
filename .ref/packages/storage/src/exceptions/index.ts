/**
 * Exceptions module exports.
 *
 * This module provides all custom exception classes for the Storage package.
 * All exceptions extend the base StorageException class and provide specific
 * error handling for different failure scenarios.
 */

export * from './storage.exception';
export * from './driver-not-found.exception';
export * from './file-not-found.exception';
export * from './upload-failed.exception';
export * from './download-failed.exception';
export * from './delete-failed.exception';
