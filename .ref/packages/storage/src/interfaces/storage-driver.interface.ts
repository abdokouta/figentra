import { Readable } from 'stream';
import type { IStorageFile } from './storage-file.interface';
import type { IStorageMetadata } from './storage-metadata.interface';
import type { IStorageUploadOptions } from './storage-upload-options.interface';
import type { IStorageDownloadOptions } from './storage-download-options.interface';
import type { IStorageListOptions } from './storage-list-options.interface';
import type { IStoragePresignedUrlOptions } from './storage-presigned-url-options.interface';
import { StorageVisibility } from '@enums/storage-visibility.enum';

/**
 * Symbol for dependency injection of storage drivers.
 *
 * This symbol is used as a unique identifier for injecting storage driver
 * implementations throughout the application.
 */
export const IStorageDriver = Symbol('IStorageDriver');

/**
 * Interface defining the contract for storage drivers.
 *
 * This interface must be implemented by all storage drivers (S3, MinIO, etc.).
 * It provides a unified API for storage operations regardless of the underlying
 * storage backend.
 *
 * @interface IStorageDriver
 *
 * @example
 * ```typescript
 * class S3StorageDriver implements IStorageDriver {
 *   async connect(): Promise<void> {
 *     // Implementation
 *   }
 *   // ... other methods
 * }
 * ```
 */
export interface IStorageDriver {
  /**
   * Establishes connection to the storage backend.
   *
   * This method initializes the connection and performs any necessary
   * authentication or setup required by the storage provider.
   *
   * @returns Promise that resolves when connection is established
   *
   * @throws {Error} If connection fails
   *
   * @example
   * ```typescript
   * await driver.connect();
   * ```
   */
  connect(): Promise<void>;

  /**
   * Closes connection to the storage backend.
   *
   * This method performs cleanup and releases any resources held by
   * the driver. Should be called when the application shuts down.
   *
   * @returns Promise that resolves when disconnection is complete
   *
   * @example
   * ```typescript
   * await driver.disconnect();
   * ```
   */
  disconnect(): Promise<void>;

  /**
   * Checks if the driver is currently connected.
   *
   * @returns true if connected, false otherwise
   *
   * @example
   * ```typescript
   * if (driver.isConnected()) {
   *   // Perform operations
   * }
   * ```
   */
  isConnected(): boolean;

