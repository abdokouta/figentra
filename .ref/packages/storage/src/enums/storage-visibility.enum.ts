/**
 * Enum representing file visibility levels in storage.
 *
 * This enum defines whether files are publicly accessible or require
 * authentication to access. The visibility setting affects URL generation
 * and access control policies.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * import { StorageVisibility } from '@nestjs-storage/core';
 *
 * await storage.upload('file.pdf', buffer, {
 *   visibility: StorageVisibility.PUBLIC
 * });
 * ```
 */
export enum StorageVisibility {
  /**
   * Public visibility - files are accessible without authentication.
   *
   * Files with public visibility can be accessed via direct URLs without
   * requiring authentication or presigned URLs. Use for publicly shared
   * content like images, documents, or downloadable files.
   */
  PUBLIC = 'public',

  /**
   * Private visibility - files require authentication to access.
   *
   * Files with private visibility cannot be accessed via direct URLs.
   * Access requires either authentication or presigned URLs with expiration.
   * Use for sensitive data, user uploads, or protected content.
   */
  PRIVATE = 'private',
}
