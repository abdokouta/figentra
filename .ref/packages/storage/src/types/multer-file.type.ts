/**
 * Type definition for Multer file uploads.
 *
 * This type represents the structure of files uploaded via Multer
 * middleware in Express/NestJS applications.
 *
 * @interface MulterFile
 *
 * @example
 * ```typescript
 * async uploadFile(file: MulterFile) {
 *   await this.storage.upload(
 *     `uploads/${file.originalname}`,
 *     file.buffer
 *   );
 * }
 * ```
 */
export interface MulterFile {
  /**
   * Field name specified in the form.
   */
  fieldname: string;

  /**
   * Name of the file on the user's computer.
   */
  originalname: string;

  /**
   * Encoding type of the file.
   */
  encoding: string;

  /**
   * MIME type of the file.
   */
  mimetype: string;

  /**
   * Size of the file in bytes.
   */
  size: number;

  /**
   * File content as a Buffer.
   * Available when using memory storage.
   */
  buffer: Buffer;

  /**
   * Destination directory (when using disk storage).
   */
  destination?: string;

  /**
   * File name within the destination (when using disk storage).
   */
  filename?: string;

  /**
   * Full path to the uploaded file (when using disk storage).
   */
  path?: string;

  /**
   * Stream of the file (when using streams).
   */
  stream?: NodeJS.ReadableStream;
}