  /**
   * Uploads a file to storage.
   *
   * This method uploads content (Buffer or Stream) to the specified path
   * in storage with optional configuration for visibility, metadata, etc.
   *
   * @param path - Destination path for the file
   * @param content - File content as Buffer or Readable stream
   * @param options - Optional upload configuration
   *
   * @returns Promise resolving to file metadata
   *
   * @throws {UploadFailedException} If upload fails
   *
   * @example
   * ```typescript
   * const file = await driver.upload(
   *   'uploads/document.pdf',
   *   buffer,
   *   { visibility: StorageVisibility.PUBLIC }
   * );
   * ```
   */
  upload(
    path: string,
    content: Buffer | Readable,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile>;

  /**
   * Uploads multiple files to storage.
   *
   * This method performs batch upload of multiple files, which may be
   * more efficient than uploading files individually.
   *
   * @param files - Array of files to upload
   * @param options - Optional upload configuration applied to all files
   *
   * @returns Promise resolving to array of file metadata
   *
   * @throws {UploadFailedException} If any upload fails
   *
   * @example
   * ```typescript
   * const files = await driver.uploadMultiple([
   *   { path: 'file1.jpg', content: buffer1 },
   *   { path: 'file2.jpg', content: buffer2 }
   * ]);
   * ```
   */
  uploadMultiple(
    files: Array<{ path: string; content: Buffer | Readable }>,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile[]>;

  /**
   * Downloads a file from storage as a Buffer.
   *
   * This method retrieves the entire file content into memory.
   * For large files, consider using downloadStream() instead.
   *
   * @param path - Path of the file to download
   * @param options - Optional download configuration
   *
   * @returns Promise resolving to file content as Buffer
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DownloadFailedException} If download fails
   *
   * @example
   * ```typescript
   * const buffer = await driver.download('uploads/document.pdf');
   * ```
   */
  download(path: string, options?: IStorageDownloadOptions): Promise<Buffer>;

  /**
   * Downloads a file from storage as a Stream.
   *
   * This method returns a readable stream for the file content,
   * which is more memory-efficient for large files.
   *
   * @param path - Path of the file to download
   * @param options - Optional download configuration
   *
   * @returns Promise resolving to readable stream
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DownloadFailedException} If download fails
   *
   * @example
   * ```typescript
   * const stream = await driver.downloadStream('uploads/large-file.zip');
   * stream.pipe(fs.createWriteStream('output.zip'));
   * ```
   */
  downloadStream(path: string, options?: IStorageDownloadOptions): Promise<Readable>;

  /**
   * Checks if a file exists in storage.
   *
   * @param path - Path of the file to check
   *
   * @returns Promise resolving to true if file exists, false otherwise
   *
   * @example
   * ```typescript
   * if (await driver.exists('uploads/document.pdf')) {
   *   // File exists
   * }
   * ```
   */
  exists(path: string): Promise<boolean>;

  /**
   * Deletes a file from storage.
   *
   * @param path - Path of the file to delete
   *
   * @returns Promise that resolves when deletion is complete
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DeleteFailedException} If deletion fails
   *
   * @example
   * ```typescript
   * await driver.delete('uploads/old-file.pdf');
   * ```
   */
  delete(path: string): Promise<void>;

  /**
   * Deletes multiple files from storage.
   *
   * This method performs batch deletion, which may be more efficient
   * than deleting files individually.
   *
   * @param paths - Array of file paths to delete
   *
   * @returns Promise that resolves when all deletions are complete
   *
   * @throws {DeleteFailedException} If any deletion fails
   *
   * @example
   * ```typescript
   * await driver.deleteMultiple([
   *   'uploads/file1.pdf',
   *   'uploads/file2.pdf'
   * ]);
   * ```
   */
  deleteMultiple(paths: string[]): Promise<void>;

  /**
   * Copies a file to a new location.
   *
   * @param sourcePath - Path of the source file
   * @param destinationPath - Path for the copied file
   *
   * @returns Promise that resolves when copy is complete
   *
   * @throws {FileNotFoundException} If source file doesn't exist
   * @throws {Error} If copy operation fails
   *
   * @example
   * ```typescript
   * await driver.copy(
   *   'uploads/original.pdf',
   *   'backups/original-backup.pdf'
   * );
   * ```
   */
  copy(sourcePath: string, destinationPath: string): Promise<void>;

  /**
   * Moves a file to a new location.
   *
   * This operation copies the file to the new location and then
   * deletes the original file.
   *
   * @param sourcePath - Path of the source file
   * @param destinationPath - Path for the moved file
   *
   * @returns Promise that resolves when move is complete
   *
   * @throws {FileNotFoundException} If source file doesn't exist
   * @throws {Error} If move operation fails
   *
   * @example
   * ```typescript
   * await driver.move(
   *   'uploads/temp.pdf',
   *   'uploads/permanent.pdf'
   * );
   * ```
   */
  move(sourcePath: string, destinationPath: string): Promise<void>;

  /**
   * Retrieves metadata for a file.
   *
   * @param path - Path of the file
   *
   * @returns Promise resolving to file metadata
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * const metadata = await driver.getMetadata('uploads/document.pdf');
   * console.log(metadata.contentType);
   * ```
   */
  getMetadata(path: string): Promise<IStorageMetadata>;

  /**
   * Sets metadata for a file.
   *
   * This method updates the metadata associated with a file without
   * modifying the file content itself.
   *
   * @param path - Path of the file
   * @param metadata - Metadata to set
   *
   * @returns Promise that resolves when metadata is updated
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * await driver.setMetadata('uploads/document.pdf', {
   *   cacheControl: 'max-age=31536000',
   *   customMetadata: { department: 'sales' }
   * });
   * ```
   */
  setMetadata(path: string, metadata: IStorageMetadata): Promise<void>;

  /**
   * Lists files in storage.
   *
   * This method returns a list of files matching the specified prefix,
   * with optional filtering and pagination.
   *
   * @param prefix - Optional path prefix to filter results
   * @param options - Optional listing configuration
   *
   * @returns Promise resolving to array of file metadata
   *
   * @example
   * ```typescript
   * const files = await driver.list('uploads/', {
   *   maxResults: 100,
   *   recursive: true
   * });
   * ```
   */
  list(prefix?: string, options?: IStorageListOptions): Promise<IStorageFile[]>;

  /**
   * Gets the public URL for a file.
   *
   * For public files, this returns a direct URL. For private files,
   * this may return undefined or require a presigned URL.
   *
   * @param path - Path of the file
   *
   * @returns Public URL string
   *
   * @example
   * ```typescript
   * const url = driver.getUrl('uploads/public-image.jpg');
   * // Returns: 'https://bucket.s3.amazonaws.com/uploads/public-image.jpg'
   * ```
   */
  getUrl(path: string): string;

  /**
   * Generates a presigned URL for temporary access.
   *
   * This method creates a time-limited URL that grants access to
   * private files without requiring authentication.
   *
   * @param path - Path of the file
   * @param options - Optional presigned URL configuration
   *
   * @returns Promise resolving to presigned URL
   *
   * @example
   * ```typescript
   * const url = await driver.getPresignedUrl('private/document.pdf', {
   *   expiresIn: 3600
   * });
   * ```
   */
  getPresignedUrl(path: string, options?: IStoragePresignedUrlOptions): Promise<string>;

  /**
   * Sets the visibility of a file.
   *
   * This method changes whether a file is publicly accessible or private.
   *
   * @param path - Path of the file
   * @param visibility - New visibility level
   *
   * @returns Promise that resolves when visibility is updated
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * await driver.setVisibility(
   *   'uploads/document.pdf',
   *   StorageVisibility.PUBLIC
   * );
   * ```
   */
  setVisibility(path: string, visibility: StorageVisibility): Promise<void>;

  /**
   * Gets the current visibility of a file.
   *
   * @param path - Path of the file
   *
   * @returns Promise resolving to current visibility level
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * const visibility = await driver.getVisibility('uploads/document.pdf');
   * if (visibility === StorageVisibility.PUBLIC) {
   *   // File is public
   * }
   * ```
   */
  getVisibility(path: string): Promise<StorageVisibility>;
}
