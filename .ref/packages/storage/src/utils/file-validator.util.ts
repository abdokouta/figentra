import { MimeTypeUtil } from './mime-type.util';
import { PathNormalizerUtil } from './path-normalizer.util';
import type { ValidationResult } from '@/interfaces/validation-result.interface';
import type { FileValidationOptions } from '@/interfaces/file-validation-options.interface';

/**
 * Utility class for validating files before storage operations.
 *
 * This class provides methods for validating file size, MIME types,
 * extensions, and paths to ensure files meet requirements before
 * being uploaded to storage.
 *
 * @class FileValidatorUtil
 *
 * @example
 * ```typescript
 * const result = FileValidatorUtil.validate(buffer, 'file.pdf', {
 *   maxSize: 10485760,
 *   allowedMimeTypes: ['application/pdf'],
 *   validatePath: true
 * });
 *
 * if (!result.valid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export class FileValidatorUtil {
  /**
   * Validates a file against specified criteria.
   *
   * This method performs comprehensive validation including size checks,
   * MIME type validation, extension validation, and path security checks.
   *
   * @param content - File content as Buffer
   * @param path - File path
   * @param options - Validation options
   *
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = FileValidatorUtil.validate(buffer, 'uploads/doc.pdf', {
   *   maxSize: 10485760,
   *   allowedMimeTypes: ['application/pdf']
   * });
   *
   * if (!result.valid) {
   *   console.error(result.error);
   * }
   * ```
   */
  static validate(
    content: Buffer,
    path: string,
    options: FileValidationOptions = {}
  ): ValidationResult {
    // Validate path security
    if (options.validatePath !== false) {
      const pathResult = this.validatePath(path);
      if (!pathResult.valid) {
        return pathResult;
      }
    }

    // Validate file size
    if (options.maxSize !== undefined || options.minSize !== undefined) {
      const sizeResult = this.validateSize(content.length, options);
      if (!sizeResult.valid) {
        return sizeResult;
      }
    }

    // Validate MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      const mimeType = MimeTypeUtil.getMimeType(path);
      const mimeResult = this.validateMimeType(mimeType, options.allowedMimeTypes);
      if (!mimeResult.valid) {
        return mimeResult;
      }
    }

    // Validate file extension
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const extension = PathNormalizerUtil.getExtension(path);
      const extResult = this.validateExtension(extension, options.allowedExtensions);
      if (!extResult.valid) {
        return extResult;
      }
    }

    return { valid: true };
  }

  /**
   * Validates file size against min/max constraints.
   *
   * @param size - File size in bytes
   * @param options - Validation options containing maxSize and/or minSize
   *
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = FileValidatorUtil.validateSize(1024000, {
   *   maxSize: 10485760,
   *   minSize: 1024
   * });
   * ```
   */
  static validateSize(
    size: number,
    options: Pick<FileValidationOptions, 'maxSize' | 'minSize'>
  ): ValidationResult {
    if (options.maxSize !== undefined && size > options.maxSize) {
      return {
        valid: false,
        error: `File size ${size} bytes exceeds maximum allowed size of ${options.maxSize} bytes`,
      };
    }

    if (options.minSize !== undefined && size < options.minSize) {
      return {
        valid: false,
        error: `File size ${size} bytes is below minimum required size of ${options.minSize} bytes`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates MIME type against allowed types.
   *
   * @param mimeType - MIME type to validate
   * @param allowedTypes - Array of allowed MIME type patterns
   *
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = FileValidatorUtil.validateMimeType('image/jpeg', [
   *   'image/*',
   *   'application/pdf'
   * ]);
   * ```
   */
  static validateMimeType(mimeType: string, allowedTypes: string[]): ValidationResult {
    if (!MimeTypeUtil.isAllowed(mimeType, allowedTypes)) {
      return {
        valid: false,
        error: `MIME type '${mimeType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates file extension against allowed extensions.
   *
   * @param extension - File extension (with or without leading dot)
   * @param allowedExtensions - Array of allowed extensions
   *
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = FileValidatorUtil.validateExtension('.pdf', [
   *   '.pdf',
   *   '.doc',
   *   '.docx'
   * ]);
   * ```
   */
  static validateExtension(extension: string, allowedExtensions: string[]): ValidationResult {
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    const normalizedAllowed = allowedExtensions.map((ext) =>
      ext.startsWith('.') ? ext : `.${ext}`
    );

    if (!normalizedAllowed.includes(normalizedExt)) {
      return {
        valid: false,
        error: `File extension '${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates path for security issues.
   *
   * @param path - Path to validate
   *
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = FileValidatorUtil.validatePath('uploads/file.pdf');
   * // Returns: { valid: true }
   *
   * const badResult = FileValidatorUtil.validatePath('../../../etc/passwd');
   * // Returns: { valid: false, error: '...' }
   * ```
   */
  static validatePath(path: string): ValidationResult {
    if (!PathNormalizerUtil.isValidPath(path)) {
      return {
        valid: false,
        error: `Invalid or unsafe file path: ${path}`,
      };
    }

    return { valid: true };
  }
}
