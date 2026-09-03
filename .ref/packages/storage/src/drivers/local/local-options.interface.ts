/**
 * Interface representing configuration options for the Local filesystem storage driver.
 *
 * This interface defines all configuration options required to use the
 * local filesystem for file storage operations.
 *
 * @interface ILocalOptions
 *
 * @example
 * ```typescript
 * const options: ILocalOptions = {
 *   root: '/var/app/storage',
 *   baseUrl: 'http://localhost:3000/files'
 * };
 * ```
 */
export interface ILocalOptions {
  /**
   * Root directory path for file storage.
   *
   * All files will be stored relative to this directory.
   * The directory will be created if it doesn't exist.
   *
   * @example '/var/app/storage' or './uploads'
   */
  root: string;

  /**
   * Base URL for accessing stored files.
   *
   * This URL is used to generate public URLs for uploaded files.
   * Optional - if not provided, only file paths will be available.
   *
   * @example 'http://localhost:3000/files' or 'https://cdn.example.com'
   */
  baseUrl?: string;

  /**
   * Whether to create the root directory if it doesn't exist.
   *
   * @default true
   */
  ensureDirectoryExists?: boolean;

  /**
   * File permissions for newly created files (Unix-style).
   *
   * @default 0o644 (rw-r--r--)
   */
  fileMode?: number;

  /**
   * Directory permissions for newly created directories (Unix-style).
   *
   * @default 0o755 (rwxr-xr-x)
   */
  directoryMode?: number;
}
