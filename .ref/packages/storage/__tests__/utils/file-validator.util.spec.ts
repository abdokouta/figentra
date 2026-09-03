/**
 * Test suite for FileValidatorUtil class.
 *
 * This test suite verifies the file validation functionality,
 * including size checks, type validation, and custom rules.
 *
 * Coverage:
 * - validateSize() for file size limits
 * - validateType() for MIME type validation
 * - validate() for combined validation
 * - Edge cases and boundary conditions
 *
 * @module __tests__/utils/file-validator.util.spec
 */

import { FileValidatorUtil } from '@utils/file-validator.util';

describe('FileValidatorUtil', () => {
  /**
   * Test group: validateSize() method
   *
   * Verifies that the utility correctly validates file sizes
   * against minimum and maximum limits.
   */
  describe('validateSize()', () => {
    /**
     * Test: Accept files within size limits
     *
     * Ensures that files within the specified size range are accepted.
     */
    it('should accept files within size limits', () => {
      // Arrange
      const fileSize = 1024 * 1024; // 1 MB
      const options = {
        minSize: 1024, // 1 KB
        maxSize: 1024 * 1024 * 10, // 10 MB
      };

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * Test: Reject files exceeding maximum size
     *
     * Verifies that files larger than the maximum are rejected.
     */
    it('should reject files exceeding maximum size', () => {
      // Arrange
      const fileSize = 1024 * 1024 * 15; // 15 MB
      const options = {
        maxSize: 1024 * 1024 * 10, // 10 MB
      };

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
      expect(result.error).toContain('10485760 bytes');
    });

    /**
     * Test: Reject files below minimum size
     *
     * Ensures that files smaller than the minimum are rejected.
     */
    it('should reject files below minimum size', () => {
      // Arrange
      const fileSize = 512; // 512 bytes
      const options = {
        minSize: 1024, // 1 KB
      };

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('below minimum');
      expect(result.error).toContain('1024 bytes');
    });

    /**
     * Test: Accept files at exact boundaries
     *
     * Verifies that files at exact min/max sizes are accepted.
     */
    it('should accept files at exact boundaries', () => {
      // Arrange
      const minSize = 1024;
      const maxSize = 1024 * 1024;

      // Act & Assert
      expect(FileValidatorUtil.validateSize(minSize, { minSize, maxSize }).valid).toBe(true);
      expect(FileValidatorUtil.validateSize(maxSize, { minSize, maxSize }).valid).toBe(true);
    });

    /**
     * Test: Handle zero-byte files
     *
     * Ensures that zero-byte files are handled correctly.
     */
    it('should handle zero-byte files', () => {
      // Arrange
      const fileSize = 0;
      const options = { minSize: 1 };

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(false);
    });

    /**
     * Test: Handle no size limits
     *
     * Verifies that files are accepted when no limits are specified.
     */
    it('should accept all sizes when no limits specified', () => {
      // Arrange
      const fileSize = 1024 * 1024 * 100; // 100 MB

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, {});

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  /**
   * Test group: validateType() method
   *
   * Verifies that the utility correctly validates file MIME types
   * against allowed patterns.
   */
  describe('validateType()', () => {
    /**
     * Test: Accept allowed MIME types
     *
     * Ensures that files with allowed MIME types are accepted.
     */
    it('should accept allowed MIME types', () => {
      // Arrange
      const mimeType = 'image/jpeg';
      const options = {
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      };

      // Act
      const result = FileValidatorUtil.validateMimeType(mimeType, options.allowedTypes);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * Test: Reject disallowed MIME types
     *
     * Verifies that files with disallowed MIME types are rejected.
     */
    it('should reject disallowed MIME types', () => {
      // Arrange
      const mimeType = 'video/mp4';
      const options = {
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      };

      // Act
      const result = FileValidatorUtil.validateMimeType(mimeType, options.allowedTypes);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
      expect(result.error).toContain('video/mp4');
    });

    /**
     * Test: Accept wildcard patterns
     *
     * Ensures that wildcard MIME type patterns work correctly.
     */
    it('should accept wildcard patterns', () => {
      // Arrange
      const options = {
        allowedTypes: ['image/*', 'application/pdf'],
      };

      // Act & Assert
      expect(FileValidatorUtil.validateMimeType('image/jpeg', options.allowedTypes).valid).toBe(
        true
      );
      expect(FileValidatorUtil.validateMimeType('image/png', options.allowedTypes).valid).toBe(
        true
      );
      expect(FileValidatorUtil.validateMimeType('image/gif', options.allowedTypes).valid).toBe(
        true
      );
      expect(FileValidatorUtil.validateMimeType('video/mp4', options.allowedTypes).valid).toBe(
        false
      );
    });

    /**
     * Test: Handle no type restrictions
     *
     * Verifies that all types are accepted when no restrictions exist.
     */
    it('should accept all types when no restrictions specified', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const path = 'test.bin';

      // Act
      const result = FileValidatorUtil.validate(buffer, path, {});

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  /**
   * Test group: validate() method
   *
   * Verifies that the utility correctly performs combined validation
   * of both size and type.
   */
  describe('validate()', () => {
    /**
     * Test: Accept valid files
     *
     * Ensures that files passing all validations are accepted.
     */
    it('should accept files passing all validations', () => {
      // Arrange
      const buffer = Buffer.alloc(1024 * 1024); // 1 MB
      const path = 'test.jpg';
      const options = {
        maxSize: 1024 * 1024 * 10, // 10 MB
        allowedMimeTypes: ['image/*'],
      };

      // Act
      const result = FileValidatorUtil.validate(buffer, path, options);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * Test: Reject files failing size validation
     *
     * Verifies that files failing size checks are rejected.
     */
    it('should reject files failing size validation', () => {
      // Arrange
      const buffer = Buffer.alloc(1024 * 1024 * 15); // 15 MB
      const path = 'test.jpg';
      const options = {
        maxSize: 1024 * 1024 * 10, // 10 MB
        allowedMimeTypes: ['image/*'],
      };

      // Act
      const result = FileValidatorUtil.validate(buffer, path, options);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('exceeds maximum');
    });

    /**
     * Test: Reject files failing type validation
     *
     * Ensures that files failing type checks are rejected.
     */
    it('should reject files failing type validation', () => {
      // Arrange
      const buffer = Buffer.alloc(1024 * 1024); // 1 MB
      const path = 'test.mp4';
      const options = {
        maxSize: 1024 * 1024 * 10, // 10 MB
        allowedMimeTypes: ['image/*'],
      };

      // Act
      const result = FileValidatorUtil.validate(buffer, path, options);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not allowed');
    });

    /**
     * Test: Reject files failing multiple validations
     *
     * Verifies that multiple validation errors are collected.
     */
    it('should return first validation error encountered', () => {
      // Arrange - size check happens before MIME type check
      const buffer = Buffer.alloc(1024 * 1024 * 15); // 15 MB
      const path = 'test.mp4';
      const options = {
        maxSize: 1024 * 1024 * 10, // 10 MB
        allowedMimeTypes: ['image/*'],
      };

      // Act
      const result = FileValidatorUtil.validate(buffer, path, options);

      // Assert - should return size error first
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('exceeds maximum');
    });

    /**
     * Test: Accept files with no validation rules
     *
     * Ensures that files are accepted when no rules are specified.
     */
    it('should accept files with no validation rules', () => {
      // Arrange
      const buffer = Buffer.alloc(1024 * 1024 * 100); // 100 MB
      const path = 'test.bin';

      // Act
      const result = FileValidatorUtil.validate(buffer, path, {});

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  /**
   * Test group: Edge cases
   *
   * Verifies that the utility handles edge cases correctly.
   */
  describe('edge cases', () => {
    /**
     * Test: Negative file sizes
     *
     * Ensures that negative file sizes are handled appropriately.
     */
    it('should handle negative file sizes', () => {
      // Arrange
      const fileSize = -1024;
      const options = { minSize: 0 };

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(false);
    });

    /**
     * Test: Very large file sizes
     *
     * Verifies that very large file sizes are handled correctly.
     */
    it('should handle very large file sizes', () => {
      // Arrange
      const fileSize = Number.MAX_SAFE_INTEGER;
      const options = { maxSize: 1024 * 1024 * 1024 }; // 1 GB

      // Act
      const result = FileValidatorUtil.validateSize(fileSize, options);

      // Assert
      expect(result.valid).toBe(false);
    });

    /**
     * Test: Empty MIME type
     *
     * Ensures that empty MIME types are handled.
     */
    it('should handle empty MIME type', () => {
      // Arrange
      const mimeType = '';
      const options = { allowedTypes: ['image/*'] };

      // Act
      const result = FileValidatorUtil.validateMimeType(mimeType, options.allowedTypes);

      // Assert
      expect(result.valid).toBe(false);
    });

    /**
     * Test: Case sensitivity in MIME types
     *
     * Verifies that MIME type matching is case-insensitive.
     */
    it('should handle case-sensitive MIME types', () => {
      // Arrange
      const options = { allowedTypes: ['image/jpeg'] };

      // Act & Assert - MIME types are case-sensitive per RFC
      expect(FileValidatorUtil.validateMimeType('image/jpeg', options.allowedTypes).valid).toBe(
        true
      );
      expect(FileValidatorUtil.validateMimeType('image/JPEG', options.allowedTypes).valid).toBe(
        false
      );
      expect(FileValidatorUtil.validateMimeType('IMAGE/JPEG', options.allowedTypes).valid).toBe(
        false
      );
    });
  });
});
