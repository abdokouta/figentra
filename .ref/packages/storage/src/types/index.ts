/**
 * Types module exports.
 *
 * This module provides type definitions used throughout the Storage package.
 * Currently, the package uses standard Node.js types (Buffer, Readable)
 * directly, so this module serves as a placeholder for future custom types.
 */

// Export type aliases for better documentation
export type { Readable } from 'stream';
export type { Buffer } from 'buffer';

// Export MulterFile type for file uploads
export * from './multer-file.type';
