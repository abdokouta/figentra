import * as path from 'node:path';

/**
 * Attachment Class
 *
 * Fluent builder for email attachments inspired by Laravel.
 * Supports attachments from filesystem, storage, URLs, and in-memory data.
 *
 * @example
 * ```typescript
 * // From filesystem path
 * Attachment.fromPath('/path/to/file.pdf')
 *   .as('invoice.pdf')
 *   .withMime('application/pdf');
 *
 * // From storage (requires storage service)
 * Attachment.fromStorage('uploads/file.pdf')
 *   .as('document.pdf');
 *
 * // From buffer/data
 * Attachment.fromData(buffer, 'report.pdf')
 *   .withMime('application/pdf');
 * ```
 */
export class Attachment {
  /**
   * Attachment filename
   */
  private filename?: string;

  /**
   * MIME type
   */
  private mimeType?: string;

  /**
   * File path (for file attachments)
   */
  private filePath?: string;

  /**
   * Buffer data (for in-memory attachments)
   */
  private data?: Buffer | string;

  /**
   * Storage disk name (for storage attachments)
   */
  private disk?: string;

  /**
   * Storage path (for storage attachments)
   */
  private storagePath?: string;

  /**
   * Create attachment from filesystem path
   *
   * @param filepath - Absolute or relative path to file
   * @returns Attachment instance
   *
   * @example
   * ```typescript
   * Attachment.fromPath('/path/to/invoice.pdf')
   *   .as('invoice.pdf')
   *   .withMime('application/pdf');
   * ```
   */
  public static fromPath(filepath: string): Attachment {
    const attachment = Attachment.make();
    attachment.filePath = filepath;
    attachment.filename = path.basename(filepath);
    return attachment;
  }

  /**
   * Create attachment from storage disk
   *
   * @param storagePath - Path within storage disk
   * @param diskName - Storage disk name (optional, uses default disk)
   * @returns Attachment instance
   *
   * @example
   * ```typescript
   * // From default storage
   * Attachment.fromStorage('uploads/invoice.pdf')
   *   .as('invoice.pdf');
   *
   * // From specific disk
   * Attachment.fromStorage('uploads/invoice.pdf', 's3')
   *   .as('invoice.pdf');
   * ```
   */
  public static fromStorage(storagePath: string, diskName?: string): Attachment {
    const attachment = Attachment.make();
    attachment.storagePath = storagePath;
    attachment.disk = diskName;
    attachment.filename = path.basename(storagePath);
    return attachment;
  }

  /**
   * Create attachment from Buffer or string data
   *
   * @param data - Buffer or string content
   * @param filename - Filename for the attachment
   * @returns Attachment instance
   *
   * @example
   * ```typescript
   * const buffer = Buffer.from('Hello World');
   * Attachment.fromData(buffer, 'greeting.txt')
   *   .withMime('text/plain');
   * ```
   */
  public static fromData(data: Buffer | string, filename: string): Attachment {
    const attachment = Attachment.make();
    attachment.data = data;
    attachment.filename = filename;
    return attachment;
  }

  /**
   * Create attachment from URL
   *
   * @param url - URL to download file from
   * @returns Attachment instance
   *
   * @example
   * ```typescript
   * Attachment.fromUrl('https://example.com/file.pdf')
   *   .as('document.pdf');
   * ```
   */
  public static fromUrl(url: string): Attachment {
    return Attachment.fromPath(url);
  }

  /**
   * Set the attachment filename
   *
   * @param filename - Custom filename for the attachment
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * attachment.as('custom-name.pdf');
   * ```
   */
  public as(filename: string): this {
    this.filename = filename;
    return this;
  }

  /**
   * Set the MIME type
   *
   * @param mime - MIME type string
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * attachment.withMime('application/pdf');
   * ```
   */
  public withMime(mime: string): this {
    this.mimeType = mime;
    return this;
  }

  /**
   * Convert attachment to Nodemailer format
   *
   * @returns Nodemailer attachment object
   * @internal
   */
  public toNodemailerFormat(): any {
    const result: any = {
      filename: this.filename,
    };

    if (this.mimeType) {
      result.contentType = this.mimeType;
    }

    // File path attachment
    if (this.filePath) {
      result.path = this.filePath;
      return result;
    }

    // In-memory data attachment
    if (this.data) {
      result.content = this.data;
      return result;
    }

    // Storage attachment (needs to be resolved by storage service)
    if (this.storagePath) {
      result._storage = {
        path: this.storagePath,
        disk: this.disk,
      };
      return result;
    }

    throw new Error('Attachment must have either filePath, data, or storagePath');
  }

  /**
   * Check if attachment is from storage
   *
   * @returns true if from storage
   * @internal
   */
  public isFromStorage(): boolean {
    return !!this.storagePath;
  }

  /**
   * Get storage information
   *
   * @returns Storage path and disk
   * @internal
   */
  public getStorageInfo(): { path: string; disk?: string } | null {
    if (!this.storagePath) {
      return null;
    }

    return {
      path: this.storagePath,
      disk: this.disk,
    };
  }
}
