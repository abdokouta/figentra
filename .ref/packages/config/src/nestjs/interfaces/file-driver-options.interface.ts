/**
 * @file file-driver-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IFileDriverOptions interface.
 */

/**
 * Options for the File config driver.
 */
export interface IFileDriverOptions {
  /** Base directory to scan (absolute or relative to cwd). */
  configDir: string;
  /** Glob pattern for matching config files. Default: '*.{ts,js,mjs,json}'. */
  pattern?: string;
  /** Directories to exclude from scanning. */
  excludeDirs?: string[];
  /** Current environment name (e.g., 'production', 'development'). */
  environment?: string;
  /** Enable file watching for hot reload in development. */
  watch?: boolean;
}
