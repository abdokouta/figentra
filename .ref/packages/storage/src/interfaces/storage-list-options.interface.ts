/**
 * Interface representing options for listing files in storage.
 *
 * This interface defines options for filtering and paginating file
 * listings in storage buckets or directories.
 *
 * @interface IStorageListOptions
 *
 * @example
 * ```typescript
 * const options: IStorageListOptions = {
 *   maxResults: 100,
 *   recursive: true,
 *   startAfter: 'uploads/file-100.jpg'
 * };
 *
 * const files = await storage.list('uploads/', options);
 * ```
 */
export interface IStorageListOptions {
  /**
   * Maximum number of results to return.
   *
   * @default 1000
   */
  maxResults?: number;

  /**
   * Whether to list files recursively in subdirectories.
   *
   * @default false
   */
  recursive?: boolean;

  /**
   * Continuation token for paginated results.
   * Used to retrieve the next page of results.
   */
  continuationToken?: string;

  /**
   * Start listing after this key.
   * Useful for pagination without continuation tokens.
   *
   * @example 'uploads/file-100.jpg'
   */
  startAfter?: string;

  /**
   * Driver-specific options.
   */
  driverOptions?: any;
}
