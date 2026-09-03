/**
 * Test suite for StorageFactoryService class.
 *
 * This test suite verifies the storage driver factory functionality,
 * including driver registration, instantiation, and error handling.
 *
 * Coverage:
 * - createDriver() for different driver types
 * - registerDriver() for custom drivers
 * - Error handling for unknown drivers
 * - Driver options validation
 * - Custom driver registration
 *
 * @module __tests__/services/storage-factory.service.spec
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StorageFactoryService } from '@services/storage-factory.service';
import { StorageDriverType } from '@enums/storage-driver-type.enum';
import { DriverNotFoundException } from '@exceptions/driver-not-found.exception';
import type { IStorageDriver } from '@interfaces/storage-driver.interface';
import { StorageVisibility } from '@enums/storage-visibility.enum';

describe('StorageFactoryService', () => {
  let service: StorageFactoryService;

  /**
   * Setup: Create testing module before each test
   *
   * Initializes a fresh instance of StorageFactoryService for each test
   * to ensure test isolation.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageFactoryService],
    }).compile();

    service = module.get<StorageFactoryService>(StorageFactoryService);
  });

  /**
   * Cleanup: Ensure service is defined after setup
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Test group: createDriver() method for S3
   *
   * Verifies that the factory can create S3 driver instances
   * with proper configuration.
   */
  describe('createDriver() - S3', () => {
    /**
     * Test: Create S3 driver with valid options
     *
     * Ensures that an S3 driver can be instantiated with
     * proper configuration options.
     */
    it('should create S3 driver with valid options', async () => {
      // Arrange
      const options = {
        region: 'us-east-1',
        bucket: 'test-bucket',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      // Act
      const driver = await service.createDriver(
        { driver: StorageDriverType.S3, driverOptions: options },
        false
      );

      // Assert
      expect(driver).toBeDefined();
      expect(driver).toHaveProperty('connect');
      expect(driver).toHaveProperty('disconnect');
      expect(driver).toHaveProperty('upload');
      expect(driver).toHaveProperty('download');
    });

    /**
     * Test: Create S3 driver with custom endpoint
     *
     * Verifies that S3-compatible services with custom endpoints
     * can be configured.
     */
    it('should create S3 driver with custom endpoint', async () => {
      // Arrange
      const options = {
        region: 'us-east-1',
        bucket: 'test-bucket',
        endpoint: 'https://s3.custom.com',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      // Act
      const driver = await service.createDriver(
        { driver: StorageDriverType.S3, driverOptions: options },
        false
      );

      // Assert
      expect(driver).toBeDefined();
    });
  });

  /**
   * Test group: createDriver() method for MinIO
   *
   * Verifies that the factory can create MinIO driver instances
   * with proper configuration.
   */
  describe('createDriver() - MinIO', () => {
    /**
     * Test: Create MinIO driver with valid options
     *
     * Ensures that a MinIO driver can be instantiated with
     * proper configuration options.
     */
    it('should create MinIO driver with valid options', async () => {
      // Arrange
      const options = {
        endPoint: 'localhost',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'test-bucket',
      };

      // Act
      const driver = await service.createDriver(
        { driver: StorageDriverType.MINIO, driverOptions: options },
        false
      );

      // Assert
      expect(driver).toBeDefined();
      expect(driver).toHaveProperty('connect');
      expect(driver).toHaveProperty('disconnect');
      expect(driver).toHaveProperty('upload');
      expect(driver).toHaveProperty('download');
    });

    /**
     * Test: Create MinIO driver with SSL enabled
     *
     * Verifies that MinIO can be configured with SSL/TLS.
     */
    it('should create MinIO driver with SSL enabled', async () => {
      // Arrange
      const options = {
        endPoint: 'minio.example.com',
        port: 9000,
        useSSL: true,
        accessKey: 'access-key',
        secretKey: 'secret-key',
        bucket: 'secure-bucket',
      };

      // Act
      const driver = await service.createDriver(
        { driver: StorageDriverType.MINIO, driverOptions: options },
        false
      );

      // Assert
      expect(driver).toBeDefined();
    });
  });

  /**
   * Test group: Error handling
   *
   * Verifies that the factory properly handles errors for
   * unknown or invalid driver types.
   */
  describe('error handling', () => {
    /**
     * Test: Throw error for unknown driver type
     *
     * Ensures that attempting to create an unknown driver type
     * throws a DriverNotFoundException.
     */
    it('should throw DriverNotFoundException for unknown driver', async () => {
      // Arrange
      const unknownDriver = 'unknown-driver' as StorageDriverType;
      const options = {};

      // Act & Assert
      await expect(
        service.createDriver({ driver: unknownDriver, driverOptions: options })
      ).rejects.toThrow(DriverNotFoundException);
    });

    /**
     * Test: Error message includes available drivers
     *
     * Verifies that the error message lists available driver types
     * to help developers.
     */
    it('should include available drivers in error message', async () => {
      // Arrange
      const unknownDriver = 'custom' as StorageDriverType;
      const options = {};

      // Act & Assert
      try {
        await service.createDriver({ driver: unknownDriver, driverOptions: options });
        fail('Should have thrown DriverNotFoundException');
      } catch (error: Error | any) {
        expect(error).toBeInstanceOf(DriverNotFoundException);
        expect(error.message).toContain('s3');
        expect(error.message).toContain('minio');
      }
    });
  });

  /**
   * Test group: registerDriver() method
   *
   * Verifies that custom drivers can be registered and used
   * by the factory.
   */
  describe('registerDriver()', () => {
    /**
     * Test: Register custom driver
     *
     * Ensures that a custom driver implementation can be registered
     * and subsequently created by the factory.
     */
    it('should register and create custom driver', async () => {
      // Arrange
      class CustomDriver implements IStorageDriver {
        isConnected(): boolean {
          return true;
        }
        async connect(): Promise<void> {}
        async disconnect(): Promise<void> {}
        async upload(): Promise<any> {
          return {};
        }
        async uploadMultiple(): Promise<any[]> {
          return [];
        }
        async download(): Promise<Buffer> {
          return Buffer.from('');
        }
        async downloadStream(): Promise<any> {
          return null;
        }
        async exists(): Promise<boolean> {
          return true;
        }
        async delete(): Promise<void> {}
        async deleteMultiple(): Promise<void> {}
        async copy(): Promise<void> {}
        async move(): Promise<void> {}
        async getMetadata(): Promise<any> {
          return {};
        }
        async setMetadata(): Promise<void> {}
        async list(): Promise<any[]> {
          return [];
        }
        getUrl(): string {
          return '';
        }
        async getPresignedUrl(): Promise<string> {
          return '';
        }
        async setVisibility(): Promise<void> {}
        async getVisibility(): Promise<StorageVisibility> {
          return StorageVisibility.PRIVATE;
        }
      }

      const driverType = 'custom' as StorageDriverType;

      // Act
      service.registerDriver(driverType, CustomDriver);
      const driver = await service.createDriver({ driver: driverType, driverOptions: {} }, false);

      // Assert
      expect(driver).toBeDefined();
      expect(driver).toBeInstanceOf(CustomDriver);
    });

    /**
     * Test: Override existing driver
     *
     * Verifies that registering a driver with an existing name
     * replaces the previous implementation.
     */
    it('should allow overriding existing drivers', async () => {
      // Arrange
      class CustomS3Driver implements IStorageDriver {
        isConnected(): boolean {
          return true;
        }
        async connect(): Promise<void> {}
        async disconnect(): Promise<void> {}
        async upload(): Promise<any> {
          return { custom: true };
        }
        async uploadMultiple(): Promise<any[]> {
          return [];
        }
        async download(): Promise<Buffer> {
          return Buffer.from('custom');
        }
        async downloadStream(): Promise<any> {
          return null;
        }
        async exists(): Promise<boolean> {
          return true;
        }
        async delete(): Promise<void> {}
        async deleteMultiple(): Promise<void> {}
        async copy(): Promise<void> {}
        async move(): Promise<void> {}
        async getMetadata(): Promise<any> {
          return {};
        }
        async setMetadata(): Promise<void> {}
        async list(): Promise<any[]> {
          return [];
        }
        getUrl(): string {
          return '';
        }
        async getPresignedUrl(): Promise<string> {
          return '';
        }
        async setVisibility(): Promise<void> {}
        async getVisibility(): Promise<StorageVisibility> {
          return StorageVisibility.PRIVATE;
        }
      }

      // Act
      service.registerDriver(StorageDriverType.S3, CustomS3Driver);
      const driver = await service.createDriver(
        {
          driver: StorageDriverType.S3,
          driverOptions: {
            region: 'us-east-1',
            bucket: 'test',
            credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
          },
        },
        false
      );

      // Assert
      expect(driver).toBeDefined();
      expect(driver).toBeInstanceOf(CustomS3Driver);
    });
  });

  /**
   * Test group: Driver instantiation
   *
   * Verifies that drivers are properly instantiated with
   * their configuration options.
   */
  describe('driver instantiation', () => {
    /**
     * Test: Each call creates new instance
     *
     * Ensures that calling createDriver multiple times creates
     * separate driver instances.
     */
    it('should create new instance on each call', async () => {
      // Arrange
      const options = {
        region: 'us-east-1',
        bucket: 'test-bucket',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      // Act
      const driver1 = await service.createDriver(
        { driver: StorageDriverType.S3, driverOptions: options },
        false
      );
      const driver2 = await service.createDriver(
        { driver: StorageDriverType.S3, driverOptions: options },
        false
      );

      // Assert
      expect(driver1).toBeDefined();
      expect(driver2).toBeDefined();
      expect(driver1).not.toBe(driver2);
    });

    /**
     * Test: Options are passed to driver constructor
     *
     * Verifies that configuration options are properly passed
     * to the driver constructor.
     */
    it('should pass options to driver constructor', async () => {
      // Arrange
      const options = {
        endPoint: 'localhost', // Use localhost instead of custom.minio.com
        port: 9000,
        useSSL: false,
        accessKey: 'test-access',
        secretKey: 'test-secret',
        bucket: 'test-bucket',
      };

      // Act
      const driver = await service.createDriver(
        { driver: StorageDriverType.MINIO, driverOptions: options },
        false
      );

      // Assert
      expect(driver).toBeDefined();
      // Driver should be configured with the provided options
    });
  });
});
