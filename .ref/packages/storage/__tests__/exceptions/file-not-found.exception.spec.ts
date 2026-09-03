/**
 * Test suite for FileNotFoundException class.
 *
 * This test suite verifies the FileNotFoundException class behavior,
 * including proper error message formatting with file path information.
 *
 * Coverage:
 * - Constructor with file path
 * - Error message formatting
 * - Special characters in paths
 * - Long file paths
 * - Exception throwing and catching
 * - Inheritance from StorageException
 *
 * @module __tests__/exceptions/file-not-found.exception.spec
 */

import { FileNotFoundException } from '@exceptions/file-not-found.exception';
import { StorageException } from '@exceptions/storage.exception';

describe('FileNotFoundException', () => {
  /**
   * Test group: Constructor behavior
   *
   * Verifies that the exception is properly initialized with file
   * path information and formats error messages correctly.
   */
  describe('constructor', () => {
    /**
     * Test: Basic instantiation with file path
     *
     * Ensures that the exception can be created with a file path
     * and that the message includes the path information.
     */
    it('should create exception with file path', () => {
      // Arrange
      const path = 'uploads/document.pdf';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(FileNotFoundException);
      expect(exception.message).toContain(path);
      expect(exception.name).toBe('FileNotFoundException');
    });

    /**
     * Test: Path with special characters
     *
     * Verifies that file paths containing special characters
     * are properly included in the error message.
     */
    it('should handle paths with special characters', () => {
      // Arrange
      const path = 'uploads/file with spaces & special.pdf';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception.message).toContain(path);
      expect(exception).toBeInstanceOf(FileNotFoundException);
    });

    /**
     * Test: Long file path
     *
     * Ensures that long file paths are handled correctly
     * without truncation or errors.
     */
    it('should handle long file paths', () => {
      // Arrange
      const path = 'very/long/path/with/many/nested/directories/and/a/very/long/filename.pdf';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception.message).toContain(path);
    });

    /**
     * Test: Root level file
     *
     * Verifies that files at the root level (no directory)
     * are handled correctly.
     */
    it('should handle root level files', () => {
      // Arrange
      const path = 'file.txt';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception.message).toContain(path);
    });
  });

  /**
   * Test group: Error handling behavior
   *
   * Verifies that the exception can be properly thrown and caught.
   */
  describe('error handling', () => {
    /**
     * Test: Exception throwing and catching
     *
     * Ensures that the exception can be thrown and caught as
     * FileNotFoundException type.
     */
    it('should be throwable and catchable', () => {
      // Arrange
      const path = 'missing-file.txt';

      // Act & Assert
      expect(() => {
        throw FileNotFoundException.make(path);
      }).toThrow(FileNotFoundException);
    });

    /**
     * Test: Path preservation in catch blocks
     *
     * Verifies that the file path is preserved when the
     * exception is caught and examined.
     */
    it('should preserve path when caught', () => {
      // Arrange
      const path = 'uploads/missing.pdf';

      // Act
      try {
        throw FileNotFoundException.make(path);
      } catch (error: Error | any) {
        // Assert
        expect(error).toBeInstanceOf(FileNotFoundException);
        expect(error.message).toContain(path);
      }
    });

    /**
     * Test: Catchable as StorageException
     *
     * Ensures that the exception can be caught as the base
     * StorageException type.
     */
    it('should be catchable as StorageException', () => {
      // Arrange
      const path = 'test.txt';

      // Act & Assert
      expect(() => {
        throw FileNotFoundException.make(path);
      }).toThrow(StorageException);
    });
  });

  /**
   * Test group: Edge cases
   *
   * Verifies that the exception handles edge cases properly.
   */
  describe('edge cases', () => {
    /**
     * Test: Empty path
     *
     * Ensures that an empty path string is handled without errors.
     */
    it('should handle empty path', () => {
      // Arrange
      const path = '';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception).toBeInstanceOf(FileNotFoundException);
      expect(exception.message).toBeDefined();
    });

    /**
     * Test: Path with unicode characters
     *
     * Verifies that paths with unicode characters are properly
     * included in the error message.
     */
    it('should handle unicode characters in path', () => {
      // Arrange
      const path = 'uploads/文档.pdf';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception.message).toContain(path);
    });

    /**
     * Test: Path with backslashes (Windows style)
     *
     * Ensures that Windows-style paths with backslashes are
     * handled correctly.
     */
    it('should handle backslashes in path', () => {
      // Arrange
      const path = 'uploads\\documents\\file.pdf';

      // Act
      const exception = FileNotFoundException.make(path);

      // Assert
      expect(exception.message).toContain(path);
    });
  });
});
