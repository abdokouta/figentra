import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Readable } from 'stream';
import type { IStorageDriver } from '@interfaces/storage-driver.interface';
import type { IStorageFile } from '@interfaces/storage-file.interface';
import type { IStorageMetadata } from '@interfaces/storage-metadata.interface';
import type { IStorageUploadOptions } from '@interfaces/storage-upload-options.interface';
import type { IStorageDownloadOptions } from '@interfaces/storage-download-options.interface';
import type { IStorageListOptions } from '@interfaces/storage-list-options.interface';
import type { IStoragePresignedUrlOptions } from '@interfaces/storage-presigned-url-options.interface';
import type { IStorageOptions } from '@interfaces/storage-options.interface';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import { STORAGE_DRIVER } from '@constants/storage-driver.constant';
import { STORAGE_MODULE_OPTIONS } from '@constants/storage-module-options.constant';

/**
 * Main storage service providing high-level storage operations.
 *
 * This service acts as a facade over the storage driver, providing a
 * clean, consistent API for all storage operations. It handles lifecycle
 * management, delegates operations to the driver, and applies default
 * configuration options.
 *
 * The service integrates with NestJS lifecycle hooks to automatically
 * connect and disconnect from storage backends.
 *
 * @class StorageService
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class FileService {
 *   constructor(private readonly storage: StorageService) {}
 *
 *   async uploadFile(file: Express.Multer.File) {
 *     return await this.storage.upload(
 *       `uploads/${file.originalname}`,
 *       file.buffer
 *     );
 *   }
 * }
 * ```
 */
