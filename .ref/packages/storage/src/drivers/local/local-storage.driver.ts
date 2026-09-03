import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import * as path from 'path';
import type { IStorageDriver } from '@interfaces/storage-driver.interface';
import type { IStorageFile } from '@interfaces/storage-file.interface';
import type { IStorageMetadata } from '@interfaces/storage-metadata.interface';
import type { IStorageUploadOptions } from '@interfaces/storage-upload-options.interface';
import type { IStorageDownloadOptions } from '@interfaces/storage-download-options.interface';
import type { IStorageListOptions } from '@interfaces/storage-list-options.interface';
import type { IStoragePresignedUrlOptions } from '@interfaces/storage-presigned-url-options.interface';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import { FileNotFoundException } from '@exceptions/file-not-found.exception';
import { UploadFailedException } from '@exceptions/upload-failed.exception';
import { DownloadFailedException } from '@exceptions/download-failed.exception';
import { DeleteFailedException } from '@exceptions/delete-failed.exception';
import type { ILocalOptions } from './local-options.interface';

/**
 * Local filesystem storage driver implementation.
 *
 * This class implements the IStorageDriver interface for local filesystem
 * storage. It provides file operations using Node.js fs/promises module
 * and supports all standard storage features.
 *
 * The driver supports:
 * - File uploads and downloads
 * - Directory creation with permissions
 * - File metadata management
 * - Visibility control via file permissions
 * - Batch operations
 *
 * @class LocalStorageDriver
 * @implements {IStorageDriver}
 *
 * @example
 * ```typescript
 * const driver = LocalStorageDriver.make({
 *   root: './storage/uploads',
 *   baseUrl: 'http://localhost:3000/files',
 *   ensureDirectoryExists: true
 * });
 *
 * await driver.connect();
 * const file = await driver.upload('documents/file.pdf', buffer);
 * ```
 */
export class LocalStorageDriver implements IStorageDriver {
  /**
   * Connection status flag.
   */
  private connected: boolean = false;

  /**
   * Driver configuration options.
   */
  private readonly options: ILocalOptions;

  /**
   * Creates a new LocalStorageDriver instance.
   *
   * @param options - Local filesystem driver configuration options
   *
   * @example
   * ```typescript
   * const driver = LocalStorageDriver.make({
   *   root: './storage/uploads',
   *   baseUrl: 'http://localhost:3000/files'
   * });
   * ```
   */
  constructor(options: ILocalOptions) {
    this.options = {
      ensureDirectoryExists: true,
      fileMode: 0o644,
      directoryMode: 0o755,
      ...options,
    };
  }

  /**
   * Establishes connection to local filesystem.
   *
   * This method ensures the root directory exists if configured to do so.
   *
   * @returns Promise that resolves when connection is established
   *
   * @throws {Error} If directory creation fails
   *
   * @example
   * ```typescript
   * await driver.connect();
   * console.log('Connected to local filesystem');
   * ```
   */
  async connect(): Promise<void> {
    try {
      if (this.options.ensureDirectoryExists) {
        await fs.mkdir(this.options.root, {
          recursive: true,
          mode: this.options.directoryMode,
        });
      }

      this.connected = true;
    } catch (error: Error | any) {
      throw new Error(`Failed to connect to local filesystem: ${error.message}`);
    }
  }

  /**
   * Closes connection to local filesystem.
   *
   * This is a no-op for local filesystem as there's no persistent connection.
   *
   * @returns Promise that resolves immediately
   *
   * @example
   * ```typescript
   * await driver.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Checks if the driver is currently connected.
   *
   * @returns true if connected, false otherwise
   *
   * @example
   * ```typescript
   * if (driver.isConnected()) {
   *   await driver.upload(...);
   * }
   * ```
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Uploads a file to local filesystem.
   *
   * This method writes content to the specified path in the configured
   * root directory. It creates parent directories if they don't exist.
   *
   * @param filePath - Destination path for the file
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
   *   'documents/document.pdf',
   *   buffer,
   *   { contentType: 'application/pdf' }
   * );
   * ```
   */
  async upload(
    filePath: string,
    content: Buffer | Readable,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      // Ensure parent directory exists
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, {
        recursive: true,
        mode: this.options.directoryMode,
      });

