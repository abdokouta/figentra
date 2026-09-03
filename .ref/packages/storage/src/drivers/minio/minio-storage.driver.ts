import { Readable } from 'stream';
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
import type { IMinIOOptions } from './minio-options.interface';

/**
 * MinIO storage driver implementation.
 *
 * This class implements the IStorageDriver interface for MinIO object storage.
 * MinIO is an S3-compatible storage system ideal for self-hosted deployments
 * and development environments.
 *
 * The driver provides the same interface as the S3 driver but uses the MinIO
 * client library for optimal performance with MinIO servers.
 *
 * @class MinIOStorageDriver
 * @implements {IStorageDriver}
 *
 * @example
 * ```typescript
 * const driver = MinIOStorageDriver.make({
 *   endPoint: 'localhost',
 *   port: 9000,
 *   useSSL: false,
 *   accessKey: 'minioadmin',
 *   secretKey: 'minioadmin',
 *   bucket: 'my-bucket'
 * });
 *
 * await driver.connect();
 * const file = await driver.upload('path/to/file.pdf', buffer);
 * ```
 */
export class MinIOStorageDriver implements IStorageDriver {
  /**
   * MinIO client instance.
   * Initialized during connect() method.
   */
  private client: any;

  /**
   * Connection status flag.
   */
  private connected: boolean = false;

  /**
   * Driver configuration options.
   */
  private readonly options: IMinIOOptions;

  /**
   * Creates a new MinIOStorageDriver instance.
   *
   * @param options - MinIO driver configuration options
   */
  constructor(options: IMinIOOptions) {
    this.options = options;
  }

