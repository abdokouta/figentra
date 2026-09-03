/**
 * Test suite for UploadFailedException class.
 *
 * This test suite verifies the UploadFailedException class behavior,
 * including proper error message formatting with path and original error.
 *
 * Coverage:
 * - Constructor with path and error
 * - Error message formatting
 * - Original error preservation
 * - Exception throwing and catching
 * - Inheritance from StorageException
 *
 * @module __tests__/exceptions/upload-failed.exception.spec
 */

import { UploadFailedException } from '@exceptions/upload-failed.exception';
import { StorageException } from '@exceptions/storage.exception';

describe('UploadFailedException', () => {
  /**
   * Test group: Constructor behavior
   *
   * Verifies that the exception is properly initialized with path
   * and original error information.
   */
  describe('constructor', () => {
    /**
     * Test: Full instantiation with path and error
     *
     * Ensures that the exception can be created with a file path
     * and original error, and that both are included in the message.
     */
    it('should create exception with path and error', () => {
      // Arrange
      const path = 'uploads/file.pdf';
      const originalError = new Error('Network error');

      // Act
      const exception = UploadFailedException.make(path, originalError);

      // Assert
      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(UploadFailedException);
      expect(exception.message).toContain(path);
      expect(exception.message).toContain('Network error');
      expect(exception.name).toBe('UploadFailedException');
    });

    /**
     * Test: Error without message
     *
     * Verifies that errors without messages are handled gracefully.
     */
    it('should handle error without message', () => {
      // Arrange
      const path = 'test.txt';
      const originalError = new Error();

      // Act
      const exception = UploadFailedException.make(path, originalError);

      // Assert
      expect(exception.message).toContain(path);
      expect(exception).toBeInstanceOf(UploadFailedException);
    });

    /**
     * Test: Complex error object
     *
     * Ensures that complex error objects with additional properties
     * are handled correctly.
     */
    it('should handle complex error objects', () => {
      // Arrange
      const path = 'uploads/document.pdf';
      const originalError = new Error('Upload failed');
      (originalError as any).code = 'ECONNREFUSED';
      (originalError as any).statusCode = 500;

      // Act
      const exception = UploadFailedException.make(path, originalError);

      // Assert
      expect(exception.message).toContain(path);
      expect(exception.message).toContain('Upload failed');
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
     * UploadFailedException type.
     */
    it('should be throwable and catchable', () => {
      // Arrange
      const path = 'file.txt';
      const error = new Error('Test error');

      // Act & Assert
      expect(() => {
        throw UploadFailedException.make(path, error);
      }).toThrow(UploadFailedException);
    });

    /**
     * Test: Information preservation in catch blocks
     *
     * Verifies that path and error information are preserved
     * when the exception is caught.
     */
    it('should preserve information when caught', () => {
      // Arrange
      const path = 'uploads/test.pdf';
      const error = new Error('Connection timeout');

      // Act
      try {
        throw UploadFailedException.make(path, error);
      } catch (caught) {
        // Assert
        expect(caught).toBeInstanceOf(UploadFailedException);
        expect(caught.message).toContain(path);
        expect(caught.message).toContain('Connection timeout');
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
      const error = new Error('Test');

      // Act & Assert
      expect(() => {
        throw UploadFailedException.make(path, error);
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
     * Test: Non-Error object as original error
     *
     * Ensures that non-Error objects can be passed as the
     * original error without crashing.
     */
    it('should handle non-Error objects', () => {
      // Arrange
      const path = 'file.txt';
      const originalError = { message: 'Custom error' } as any;

      // Act
      const exception = UploadFailedException.make(path, originalError);

      // Assert
      expect(exception).toBeInstanceOf(UploadFailedException);
      expect(exception.message).toContain(path);
    });

    /**
     * Test: Very long error message
     *
     * Verifies that very long error messages are handled correctly.
     */
    it('should handle very long error messages', () => {
      // Arrange
      const path = 'file.txt';
      const longMessage = 'Error: '.repeat(100);
      const originalError = new Error(longMessage);

      // Act
      const exception = UploadFailedException.make(path, originalError);

      // Assert
      expect(exception).toBeInstanceOf(UploadFailedException);
      expect(exception.message).toContain(path);
    });
  });
});
