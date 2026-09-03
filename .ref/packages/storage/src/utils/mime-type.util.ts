import * as mimeTypes from 'mime-types';

/**
 * Utility class for MIME type detection and manipulation.
 *
 * This class provides methods for detecting MIME types from file extensions,
 * file paths, and content. It uses the mime-types library for accurate
 * MIME type resolution.
 *
 * @class MimeTypeUtil
 *
 * @example
 * ```typescript
 * const mimeType = MimeTypeUtil.getMimeType('document.pdf');
 * // Returns: 'application/pdf'
 *
 * const extension = MimeTypeUtil.getExtension('image/jpeg');
 * // Returns: '.jpg'
 * ```
 */
export class MimeTypeUtil {
  /**
   * Gets the MIME type for a given file path or extension.
   *
   * This method determines the MIME type based on the file extension.
   * If the MIME type cannot be determined, returns a default value.
   *
   * @param pathOrExtension - File path or extension (with or without dot)
   * @param defaultType - Default MIME type if detection fails
   *
   * @returns MIME type string
   *
   * @example
   * ```typescript
   * MimeTypeUtil.getMimeType('document.pdf');
   * // Returns: 'application/pdf'
   *
   * MimeTypeUtil.getMimeType('.jpg');
   * // Returns: 'image/jpeg'
   *
   * MimeTypeUtil.getMimeType('unknown.xyz', 'application/octet-stream');
   * // Returns: 'application/octet-stream'
   * ```
   */
  static getMimeType(
    pathOrExtension: string,
    defaultType: string = 'application/octet-stream'
  ): string {
    const mimeType = mimeTypes.lookup(pathOrExtension);
    return mimeType || defaultType;
  }

  /**
   * Gets the file extension for a given MIME type.
   *
   * This method returns the most common file extension associated with
   * the provided MIME type, including the leading dot.
   *
   * @param mimeType - MIME type string
   *
   * @returns File extension with leading dot, or undefined if not found
   *
   * @example
   * ```typescript
   * MimeTypeUtil.getExtension('image/jpeg');
   * // Returns: '.jpg'
   *
   * MimeTypeUtil.getExtension('application/pdf');
   * // Returns: '.pdf'
   *
   * MimeTypeUtil.getExtension('unknown/type');
   * // Returns: undefined
   * ```
   */
  static getExtension(mimeType: string): string | undefined {
    const extension = mimeTypes.extension(mimeType);
    return extension ? `.${extension}` : undefined;
  }

  /**
   * Checks if a MIME type matches a pattern.
   *
   * This method supports wildcard patterns for matching MIME type categories.
   * Useful for validating file types against allowed patterns.
   *
   * @param mimeType - MIME type to check
   * @param pattern - Pattern to match against (supports wildcards)
   *
   * @returns true if MIME type matches pattern, false otherwise
   *
   * @example
   * ```typescript
   * MimeTypeUtil.matches('image/jpeg', 'image/*');
   * // Returns: true
   *
   * MimeTypeUtil.matches('application/pdf', 'image/*');
   * // Returns: false
   *
   * MimeTypeUtil.matches('image/png', 'image/png');
   * // Returns: true
   * ```
   */
  static matches(mimeType: string, pattern: string): boolean {
    if (pattern === '*/*' || pattern === '*') {
      return true;
    }

    if (pattern.endsWith('/*')) {
      const category = pattern.slice(0, -2);
      return mimeType.startsWith(`${category}/`);
    }

    return mimeType === pattern;
  }

  /**
   * Checks if a MIME type is allowed based on a list of patterns.
   *
   * This method validates a MIME type against multiple allowed patterns,
   * supporting wildcards for flexible matching.
   *
   * @param mimeType - MIME type to check
   * @param allowedTypes - Array of allowed MIME type patterns
   *
   * @returns true if MIME type is allowed, false otherwise
   *
   * @example
   * ```typescript
   * MimeTypeUtil.isAllowed('image/jpeg', ['image/*', 'application/pdf']);
   * // Returns: true
   *
   * MimeTypeUtil.isAllowed('video/mp4', ['image/*', 'application/pdf']);
   * // Returns: false
   * ```
   */
  static isAllowed(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((pattern) => this.matches(mimeType, pattern));
  }

  /**
   * Checks if a MIME type represents an image.
   *
   * @param mimeType - MIME type to check
   *
   * @returns true if MIME type is an image, false otherwise
   *
   * @example
   * ```typescript
   * MimeTypeUtil.isImage('image/jpeg');
   * // Returns: true
   *
   * MimeTypeUtil.isImage('application/pdf');
   * // Returns: false
   * ```
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Checks if a MIME type represents a video.
   *
   * @param mimeType - MIME type to check
   *
   * @returns true if MIME type is a video, false otherwise
   *
   * @example
   * ```typescript
   * MimeTypeUtil.isVideo('video/mp4');
   * // Returns: true
   * ```
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Checks if a MIME type represents an audio file.
   *
   * @param mimeType - MIME type to check
   *
   * @returns true if MIME type is audio, false otherwise
   *
   * @example
   * ```typescript
   * MimeTypeUtil.isAudio('audio/mpeg');
   * // Returns: true
   * ```
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }
}
