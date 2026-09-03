/**
 * Interface representing options for file download operations.
 *
 * This interface defines options that can be specified when downloading
 * files from storage, including range requests for partial downloads.
 *
 * @interface IStorageDownloadOptions
 *
 * @example
 * ```typescript
 * const options: IStorageDownloadOptions = {
 *   range: { start: 0, end: 1024 }
 * };
 *
 * const buffer = await storage.download('path/to/file.pdf', options);
 * ```
 */
export interface IStorageDownloadOptions {
  /**
   * Byte range for partial download.
   * Useful for downloading large files in chunks or resuming downloads.
   *
   * @example { start: 0, end: 1024 }
   */
  range?: {
    /**
     * Starting byte position (inclusive).
     */
    start: number;

    /**
     * Ending byte position (inclusive).
     */
    end: number;
  };

  /**
   * Driver-specific options.
   * These options are passed directly to the underlying storage driver.
   */
  driverOptions?: any;
}
