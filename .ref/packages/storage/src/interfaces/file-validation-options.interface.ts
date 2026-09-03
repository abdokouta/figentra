/**
 * File validation options interface.
 *
 * @interface FileValidationOptions
 */
export interface FileValidationOptions {
  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;

  /**
   * Minimum file size in bytes.
   */
  minSize?: number;

  /**
   * Allowed MIME types (supports wildcards).
   */
  allowedMimeTypes?: string[];

  /**
   * Allowed file extensions (with or without dots).
   */
  allowedExtensions?: string[];

  /**
   * Whether to validate path for security.
   */
  validatePath?: boolean;
}
