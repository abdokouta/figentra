/**
 * Test suite for MimeTypeUtil class.
 *
 * This test suite verifies the MIME type detection and validation functionality,
 * including file extension to MIME type mapping and wildcard pattern matching.
 *
 * Coverage:
 * - getMimeType() for various file extensions
 * - isAllowed() with exact matches
 * - isAllowed() with wildcard patterns
 * - Edge cases and special characters
 * - Case sensitivity handling
 *
 * @module __tests__/utils/mime-type.util.spec
 */

import { MimeTypeUtil } from '@utils/mime-type.util';

describe('MimeTypeUtil', () => {
  /**
   * Test group: getMimeType() method
   *
   * Verifies that the utility correctly maps file extensions to
   * their corresponding MIME types.
   */
  describe('getMimeType()', () => {
    /**
     * Test: Common image formats
     *
     * Ensures that common image file extensions return the correct
     * MIME types.
     */
    it('should return correct MIME type for image files', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('photo.jpg')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('photo.jpeg')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('image.png')).toBe('image/png');
      expect(MimeTypeUtil.getMimeType('icon.gif')).toBe('image/gif');
      expect(MimeTypeUtil.getMimeType('vector.svg')).toBe('image/svg+xml');
      expect(MimeTypeUtil.getMimeType('photo.webp')).toBe('image/webp');
    });

    /**
     * Test: Document formats
     *
     * Verifies that document file extensions return the correct
     * MIME types.
     */
    it('should return correct MIME type for document files', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('document.pdf')).toBe('application/pdf');
      expect(MimeTypeUtil.getMimeType('document.doc')).toBe('application/msword');
      expect(MimeTypeUtil.getMimeType('document.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(MimeTypeUtil.getMimeType('spreadsheet.xlsx')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    /**
     * Test: Video and audio formats
     *
     * Ensures that media file extensions return the correct MIME types.
     */
    it('should return correct MIME type for media files', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('video.mp4')).toBe('application/mp4');
      expect(MimeTypeUtil.getMimeType('video.webm')).toBe('video/webm');
      expect(MimeTypeUtil.getMimeType('audio.mp3')).toBe('audio/mpeg');
      expect(MimeTypeUtil.getMimeType('audio.wav')).toBe('audio/wav');
    });

    /**
     * Test: Text and code formats
     *
     * Verifies that text and code file extensions return the correct
     * MIME types.
     */
    it('should return correct MIME type for text files', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('file.txt')).toBe('text/plain');
      expect(MimeTypeUtil.getMimeType('page.html')).toBe('text/html');
      expect(MimeTypeUtil.getMimeType('style.css')).toBe('text/css');
      expect(MimeTypeUtil.getMimeType('script.js')).toBe('text/javascript');
      expect(MimeTypeUtil.getMimeType('data.json')).toBe('application/json');
      expect(MimeTypeUtil.getMimeType('data.xml')).toBe('application/xml');
    });

    /**
     * Test: Archive formats
     *
     * Ensures that archive file extensions return the correct MIME types.
     */
    it('should return correct MIME type for archive files', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('archive.zip')).toBe('application/zip');
      expect(MimeTypeUtil.getMimeType('archive.tar')).toBe('application/x-tar');
      expect(MimeTypeUtil.getMimeType('archive.gz')).toBe('application/gzip');
      expect(MimeTypeUtil.getMimeType('archive.7z')).toBe('application/x-7z-compressed');
    });

    /**
     * Test: Unknown file extensions
     *
     * Verifies that unknown extensions return the default MIME type.
     */
    it('should return default MIME type for unknown extensions', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('file.unknown');

      // Assert
      expect(result).toBe('application/octet-stream');
    });

    /**
     * Test: Files without extensions
     *
     * Ensures that files without extensions return the default MIME type.
     */
    it('should return default MIME type for files without extension', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('README');

      // Assert
      expect(result).toBe('application/octet-stream');
    });

    /**
     * Test: Case insensitivity
     *
     * Verifies that file extensions are handled case-insensitively.
     */
    it('should handle case-insensitive extensions', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('FILE.PDF')).toBe('application/pdf');
      expect(MimeTypeUtil.getMimeType('FILE.Pdf')).toBe('application/pdf');
      expect(MimeTypeUtil.getMimeType('image.PNG')).toBe('image/png');
      expect(MimeTypeUtil.getMimeType('Image.JpG')).toBe('image/jpeg');
    });

    /**
     * Test: Full paths with directories
     *
     * Ensures that full file paths are handled correctly.
     */
    it('should handle full paths with directories', () => {
      // Arrange & Act & Assert
      expect(MimeTypeUtil.getMimeType('uploads/documents/file.pdf')).toBe('application/pdf');
      expect(MimeTypeUtil.getMimeType('/var/www/images/photo.jpg')).toBe('image/jpeg');
      expect(MimeTypeUtil.getMimeType('C:\\Users\\Documents\\file.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });
  });

  /**
   * Test group: isAllowed() method
   *
   * Verifies that the utility correctly validates MIME types against
   * allowed patterns, including wildcard support.
   */
  describe('isAllowed()', () => {
    /**
     * Test: Exact MIME type matching
     *
     * Ensures that exact MIME type matches are correctly identified.
     */
    it('should allow exact MIME type matches', () => {
      // Arrange
      const mimeType = 'image/jpeg';
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

      // Act
      const result = MimeTypeUtil.isAllowed(mimeType, allowedTypes);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test: Disallow non-matching MIME types
     *
     * Verifies that MIME types not in the allowed list are rejected.
     */
    it('should disallow non-matching MIME types', () => {
      // Arrange
      const mimeType = 'video/mp4';
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

      // Act
      const result = MimeTypeUtil.isAllowed(mimeType, allowedTypes);

      // Assert
      expect(result).toBe(false);
    });

    /**
     * Test: Wildcard pattern matching
     *
     * Ensures that wildcard patterns (e.g., image/*) work correctly.
     */
    it('should allow wildcard patterns', () => {
      // Arrange
      const allowedTypes = ['image/*', 'application/pdf'];

      // Act & Assert
      expect(MimeTypeUtil.isAllowed('image/jpeg', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('image/png', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('image/gif', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('video/mp4', allowedTypes)).toBe(false);
    });

    /**
     * Test: Multiple wildcard patterns
     *
     * Verifies that multiple wildcard patterns can be used together.
     */
    it('should handle multiple wildcard patterns', () => {
      // Arrange
      const allowedTypes = ['image/*', 'video/*', 'audio/*'];

      // Act & Assert
      expect(MimeTypeUtil.isAllowed('image/jpeg', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('video/mp4', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('audio/mpeg', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('application/pdf', allowedTypes)).toBe(false);
    });

    /**
     * Test: Mixed exact and wildcard patterns
     *
     * Ensures that exact matches and wildcards can be combined.
     */
    it('should handle mixed exact and wildcard patterns', () => {
      // Arrange
      const allowedTypes = ['image/*', 'application/pdf', 'text/plain'];

      // Act & Assert
      expect(MimeTypeUtil.isAllowed('image/jpeg', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('application/pdf', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('text/plain', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('video/mp4', allowedTypes)).toBe(false);
    });

    /**
     * Test: Empty allowed types list
     *
     * Verifies that an empty allowed list rejects all MIME types.
     */
    it('should reject all types when allowed list is empty', () => {
      // Arrange
      const mimeType = 'image/jpeg';
      const allowedTypes: string[] = [];

      // Act
      const result = MimeTypeUtil.isAllowed(mimeType, allowedTypes);

      // Assert
      expect(result).toBe(false);
    });

    /**
     * Test: Universal wildcard
     *
     * Ensures that a universal wildcard (*\/*) allows all MIME types.
     */
    it('should allow all types with universal wildcard', () => {
      // Arrange
      const allowedTypes = ['*/*'];

      // Act & Assert
      expect(MimeTypeUtil.isAllowed('image/jpeg', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('video/mp4', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('application/pdf', allowedTypes)).toBe(true);
      expect(MimeTypeUtil.isAllowed('text/plain', allowedTypes)).toBe(true);
    });
  });

  /**
   * Test group: Edge cases
   *
   * Verifies that the utility handles edge cases correctly.
   */
  describe('edge cases', () => {
    /**
     * Test: Multiple dots in filename
     *
     * Ensures that files with multiple dots use the last extension.
     */
    it('should handle multiple dots in filename', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('archive.tar.gz');

      // Assert
      expect(result).toBe('application/gzip');
    });

    /**
     * Test: Hidden files (starting with dot)
     *
     * Verifies that hidden files are handled correctly.
     */
    it('should handle hidden files', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('.gitignore');

      // Assert
      expect(result).toBe('application/octet-stream');
    });

    /**
     * Test: Empty string
     *
     * Ensures that empty strings return the default MIME type.
     */
    it('should handle empty string', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('');

      // Assert
      expect(result).toBe('application/octet-stream');
    });

    /**
     * Test: Special characters in filename
     *
     * Verifies that filenames with special characters are handled.
     */
    it('should handle special characters in filename', () => {
      // Arrange & Act
      const result = MimeTypeUtil.getMimeType('file (1) [copy].pdf');

      // Assert
      expect(result).toBe('application/pdf');
    });
  });
});