      // Write file content
      if (Buffer.isBuffer(content)) {
        await fs.writeFile(absolutePath, content, {
          mode: this.options.fileMode,
        });
      } else {
        // Handle stream
        await this.writeStream(absolutePath, content);
      }

      // Set visibility if specified
      if (options?.visibility) {
        await this.setVisibility(filePath, options.visibility);
      }

      // Get file stats
      const stats = await fs.stat(absolutePath);

      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        contentType: options?.contentType || this.getContentType(filePath),
        url: this.getUrl(filePath),
        lastModified: stats.mtime,
        etag: `${stats.mtime.getTime()}-${stats.size}`,
      };
    } catch (error: Error | any) {
      const size = Buffer.isBuffer(content) ? content.length : undefined;
      throw UploadFailedException.make(filePath, error, size);
    }
  }

  /**
   * Uploads multiple files to local filesystem.
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
  async uploadMultiple(
    files: Array<{ path: string; content: Buffer | Readable }>,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile[]> {
    return Promise.all(files.map((file) => this.upload(file.path, file.content, options)));
  }

  /**
   * Downloads a file from local filesystem as a Buffer.
   *
   * @param filePath - Path of the file to download
   * @param options - Optional download configuration
   *
   * @returns Promise resolving to file content as Buffer
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DownloadFailedException} If download fails
   *
   * @example
   * ```typescript
   * const buffer = await driver.download('documents/document.pdf');
   * ```
   */
  async download(filePath: string, options?: IStorageDownloadOptions): Promise<Buffer> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      return await fs.readFile(absolutePath);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw DownloadFailedException.make(filePath, error);
    }
  }

  /**
   * Downloads a file from local filesystem as a Stream.
   *
   * @param filePath - Path of the file to download
   * @param options - Optional download configuration
   *
   * @returns Promise resolving to readable stream
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DownloadFailedException} If download fails
   *
   * @example
   * ```typescript
   * const stream = await driver.downloadStream('documents/large-file.zip');
   * stream.pipe(fs.createWriteStream('output.zip'));
   * ```
   */
  async downloadStream(filePath: string, options?: IStorageDownloadOptions): Promise<Readable> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      return createReadStream(absolutePath);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw DownloadFailedException.make(filePath, error);
    }
  }

  /**
   * Checks if a file exists in local filesystem.
   *
   * @param filePath - Path of the file to check
   *
   * @returns Promise resolving to true if file exists, false otherwise
   *
   * @example
   * ```typescript
   * if (await driver.exists('documents/document.pdf')) {
   *   // File exists
   * }
   * ```
   */
  async exists(filePath: string): Promise<boolean> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file from local filesystem.
   *
   * @param filePath - Path of the file to delete
   *
   * @returns Promise that resolves when deletion is complete
   *
   * @throws {FileNotFoundException} If file doesn't exist
   * @throws {DeleteFailedException} If deletion fails
   *
   * @example
   * ```typescript
   * await driver.delete('documents/old-file.pdf');
   * ```
   */
  async delete(filePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      await fs.unlink(absolutePath);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw DeleteFailedException.make(filePath, error);
    }
  }

  /**
   * Deletes multiple files from local filesystem.
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
   *   'documents/file1.pdf',
   *   'documents/file2.pdf'
   * ]);
   * ```
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    await Promise.all(paths.map((p) => this.delete(p)));
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
   * await driver.copy(
   *   'documents/original.pdf',
   *   'backups/original-backup.pdf'
   * );
   * ```
   */
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const absoluteSourcePath = this.getAbsolutePath(sourcePath);
    const absoluteDestinationPath = this.getAbsolutePath(destinationPath);

    try {
      const exists = await this.exists(sourcePath);
      if (!exists) {
        throw FileNotFoundException.make(sourcePath);
      }

      // Ensure destination directory exists
      const directory = path.dirname(absoluteDestinationPath);
      await fs.mkdir(directory, {
        recursive: true,
        mode: this.options.directoryMode,
      });

      await fs.copyFile(absoluteSourcePath, absoluteDestinationPath);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to copy file from ${sourcePath} to ${destinationPath}: ${error.message}`
      );
    }
  }

  /**
   * Moves a file to a new location.
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
   *   'documents/temp.pdf',
   *   'documents/permanent.pdf'
   * );
   * ```
   */
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    const absoluteSourcePath = this.getAbsolutePath(sourcePath);
    const absoluteDestinationPath = this.getAbsolutePath(destinationPath);

    try {
      const exists = await this.exists(sourcePath);
      if (!exists) {
        throw FileNotFoundException.make(sourcePath);
      }

      // Ensure destination directory exists
      const directory = path.dirname(absoluteDestinationPath);
      await fs.mkdir(directory, {
        recursive: true,
        mode: this.options.directoryMode,
      });

      await fs.rename(absoluteSourcePath, absoluteDestinationPath);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to move file from ${sourcePath} to ${destinationPath}: ${error.message}`
      );
    }
  }

  /**
   * Retrieves metadata for a file.
   *
   * @param filePath - Path of the file
   *
   * @returns Promise resolving to file metadata
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * const metadata = await driver.getMetadata('documents/document.pdf');
   * console.log(metadata.size);
   * ```
   */
  async getMetadata(filePath: string): Promise<IStorageMetadata> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      const stats = await fs.stat(absolutePath);

      return {
        path: filePath,
        size: stats.size,
        contentType: this.getContentType(filePath),
        lastModified: stats.mtime,
        etag: `${stats.mtime.getTime()}-${stats.size}`,
      };
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Sets metadata for a file.
   *
   * Note: Local filesystem has limited metadata support.
   * This is a no-op for most metadata fields.
   *
   * @param filePath - Path of the file
   * @param metadata - Metadata to set
   *
   * @returns Promise that resolves when metadata is updated
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * await driver.setMetadata('documents/document.pdf', {
   *   customMetadata: { department: 'sales' }
   * });
   * ```
   */
  async setMetadata(filePath: string, metadata: IStorageMetadata): Promise<void> {
    const exists = await this.exists(filePath);
    if (!exists) {
      throw FileNotFoundException.make(filePath);
    }

    // Local filesystem has limited metadata support
    // This is a no-op for most fields
    console.warn('Local filesystem has limited metadata support');
  }

  /**
   * Lists files in local filesystem.
   *
   * @param prefix - Optional path prefix to filter results
   * @param options - Optional listing configuration
   *
   * @returns Promise resolving to array of file metadata
   *
   * @example
   * ```typescript
   * const files = await driver.list('documents/', {
   *   recursive: true
   * });
   * ```
   */
  async list(prefix?: string, options?: IStorageListOptions): Promise<IStorageFile[]> {
    const searchPath = prefix ? this.getAbsolutePath(prefix) : this.options.root;
    const files: IStorageFile[] = [];

    try {
      await this.listRecursive(searchPath, prefix || '', files, options?.recursive ?? false);

      if (options?.maxResults) {
        return files.slice(0, options.maxResults);
      }

      return files;
    } catch (error: Error | any) {
      return files;
    }
  }

  /**
   * Gets the public URL for a file.
   *
   * @param filePath - Path of the file
   *
   * @returns Public URL string
   *
   * @example
   * ```typescript
   * const url = driver.getUrl('documents/document.pdf');
   * // Returns: 'http://localhost:3000/files/documents/document.pdf'
   * ```
   */
  getUrl(filePath: string): string {
    if (this.options.baseUrl) {
      return `${this.options.baseUrl.replace(/\/$/, '')}/${filePath}`;
    }

    // Return file path if no base URL is configured
    return filePath;
  }

  /**
   * Generates a presigned URL for temporary access.
   *
   * Note: Local filesystem doesn't support presigned URLs.
   * This returns the regular URL.
   *
   * @param filePath - Path of the file
   * @param options - Optional presigned URL configuration
   *
   * @returns Promise resolving to URL
   *
   * @example
   * ```typescript
   * const url = await driver.getPresignedUrl('documents/document.pdf');
   * ```
   */
  async getPresignedUrl(filePath: string, options?: IStoragePresignedUrlOptions): Promise<string> {
    // Local filesystem doesn't support presigned URLs
    // Return regular URL instead
    return this.getUrl(filePath);
  }

  /**
   * Sets the visibility of a file.
   *
   * This method changes file permissions to control access.
   * Public files get read permissions for all users.
   *
   * @param filePath - Path of the file
   * @param visibility - New visibility level
   *
   * @returns Promise that resolves when visibility is updated
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * await driver.setVisibility(
   *   'documents/document.pdf',
   *   StorageVisibility.PUBLIC
   * );
   * ```
   */
  async setVisibility(filePath: string, visibility: StorageVisibility): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      // Set file permissions based on visibility
      const mode = visibility === StorageVisibility.PUBLIC ? 0o644 : 0o600;
      await fs.chmod(absolutePath, mode);
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Gets the current visibility of a file.
   *
   * This method checks file permissions to determine visibility.
   *
   * @param filePath - Path of the file
   *
   * @returns Promise resolving to current visibility level
   *
   * @throws {FileNotFoundException} If file doesn't exist
   *
   * @example
   * ```typescript
   * const visibility = await driver.getVisibility('documents/document.pdf');
   * ```
   */
  async getVisibility(filePath: string): Promise<StorageVisibility> {
    const absolutePath = this.getAbsolutePath(filePath);

    try {
      const exists = await this.exists(filePath);
      if (!exists) {
        throw FileNotFoundException.make(filePath);
      }

      const stats = await fs.stat(absolutePath);
      const mode = stats.mode & 0o777;

      // Check if others have read permission
      const isPublic = (mode & 0o004) !== 0;

      return isPublic ? StorageVisibility.PUBLIC : StorageVisibility.PRIVATE;
    } catch (error: Error | any) {
      if (error instanceof FileNotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Gets the absolute filesystem path for a storage path.
   *
   * @param filePath - Relative storage path
   *
   * @returns Absolute filesystem path
   *
   * @private
   */
  private getAbsolutePath(filePath: string): string {
    return path.join(this.options.root, filePath);
  }

  /**
   * Determines content type based on file extension.
   *
   * @param filePath - File path
   *
   * @returns Content type string
   *
   * @private
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Writes a stream to a file.
   *
   * @param absolutePath - Absolute file path
   * @param stream - Readable stream
   *
   * @returns Promise that resolves when write is complete
   *
   * @private
   */
  private async writeStream(absolutePath: string, stream: Readable): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(absolutePath, {
        mode: this.options.fileMode,
      });

      stream.pipe(writeStream);

      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });
  }

  /**
   * Recursively lists files in a directory.
   *
   * @param absolutePath - Absolute directory path
   * @param relativePath - Relative path from root
   * @param files - Array to accumulate files
   * @param recursive - Whether to list recursively
   *
   * @returns Promise that resolves when listing is complete
   *
   * @private
   */
  private async listRecursive(
    absolutePath: string,
    relativePath: string,
    files: IStorageFile[],
    recursive: boolean
  ): Promise<void> {
    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });

      for (const entry of entries) {
        const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const entryAbsolutePath = path.join(absolutePath, entry.name);

        if (entry.isDirectory()) {
          if (recursive) {
            await this.listRecursive(entryAbsolutePath, entryRelativePath, files, recursive);
          }
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryAbsolutePath);

          files.push({
            path: entryRelativePath,
            name: entry.name,
            size: stats.size,
            contentType: this.getContentType(entry.name),
            url: this.getUrl(entryRelativePath),
            lastModified: stats.mtime,
            etag: `${stats.mtime.getTime()}-${stats.size}`,
          });
        }
      }
    } catch (error: Error | any) {
      // Ignore errors for directories that can't be read
    }
  }
}
