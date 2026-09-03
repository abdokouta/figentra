/**
 * Interface representing metadata for storage objects.
 *
 * This interface defines the structure of metadata that can be attached
 * to files in storage. Metadata is useful for storing additional information
 * about files without modifying the file content itself.
 *
 * @interface IStorageMetadata
 *
 * @example
 * ```typescript
 * const metadata: IStorageMetadata = {
 *   contentType: 'image/jpeg',
 *   contentEncoding: 'gzip',
 *   cacheControl: 'max-age=31536000',
 *   customMetadata: {
 *     uploadedBy: 'user123',
 *     department: 'marketing'
 *   }
 * };
 * ```
 */
export interface IStorageMetadata {
  /**
   * MIME type of the content.
   *
   * @example 'image/jpeg'
   */
  contentType?: string;

  /**
   * Content encoding of the file.
   *
   * @example 'gzip'
   */
  contentEncoding?: string;

  /**
   * Content language of the file.
   *
   * @example 'en-US'
   */
  contentLanguage?: string;

  /**
   * Cache control directives for the file.
   *
   * @example 'max-age=31536000, public'
   */
  cacheControl?: string;

  /**
   * Content disposition header value.
   *
   * @example 'attachment; filename="document.pdf"'
   */
  contentDisposition?: string;

  /**
   * Size of the file in bytes.
   *
   * @example 1024000
   */
  size?: number;

  /**
   * Path of the file in storage.
   *
   * @example 'uploads/document.pdf'
   */
  path?: string;

  /**
   * Last modified date of the file.
   *
   * @example new Date('2024-01-01')
   */
  lastModified?: Date;

  /**
   * Entity tag (ETag) of the file.
   * Used for cache validation and versioning.
   *
   * @example '"abc123"'
   */
  etag?: string;

  /**
   * Custom metadata key-value pairs.
   * These are user-defined metadata fields.
   *
   * @example { uploadedBy: 'user123', department: 'sales' }
   */
  customMetadata?: Record<string, string>;
}
