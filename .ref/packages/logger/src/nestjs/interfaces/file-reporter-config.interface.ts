/**
 * @file file-reporter-config.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description IFileReporterConfig interface.
 */

/**
 * File reporter configuration options.
 */
export interface IFileReporterConfig {
  /** Absolute path to the log file (e.g., '/var/log/app.log'). */
  path: string;

  /** Maximum number of rotated files to retain. Default: 7. */
  maxFiles?: number;

  /** Maximum file size in bytes before rotation. Default: 50MB. */
  maxSize?: number;
}
