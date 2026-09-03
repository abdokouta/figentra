/**
 * Interface representing options for generating presigned URLs.
 *
 * This interface defines options for creating temporary URLs that grant
 * time-limited access to private files in storage.
 *
 * @interface IStoragePresignedUrlOptions
 *
 * @example
 * ```typescript
 * const options: IStoragePresignedUrlOptions = {
 *   expiresIn: 3600,
 *   action: 'download',
 *   responseHeaders: {
 *     'Content-Disposition': 'attachment; filename="document.pdf"'
 *   }
 * };
 *
 * const url = await storage.getPresignedUrl('private/document.pdf', options);
 * ```
 */
export interface IStoragePresignedUrlOptions {
  /**
   * Expiration time in seconds.
   * After this time, the URL will no longer be valid.
   *
   * @default 3600 (1 hour)
   */
  expiresIn?: number;

  /**
   * Action the URL should allow.
   *
   * @default 'download'
   */
  action?: 'download' | 'upload' | 'delete';

  /**
   * Response headers to include when the URL is accessed.
   * Useful for controlling how browsers handle the file.
   *
   * @example { 'Content-Disposition': 'attachment; filename="file.pdf"' }
   */
  responseHeaders?: Record<string, string>;

  /**
   * Driver-specific options.
   */
  driverOptions?: any;
}
