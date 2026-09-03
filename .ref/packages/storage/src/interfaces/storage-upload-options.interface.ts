import { StorageVisibility } from '@enums/storage-visibility.enum';
import { StorageACL } from '@enums/storage-acl.enum';
import type { IStorageMetadata } from './storage-metadata.interface';

/**
 * Interface representing options for file upload operations.
 *
 * This interface defines all available options that can be specified
 * when uploading files to storage. Options control visibility, access
 * permissions, metadata, and other upload behaviors.
 *
 * @interface IStorageUploadOptions
 *
 * @example
 * ```typescript
 * const options: IStorageUploadOptions = {
 *   visibility: StorageVisibility.PUBLIC,
 *   contentType: 'image/jpeg',
 *   metadata: {
 *     customMetadata: {
 *       uploadedBy: 'user123'
 *     }
 *   }
 * };
 *
 * await storage.upload('path/to/file.jpg', buffer, options);
 * ```
 */
export interface IStorageUploadOptions {
  /**
   * Visibility level of the uploaded file.
   * Determines whether the file is publicly accessible or private.
   *
   * @default StorageVisibility.PRIVATE
   */
  visibility?: StorageVisibility;

  /**
   * Access Control List (ACL) permissions for the file.
   * Controls who can access the file and what operations they can perform.
   *
   * @example StorageACL.PUBLIC_READ
   */
  acl?: StorageACL;

  /**
   * MIME type of the file content.
   * If not specified, will be auto-detected based on file extension.
   *
   * @example 'image/jpeg'
   */
  contentType?: string;

  /**
   * Metadata to attach to the file.
   * Includes standard HTTP headers and custom metadata.
   */
  metadata?: IStorageMetadata;

  /**
   * Whether to overwrite existing file if it already exists.
   *
   * @default true
   */
  overwrite?: boolean;

  /**
   * Driver-specific options.
   * These options are passed directly to the underlying storage driver
   * and may vary depending on the driver being used (S3, MinIO, etc.).
   *
   * @example { ServerSideEncryption: 'AES256' }
   */
  driverOptions?: any;
}
