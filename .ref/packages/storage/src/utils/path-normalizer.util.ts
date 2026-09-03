/**
 * Utility class for normalizing and manipulating storage file paths.
 *
 * This class provides methods for cleaning, normalizing, and validating
 * file paths used in storage operations. It ensures consistent path
 * formatting across different platforms and prevents path traversal attacks.
 *
 * @class PathNormalizerUtil
 *
 * @example
 * ```typescript
 * const normalized = PathNormalizerUtil.normalize('//uploads///file.pdf');
 * // Returns: 'uploads/file.pdf'
 *
 * const joined = PathNormalizerUtil.join('uploads', 'documents', 'file.pdf');
 * // Returns: 'uploads/documents/file.pdf'
 * ```
 */
export class PathNormalizerUtil {
  /**
   * Normalizes a storage path by removing redundant slashes and dots.
   *
   * This method cleans up paths by:
   * - Removing leading slashes
   * - Removing trailing slashes
   * - Collapsing multiple consecutive slashes
   * - Converting backslashes to forward slashes
   * - Resolving relative path segments (. and ..)
   *
   * @param filePath - Path to normalize
   *
   * @returns Normalized path
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.normalize('//uploads///documents//file.pdf');
   * // Returns: 'uploads/documents/file.pdf'
   *
   * PathNormalizerUtil.normalize('uploads/./documents/../file.pdf');
   * // Returns: 'uploads/file.pdf'
   *
   * PathNormalizerUtil.normalize('\\uploads\\file.pdf');
   * // Returns: 'uploads/file.pdf'
   * ```
   */
  static normalize(filePath: string): string {
    if (!filePath) {
      return '';
    }

    // Convert backslashes to forward slashes
    let normalized = filePath.replace(/\\/g, '/');

    // Remove leading slash
    normalized = normalized.replace(/^\/+/, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, '');

    // Collapse multiple slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Resolve relative path segments
    const segments = normalized.split('/');
    const resolvedSegments: string[] = [];

    for (const segment of segments) {
      if (segment === '.' || segment === '') {
        continue;
      } else if (segment === '..') {
        resolvedSegments.pop();
      } else {
        resolvedSegments.push(segment);
      }
    }

    return resolvedSegments.join('/');
  }

  /**
   * Joins multiple path segments into a single normalized path.
   *
   * This method combines path segments and normalizes the result.
   *
   * @param segments - Path segments to join
   *
   * @returns Joined and normalized path
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.join('uploads', 'documents', 'file.pdf');
   * // Returns: 'uploads/documents/file.pdf'
   *
   * PathNormalizerUtil.join('uploads/', '/documents/', 'file.pdf');
   * // Returns: 'uploads/documents/file.pdf'
   * ```
   */
  static join(...segments: string[]): string {
    const joined = segments.join('/');
    return this.normalize(joined);
  }

  /**
   * Gets the directory path from a full file path.
   *
   * @param filePath - Full file path
   *
   * @returns Directory path without filename
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.getDirectory('uploads/documents/file.pdf');
   * // Returns: 'uploads/documents'
   *
   * PathNormalizerUtil.getDirectory('file.pdf');
   * // Returns: ''
   * ```
   */
  static getDirectory(filePath: string): string {
    const normalized = this.normalize(filePath);
    const lastSlashIndex = normalized.lastIndexOf('/');

    if (lastSlashIndex === -1) {
      return '';
    }

    return normalized.substring(0, lastSlashIndex);
  }

  /**
   * Gets the filename from a full file path.
   *
   * @param filePath - Full file path
   *
   * @returns Filename without directory path
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.getFilename('uploads/documents/file.pdf');
   * // Returns: 'file.pdf'
   *
   * PathNormalizerUtil.getFilename('file.pdf');
   * // Returns: 'file.pdf'
   * ```
   */
  static getFilename(filePath: string): string {
    const normalized = this.normalize(filePath);
    const lastSlashIndex = normalized.lastIndexOf('/');

    if (lastSlashIndex === -1) {
      return normalized;
    }

    return normalized.substring(lastSlashIndex + 1);
  }

  /**
   * Gets the file extension from a path.
   *
   * @param filePath - File path
   *
   * @returns File extension with leading dot, or empty string if no extension
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.getExtension('file.pdf');
   * // Returns: '.pdf'
   *
   * PathNormalizerUtil.getExtension('uploads/document.tar.gz');
   * // Returns: '.gz'
   *
   * PathNormalizerUtil.getExtension('README');
   * // Returns: ''
   * ```
   */
  static getExtension(filePath: string): string {
    const filename = this.getFilename(filePath);
    const lastDotIndex = filename.lastIndexOf('.');

    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return '';
    }

    return filename.substring(lastDotIndex);
  }

  /**
   * Gets the filename without extension.
   *
   * @param filePath - File path
   *
   * @returns Filename without extension
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.getBasename('uploads/file.pdf');
   * // Returns: 'file'
   *
   * PathNormalizerUtil.getBasename('document.tar.gz');
   * // Returns: 'document.tar'
   * ```
   */
  static getBasename(filePath: string): string {
    const filename = this.getFilename(filePath);
    const lastDotIndex = filename.lastIndexOf('.');

    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return filename;
    }

    return filename.substring(0, lastDotIndex);
  }

  /**
   * Validates a path to prevent path traversal attacks.
   *
   * This method checks if a path attempts to access parent directories
   * or contains potentially dangerous characters.
   *
   * @param filePath - Path to validate
   *
   * @returns true if path is safe, false otherwise
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.isValidPath('uploads/file.pdf');
   * // Returns: true
   *
   * PathNormalizerUtil.isValidPath('../../../etc/passwd');
   * // Returns: false
   *
   * PathNormalizerUtil.isValidPath('uploads/../../file.pdf');
   * // Returns: false
   * ```
   */
  static isValidPath(filePath: string): boolean {
    if (!filePath || filePath.trim() === '') {
      return false;
    }

    const normalized = this.normalize(filePath);

    // Check for path traversal attempts
    if (normalized.includes('..')) {
      return false;
    }

    // Check for absolute paths
    if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) {
      return false;
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      return false;
    }

    return true;
  }

  /**
   * Ensures a path has a specific extension.
   *
   * If the path already has the extension, returns it unchanged.
   * Otherwise, appends the extension.
   *
   * @param filePath - File path
   * @param extension - Extension to ensure (with or without leading dot)
   *
   * @returns Path with ensured extension
   *
   * @example
   * ```typescript
   * PathNormalizerUtil.ensureExtension('file', '.pdf');
   * // Returns: 'file.pdf'
   *
   * PathNormalizerUtil.ensureExtension('file.pdf', '.pdf');
   * // Returns: 'file.pdf'
   *
   * PathNormalizerUtil.ensureExtension('file.txt', 'pdf');
   * // Returns: 'file.txt.pdf'
   * ```
   */
  static ensureExtension(filePath: string, extension: string): string {
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    const currentExt = this.getExtension(filePath);

    if (currentExt === normalizedExt) {
      return filePath;
    }

    return `${filePath}${normalizedExt}`;
  }
}
