/**
 * Test suite for DriverNotFoundException class.
 *
 * This test suite verifies the DriverNotFoundException class behavior,
 * including proper error message formatting with driver type and
 * available drivers list.
 *
 * Coverage:
 * - Constructor with driver type and available drivers
 * - Error message formatting with multiple drivers
 * - Error message formatting with single driver
 * - Error message formatting with empty drivers list
 * - Exception throwing and catching
 * - Information preservation in catch blocks
 * - Inheritance from StorageException
 *
 * @module __tests__/exceptions/driver-not-found.exception.spec
 */

import { DriverNotFoundException } from '@exceptions/driver-not-found.exception';
import { StorageException } from '@exceptions/storage.exception';

describe('DriverNotFoundException', () => {
  /**
   * Test group: Constructor behavior
   *
   * Verifies that the exception is properly initialized with driver
   * information and formats error messages correctly.
   */
  describe('constructor', () => {
    /**
     * Test: Full instantiation with driver type and available drivers
     *
     * Ensures that the exception can be created with a driver type and
     * a list of available drivers, and that the message includes all
     * relevant information.
     */
    it('should create exception with driver type and available drivers', () => {
      // Arrange
      const driverType = 'custom-driver';
      const availableDrivers = ['s3', 'minio'];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception).toBeInstanceOf(StorageException);
      expect(exception).toBeInstanceOf(DriverNotFoundException);
      expect(exception.message).toContain(driverType);
      expect(exception.message).toContain('s3');
      expect(exception.message).toContain('minio');
      expect(exception.name).toBe('DriverNotFoundException');
    });

    /**
     * Test: Message formatting with single available driver
     *
     * Verifies that the error message is properly formatted when
     * only one driver is available.
     */
    it('should format message correctly with single available driver', () => {
      // Arrange
      const driverType = 'unknown';
      const availableDrivers = ['s3'];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception.message).toContain('unknown');
      expect(exception.message).toContain('s3');
      expect(exception).toBeInstanceOf(DriverNotFoundException);
    });

    /**
     * Test: Message formatting with empty available drivers
     *
     * Ensures that the exception handles the case where no drivers
     * are available without crashing.
     */
    it('should format message correctly with empty available drivers', () => {
      // Arrange
      const driverType = 'test';
      const availableDrivers: string[] = [];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception.message).toContain('test');
      expect(exception).toBeInstanceOf(DriverNotFoundException);
    });

    /**
     * Test: Message formatting with many available drivers
     *
     * Verifies that the error message properly lists multiple
     * available drivers.
     */
    it('should format message correctly with many available drivers', () => {
      // Arrange
      const driverType = 'custom';
      const availableDrivers = ['s3', 'minio', 'gcs', 'azure'];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception.message).toContain('custom');
      expect(exception.message).toContain('s3');
      expect(exception.message).toContain('minio');
      expect(exception.message).toContain('gcs');
      expect(exception.message).toContain('azure');
    });
  });

  /**
   * Test group: Error handling behavior
   *
   * Verifies that the exception can be properly thrown and caught
   * with all information preserved.
   */
  describe('error handling', () => {
    /**
     * Test: Exception throwing and catching
     *
     * Ensures that the exception can be thrown and caught as
     * DriverNotFoundException type.
     */
    it('should be throwable and catchable', () => {
      // Arrange
      const driverType = 'invalid';
      const availableDrivers = ['s3', 'minio'];

      // Act & Assert
      expect(() => {
        throw DriverNotFoundException.make(driverType, availableDrivers);
      }).toThrow(DriverNotFoundException);
    });

    /**
     * Test: Information preservation in catch blocks
     *
     * Verifies that driver information is preserved when the
     * exception is caught and examined.
     */
    it('should preserve driver information when caught', () => {
      // Arrange
      const driverType = 'custom';
      const availableDrivers = ['s3'];

      // Act
      try {
        throw DriverNotFoundException.make(driverType, availableDrivers);
      } catch (error: Error | any) {
        // Assert
        expect(error).toBeInstanceOf(DriverNotFoundException);
        expect(error.message).toContain(driverType);
        expect(error.message).toContain('s3');
      }
    });

    /**
     * Test: Catchable as StorageException
     *
     * Ensures that the exception can be caught as the base
     * StorageException type for generic error handling.
     */
    it('should be catchable as StorageException', () => {
      // Arrange
      const driverType = 'test';
      const availableDrivers = ['s3'];

      // Act & Assert
      expect(() => {
        throw DriverNotFoundException.make(driverType, availableDrivers);
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
     * Test: Special characters in driver type
     *
     * Ensures that driver types with special characters are
     * handled correctly in the error message.
     */
    it('should handle special characters in driver type', () => {
      // Arrange
      const driverType = 'custom-driver_v2.0';
      const availableDrivers = ['s3'];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception.message).toContain(driverType);
    });

    /**
     * Test: Unicode characters in driver names
     *
     * Verifies that driver names with unicode characters are
     * properly included in the error message.
     */
    it('should handle unicode characters in driver names', () => {
      // Arrange
      const driverType = 'custom';
      const availableDrivers = ['s3', 'minío', '存储'];

      // Act
      const exception = DriverNotFoundException.make(driverType, availableDrivers);

      // Assert
      expect(exception.message).toContain('minío');
      expect(exception.message).toContain('存储');
    });
  });
});