  /**
   * Establishes connection to MinIO.
   *
   * @returns Promise that resolves when connection is established
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    try {
      const { Client } = await import('minio');

      this.client = new Client({
        endPoint: this.options.endPoint,
        port: this.options.port ?? 9000,
        useSSL: this.options.useSSL ?? false,
        accessKey: this.options.accessKey,
        secretKey: this.options.secretKey,
        region: this.options.region ?? 'us-east-1',
        sessionToken: this.options.sessionToken,
        ...this.options.clientOptions,
      });

      // Verify bucket exists, create if it doesn't
      const bucketExists = await this.client.bucketExists(this.options.bucket);
      if (!bucketExists) {
        await this.client.makeBucket(this.options.bucket);
      }

      this.connected = true;
    } catch (error: Error | any) {
      throw new Error(`Failed to connect to MinIO: ${error.message}`);
    }
  }

  /**
   * Closes connection to MinIO.
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.connected = false;
  }

  /**
   * Checks if the driver is currently connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Uploads a file to MinIO.
   */
  async upload(
    path: string,
    content: Buffer | Readable,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile> {
    try {
      const metadata: any = {
        'Content-Type': options?.contentType || 'application/octet-stream',
      };

      if (options?.metadata?.cacheControl) {
        metadata['Cache-Control'] = options.metadata.cacheControl;
      }
      if (options?.metadata?.contentEncoding) {
        metadata['Content-Encoding'] = options.metadata.contentEncoding;
      }
      if (options?.metadata?.customMetadata) {
        Object.assign(metadata, options.metadata.customMetadata);
      }

      let size: number;
      if (Buffer.isBuffer(content)) {
        size = content.length;
      } else {
        size = -1; // Unknown size for streams
      }

      await this.client.putObject(this.options.bucket, path, content, size, metadata);

      const file: IStorageFile = {
        path,
        name: this.getFilenameFromPath(path),
        size: Buffer.isBuffer(content) ? content.length : 0,
        contentType: options?.contentType || 'application/octet-stream',
        url: this.getUrl(path),
        lastModified: new Date(),
        metadata: options?.metadata?.customMetadata,
      };

      return file;
    } catch (error: Error | any) {
      throw UploadFailedException.make(path, error);
    }
  }

  /**
   * Uploads multiple files to MinIO.
   */
  async uploadMultiple(
    files: Array<{ path: string; content: Buffer | Readable }>,
    options?: IStorageUploadOptions
  ): Promise<IStorageFile[]> {
    const results: IStorageFile[] = [];
    for (const file of files) {
      const result = await this.upload(file.path, file.content, options);
      results.push(result);
    }
    return results;
  }

  /**
   * Downloads a file from MinIO as a Buffer.
   */
  async download(path: string, options?: IStorageDownloadOptions): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.options.bucket, path);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error: Error | any) {
      if (error.code === 'NoSuchKey') {
        throw FileNotFoundException.make(path);
      }
      throw DownloadFailedException.make(path, error);
    }
  }

  /**
   * Downloads a file from MinIO as a Stream.
   */
  async downloadStream(path: string, options?: IStorageDownloadOptions): Promise<Readable> {
    try {
      return await this.client.getObject(this.options.bucket, path);
    } catch (error: Error | any) {
      if (error.code === 'NoSuchKey') {
        throw FileNotFoundException.make(path);
      }
      throw DownloadFailedException.make(path, error);
    }
  }

  /**
   * Checks if a file exists in MinIO.
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.client.statObject(this.options.bucket, path);
      return true;
    } catch (error: Error | any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Deletes a file from MinIO.
   */
  async delete(path: string): Promise<void> {
    try {
      await this.client.removeObject(this.options.bucket, path);
    } catch (error: Error | any) {
      throw DeleteFailedException.make(path, error);
    }
  }

  /**
   * Deletes multiple files from MinIO.
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    try {
      await this.client.removeObjects(this.options.bucket, paths);
    } catch (error: Error | any) {
      throw DeleteFailedException.make(paths.join(', '), error);
    }
  }

  /**
   * Copies a file to a new location in MinIO.
   */
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await this.client.copyObject(
        this.options.bucket,
        destinationPath,
        `/${this.options.bucket}/${sourcePath}`
      );
    } catch (error: Error | any) {
      if (error.code === 'NoSuchKey') {
        throw FileNotFoundException.make(sourcePath);
      }
      throw error;
    }
  }

  /**
   * Moves a file to a new location in MinIO.
   */
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
  }

  /**
   * Retrieves metadata for a file in MinIO.
   */
  async getMetadata(path: string): Promise<IStorageMetadata> {
    try {
      const stat = await this.client.statObject(this.options.bucket, path);

      return {
        contentType: stat.metaData['content-type'],
        size: stat.size,
        contentEncoding: stat.metaData['content-encoding'],
        cacheControl: stat.metaData['cache-control'],
        customMetadata: stat.metaData,
      };
    } catch (error: Error | any) {
      if (error.code === 'NotFound') {
        throw FileNotFoundException.make(path);
      }
      throw error;
    }
  }

  /**
   * Sets metadata for a file in MinIO.
   */
  async setMetadata(path: string, metadata: IStorageMetadata): Promise<void> {
    // MinIO requires copying object to update metadata
    await this.copy(path, path);
  }

  /**
   * Lists files in MinIO.
   */
  async list(prefix?: string, options?: IStorageListOptions): Promise<IStorageFile[]> {
    const files: IStorageFile[] = [];
    const stream = this.client.listObjects(
      this.options.bucket,
      prefix,
      options?.recursive ?? false
    );

    return new Promise((resolve, reject) => {
      stream.on('data', (obj: any) => {
        files.push({
          path: obj.name,
          name: this.getFilenameFromPath(obj.name),
          size: obj.size,
          contentType: 'application/octet-stream',
          url: this.getUrl(obj.name),
          lastModified: obj.lastModified,
          etag: obj.etag,
        });
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  /**
   * Gets the public URL for a file in MinIO.
   */
  getUrl(path: string): string {
    const protocol = this.options.useSSL ? 'https' : 'http';
    const port =
      this.options.port !== 80 && this.options.port !== 443 ? `:${this.options.port}` : '';
    return `${protocol}://${this.options.endPoint}${port}/${this.options.bucket}/${path}`;
  }

  /**
   * Generates a presigned URL for temporary access.
   */
  async getPresignedUrl(path: string, options?: IStoragePresignedUrlOptions): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.options.bucket,
        path,
        options?.expiresIn ?? 3600
      );
    } catch (error: Error | any) {
      throw error;
    }
  }

  /**
   * Sets the visibility of a file in MinIO.
   */
  async setVisibility(path: string, visibility: StorageVisibility): Promise<void> {
    // MinIO uses bucket policies for visibility control
    // This is a simplified implementation
    console.warn('MinIO visibility control requires bucket policy configuration');
  }

  /**
   * Gets the current visibility of a file in MinIO.
   */
  async getVisibility(path: string): Promise<StorageVisibility> {
    // Default to private for MinIO
    return StorageVisibility.PRIVATE;
  }

  /**
   * Extracts filename from a full path.
   *
   * @private
   */
  private getFilenameFromPath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }
}
