/**
 * Test suite for StorageException class.
 *
 * This test suite verifies the behavior of the base StorageException class,
 * including proper error message formatting, stack trace handling, and
 * inheritance from the standard Error class.
 *
 * Coverage:
 * - Constructor with message parameter
 * - Error name and message preservation
 * - Stack trace capture
 * - Prototype chain maintenance
 * - JSON serialization
 * - String conversion
 * - Error handling in try-catch blocks
 * - Inheritance verification
 *
 * @module __tests__/exceptions/storage.exception.spec
 */

import { StorageException } from '@exceptions/storage.exception';

describe('StorageException', () => {
  /**
   * Test group: Constructor behavior
   *
   * Verifies that the exception is properly initialized with the correct
   * message, name, and maintains proper prototype chain.
   */
  describe('constructor', () => {
    /**
     * Test: Basic instantiation with message
     *
     * Ensures that the exception can be created with an error message
     * and that it properly extends both Error and StorageException.
     */
    it('should create an exception with a message', () => {
      // Arrange
      const message = 'Test storage error';

      // Act
      const exception = StorageException.make('TEST_ERROR', message);

      // Assert
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(StorageException);
      expect(exception.message).toBe(message);
      expect(exception.name).toBe('StorageException');
    });

    /**
     * Test: Custom exception name inheritance
     *
     * Verifies that derived exception classes can override the name
     * property while maintaining the base functionality.
     */
    it('should create an exception with a custom name', () => {
      // Arrange
      const message = 'Custom error';

      // Act
      class CustomStorageException extends StorageException {
        constructor(message: string) {
          super('CUSTOM_ERROR', message);
          this.name = 'CustomStorageException';
        }
      }
      const exception = CustomStorageException.make(message);

      // Assert
      expect(exception.name).toBe('CustomStorageException');
      expect(exception.message).toBe(message);
      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(Error);
    });

    /**
     * Test: Prototype chain integrity
     *
     * Ensures that the exception maintains proper prototype chain,
     * which is crucial for instanceof checks and inheritance.
     */
    it('should maintain proper prototype chain', () => {
      // Arrange & Act
      const exception = StorageException.make('TEST_CODE', 'Test');

      // Assert
      expect(Object.getPrototypeOf(exception)).toBe(StorageException.prototype);
      expect(exception instanceof StorageException).toBe(true);
      expect(exception instanceof Error).toBe(true);
    });

    /**
     * Test: Stack trace capture
     *
     * Verifies that the exception captures a stack trace when created,
     * which is essential for debugging and error tracking.
     */
    it('should capture stack trace', () => {
      // Arrange & Act
      const exception = StorageException.make('TEST_ERROR', 'Test error');

      // Assert
      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('StorageException');
      expect(exception.stack).toContain('Test error');
    });
  });

  /**
   * Test group: Serialization behavior
   *
   * Verifies that exceptions can be properly serialized to JSON
   * and converted to strings for logging and transmission purposes.
   */
  describe('serialization', () => {
    /**
     * Test: JSON serialization
     *
     * Ensures that the exception can be serialized to JSON and
     * deserialized while preserving essential properties.
     */
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = 'Serialization test';
      const exception = StorageException.make('SERIALIZE_TEST', message);

      // Act
      const json = JSON.stringify(exception);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.message).toBe(message);
      expect(parsed.name).toBe('StorageException');
    });

    /**
     * Test: String conversion
     *
     * Verifies that the exception can be converted to a string
     * representation for logging purposes.
     */
    it('should convert to string correctly', () => {
      // Arrange
      const message = 'String conversion test';
      const exception = StorageException.make('STRING_TEST', message);

      // Act
      const str = exception.toString();

      // Assert
      expect(str).toContain('StorageException');
      expect(str).toContain(message);
    });
  });

  /**
   * Test group: Error handling behavior
   *
   * Verifies that exceptions can be properly caught and handled
   * in try-catch blocks with correct type checking.
   */
  describe('error handling', () => {
    /**
     * Test: Catchable as Error
     *
     * Ensures that the exception can be caught as a generic Error,
     * maintaining compatibility with standard error handling.
     */
    it('should be catchable as Error', () => {
      // Arrange
      const message = 'Catchable error';

      // Act & Assert
      expect(() => {
        throw StorageException.make('CATCH_ERROR', message);
      }).toThrow(Error);
    });

    /**
     * Test: Catchable as specific type
     *
     * Verifies that the exception can be caught specifically as
     * StorageException for type-specific error handling.
     */
    it('should be catchable as StorageException', () => {
      // Arrange
      const message = 'Specific catch';

      // Act & Assert
      expect(() => {
        throw StorageException.make('SPECIFIC_ERROR', message);
      }).toThrow(StorageException);
    });

    /**
     * Test: Message preservation in catch blocks
     *
     * Ensures that the error message is preserved when the exception
     * is caught and re-examined in a catch block.
     */
    it('should preserve message when caught', () => {
      // Arrange
      const message = 'Preserved message';

      // Act
      try {
        throw StorageException.make('PRESERVE_ERROR', message);
      } catch (error: Error | any) {
        // Assert
        expect(error).toBeInstanceOf(StorageException);
        expect(error.message).toBe(message);
      }
    });

    /**
     * Test: Multiple exception instances
     *
     * Verifies that multiple exception instances can be created
     * independently without interfering with each other.
     */
    it('should create independent exception instances', () => {
      // Arrange & Act
      const exception1 = StorageException.make('ERROR_1', 'Error 1');
      const exception2 = StorageException.make('ERROR_2', 'Error 2');

      // Assert
      expect(exception1.message).toBe('Error 1');
      expect(exception2.message).toBe('Error 2');
      expect(exception1).not.toBe(exception2);
    });
  });
});
