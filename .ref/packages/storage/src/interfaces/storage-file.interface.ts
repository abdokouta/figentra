/**
 * Interface representing a file stored in the storage system.
 *
 * This interface defines the structure of file metadata returned by
 * storage operations. It contains information about the file's location,
 * size, type, and other relevant properties.
 *
 * @interface IStorageFile
 *
 * @example
 * ```typescript
 * const file: IStorageFile = {
 *   path: 'uploads/document.pdf',
 *   name: 'document.pdf',
 *   size: 1024000,
 *   contentType: 'application/pdf',
 *   url: 'https://bucket.s3.amazonaws.com/uploads/document.pdf',
 *   lastModified: new Date(),
 *   etag: '"abc123"'
 * };
 * ```
 */
export interface IStorageFile {
  /**
   * Full path of the file in storage (including filename).
   *
   * @example 'uploads/2024/document.pdf'
   */
  path: string;

  /**
   * Name of the file (without path).
   *
   * @example 'document.pdf'
   */
  name: string;

  /**
   * Size of the file in bytes.
   *
   * @example 1024000
   */
  size: number;

  /**
   * MIME type of the file.
   *
   * @example 'application/pdf'
   */
  contentType: string;

  /**
   * Public URL to access the file (if applicable).
   * May be undefined for private files.
   *
   * @example 'https://bucket.s3.amazonaws.com/uploads/document.pdf'
   */
  url?: string;

  /**
   * Date when the file was last modified.
   */
  lastModified: Date;

  /**
   * ETag of the file (entity tag for cache validation).
   *
   * @example '"abc123def456"'
   */
  etag?: string;

  /**
   * Additional custom metadata associated with the file.
   */
  metadata?: Record<string, string>;
}