@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  /**
   * Creates a new StorageService instance.
   *
   * @param driver - Storage driver instance injected by the module
   * @param options - Module configuration options
   */
  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: IStorageDriver,
    @Inject(STORAGE_MODULE_OPTIONS) private readonly options: IStorageOptions
  ) {}

  /**
   * Lifecycle hook called when the module is initialized.
   *
   * This method is automatically called by NestJS during application
   * startup. It connects to the storage backend if autoConnect is enabled.
   *
   * @returns Promise that resolves when initialization is complete
   */
  async onModuleInit(): Promise<void> {
    if (this.options.autoConnect !== false && !this.driver.isConnected()) {
      await this.driver.connect();
    }
  }

  /**
   * Lifecycle hook called when the module is destroyed.
   *
   * This method is automatically called by NestJS during application
   * shutdown. It disconnects from the storage backend to clean up resources.
   *
   * @returns Promise that resolves when cleanup is complete
   */
  async onModuleDestroy(): Promise<void> {
    if (this.driver.isConnected()) {
      await this.driver.disconnect();
    }
  }

  /**
   * Uploads a file to storage.
   *
   * This method uploads content to the specified path with optional
   * configuration for visibility, metadata, and other options. If no
   * visibility is specified, uses the default from module configuration.
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
   * const file = await storage.upload(
   *   'uploads/document.pdf',
   *   buffer,
   *   {
   *     visibility: StorageVisibility.PUBLIC,
   *     contentType: 'application/pdf',
   *     metadata: {
   *       customMetadata: {
   *         uploadedBy: 'user123'
   *       }
   *     }
   *   }
   * );
   * console.log(`File uploaded: ${file.url}`);
   * ```
   */
  async upload(
    path: string,
    content: Buffer | Readable,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile> {
    const uploadOptions = this.mergeUploadOptions(options);
    return await this.driver.upload(path, content, uploadOptions);
  }

  /**
   * Uploads multiple files to storage.
   *
   * This method performs batch upload of multiple files with the same
   * configuration applied to all files.
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
   * const files = await storage.uploadMultiple([
   *   { path: 'images/photo1.jpg', content: buffer1 },
   *   { path: 'images/photo2.jpg', content: buffer2 }
   * ], {
   *   visibility: StorageVisibility.PUBLIC
   * });
   * ```
   */
  async uploadMultiple(
    files: Array<{ path: string; content: Buffer | Readable }>,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile[]> {
    const uploadOptions = this.mergeUploadOptions(options);
    return await this.driver.uploadMultiple(files, uploadOptions);
  }

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
   * const buffer = await storage.download('uploads/document.pdf');
   * // Use buffer for processing or saving
   * ```
   */
  async download(path: string, options?: IStorageDownloadOptions): Promise<Buffer> {
    return await this.driver.download(path, options);
  }

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
   * const stream = await storage.downloadStream('uploads/large-video.mp4');
   * stream.pipe(response); // Stream to HTTP response
   * ```
   */
  async downloadStream(path: string, options?: IStorageDownloadOptions): Promise<Readable> {
    return await this.driver.downloadStream(path, options);
  }

  /**
   * Checks if a file exists in storage.
   *
   * @param path - Path of the file to check
   *
   * @returns Promise resolving to true if file exists, false otherwise
   *
   * @example
   * ```typescript
   * if (await storage.exists('uploads/document.pdf')) {
   *   console.log('File exists');
   * } else {
   *   console.log('File not found');
   * }
   * ```
   */
  async exists(path: string): Promise<boolean> {
    return await this.driver.exists(path);
  }

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
   * await storage.delete('uploads/old-file.pdf');
   * console.log('File deleted successfully');
   * ```
   */
  async delete(path: string): Promise<void> {
    return await this.driver.delete(path);
  }

  /**
   * Deletes multiple files from storage.
   *
   * This method performs batch deletion, which is more efficient
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
   * await storage.deleteMultiple([
   *   'uploads/file1.pdf',
   *   'uploads/file2.pdf',
   *   'uploads/file3.pdf'
   * ]);
   * ```
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    return await this.driver.deleteMultiple(paths);
  }

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
   * await storage.copy(
   *   'uploads/original.pdf',
   *   'backups/original-backup.pdf'
   * );
   * ```
   */
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    return await this.driver.copy(sourcePath, destinationPath);
  }

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
   * await storage.move(
   *   'uploads/temp/file.pdf',
   *   'uploads/permanent/file.pdf'
   * );
   * ```
   */
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    return await this.driver.move(sourcePath, destinationPath);
  }

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
   * const metadata = await storage.getMetadata('uploads/document.pdf');
   * console.log(`Content Type: ${metadata.contentType}`);
   * console.log(`Cache Control: ${metadata.cacheControl}`);
   * ```
   */
  async getMetadata(path: string): Promise<IStorageMetadata> {
    return await this.driver.getMetadata(path);
  }

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
   * await storage.setMetadata('uploads/document.pdf', {
   *   cacheControl: 'max-age=31536000, public',
   *   customMetadata: {
   *     department: 'sales',
   *     category: 'reports'
   *   }
   * });
   * ```
   */
  async setMetadata(path: string, metadata: IStorageMetadata): Promise<void> {
    return await this.driver.setMetadata(path, metadata);
  }

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
   * // List all files in uploads directory
   * const files = await storage.list('uploads/');
   *
   * // List with options
   * const files = await storage.list('uploads/', {
   *   maxResults: 100,
   *   recursive: true
   * });
   *
   * files.forEach(file => {
   *   console.log(`${file.name}: ${file.size} bytes`);
   * });
   * ```
   */
  async list(prefix?: string, options?: IStorageListOptions): Promise<IStorageFile[]> {
    return await this.driver.list(prefix, options);
  }

  /**
   * Gets the public URL for a file.
   *
   * For public files, this returns a direct URL. For private files,
   * use getPresignedUrl() instead.
   *
   * @param path - Path of the file
   *
   * @returns Public URL string
   *
   * @example
   * ```typescript
   * const url = storage.getUrl('uploads/public-image.jpg');
   * // Returns: 'https://bucket.s3.amazonaws.com/uploads/public-image.jpg'
   * ```
   */
  getUrl(path: string): string {
    return this.driver.getUrl(path);
  }

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
   * const url = await storage.getPresignedUrl('private/document.pdf', {
   *   expiresIn: 3600, // 1 hour
   *   responseHeaders: {
   *     'Content-Disposition': 'attachment; filename="document.pdf"'
   *   }
   * });
   *
   * // Share this URL with users for temporary access
   * ```
   */
  async getPresignedUrl(path: string, options?: IStoragePresignedUrlOptions): Promise<string> {
    const presignedOptions = {
      ...options,
      expiresIn: options?.expiresIn ?? this.options.presignedUrlExpiration ?? 3600,
    };
    return await this.driver.getPresignedUrl(path, presignedOptions);
  }

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
   * // Make file public
   * await storage.setVisibility(
   *   'uploads/document.pdf',
   *   StorageVisibility.PUBLIC
   * );
   *
   * // Make file private
   * await storage.setVisibility(
   *   'uploads/sensitive.pdf',
   *   StorageVisibility.PRIVATE
   * );
   * ```
   */
  async setVisibility(path: string, visibility: StorageVisibility): Promise<void> {
    return await this.driver.setVisibility(path, visibility);
  }

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
   * const visibility = await storage.getVisibility('uploads/document.pdf');
   * if (visibility === StorageVisibility.PUBLIC) {
   *   console.log('File is publicly accessible');
   * } else {
   *   console.log('File is private');
   * }
   * ```
   */
  async getVisibility(path: string): Promise<StorageVisibility> {
    return await this.driver.getVisibility(path);
  }

  /**
   * Checks if the storage driver is currently connected.
   *
   * @returns true if connected, false otherwise
   *
   * @example
   * ```typescript
   * if (storage.isConnected()) {
   *   console.log('Storage is ready');
   * }
   * ```
   */
  isConnected(): boolean {
    return this.driver.isConnected();
  }

  /**
   * Manually connects to the storage backend.
   *
   * This method is usually called automatically by onModuleInit,
   * but can be used for manual connection management.
   *
   * @returns Promise that resolves when connection is established
   *
   * @throws {Error} If connection fails
   *
   * @example
   * ```typescript
   * await storage.connect();
   * ```
   */
  async connect(): Promise<void> {
    return await this.driver.connect();
  }

  /**
   * Manually disconnects from the storage backend.
   *
   * This method is usually called automatically by onModuleDestroy,
   * but can be used for manual connection management.
   *
   * @returns Promise that resolves when disconnection is complete
   *
   * @example
   * ```typescript
   * await storage.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    return await this.driver.disconnect();
  }

  /**
   * Gets the underlying storage driver instance.
   *
   * This method provides access to the driver for advanced operations
   * or driver-specific functionality not exposed by the service.
   *
   * @returns Storage driver instance
   *
   * @example
   * ```typescript
   * const driver = storage.getDriver();
   * // Use driver-specific methods
   * ```
   */
  getDriver(): IStorageDriver {
    return this.driver;
  }

  /**
   * Merges upload options with defaults from module configuration.
   *
   * @param options - User-provided upload options
   *
   * @returns Merged upload options
   *
   * @private
   */
  private mergeUploadOptions(options?: IStorageUploadOptions): IStorageUploadOptions {
    return {
      ...options,
      visibility:
        options?.visibility ??
        (this.options.defaultVisibility as StorageVisibility) ??
        StorageVisibility.PRIVATE,
    };
  }
}
