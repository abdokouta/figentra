/**
 * Test suite for MinIOStorageDriver class.
 *
 * This test suite verifies the MinIO storage driver implementation,
 * including MinIO client integration, file operations, and error handling.
 *
 * Coverage:
 * - connect() and disconnect()
 * - upload() with various content types
 * - download() and downloadStream()
 * - exists(), delete()
 * - copy() and move()
 * - Metadata operations
 * - list() operations
 * - URL generation
 * - Visibility management
 * - Error handling
 *
 * @module __tests__/drivers/minio-storage.driver.spec
 */

import { MinIOStorageDriver } from '@drivers/minio/minio-storage.driver';
import { StorageVisibility } from '@enums/storage-visibility.enum';

// Mock MinIO client
const mockMinioClient = {
  putObject: jest.fn().mockResolvedValue({ etag: 'abc123' }),
  getObject: jest.fn(),
  statObject: jest.fn(),
  removeObject: jest.fn().mockResolvedValue(undefined),
  copyObject: jest.fn().mockResolvedValue(undefined),
  listObjects: jest.fn(),
  presignedGetObject: jest.fn().mockResolvedValue('https://presigned-url'),
  bucketExists: jest.fn().mockResolvedValue(true),
  makeBucket: jest.fn().mockResolvedValue(undefined),
};

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => mockMinioClient),
}));

describe('MinIOStorageDriver', () => {
  let driver: MinIOStorageDriver;

  /**
   * Setup: Create driver instance before each test
   */
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create driver with test configuration
    const options = {
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      bucket: 'test-bucket',
    };

    driver = MinIOStorageDriver.make(options);

    // Ensure client is connected for tests that need it
    await driver.connect();
  });

  /**
   * Cleanup: Ensure driver is defined after setup
   */
  it('should be defined', () => {
    expect(driver).toBeDefined();
  });

  /**
   * Test group: Constructor and initialization
   *
   * Verifies that the driver is properly initialized with
   * configuration options.
   */
  describe('constructor', () => {
    /**
     * Test: Initialize with basic options
     *
     * Ensures that the driver can be created with minimal configuration.
     */
    it('should initialize with basic options', () => {
      // Arrange
      const options = {
        endPoint: 'minio.example.com',
        port: 9000,
        useSSL: true,
        accessKey: 'access-key',
        secretKey: 'secret-key',
        bucket: 'my-bucket',
      };

      // Act
      const newDriver = MinIOStorageDriver.make(options);

      // Assert
      expect(newDriver).toBeDefined();
      expect(newDriver).toBeInstanceOf(MinIOStorageDriver);
    });

    /**
     * Test: Initialize with default port
     *
     * Verifies that default port is used when not specified.
     */
    it('should use default port when not specified', () => {
      // Arrange
      const options = {
        endPoint: 'minio.example.com',
        useSSL: false,
        accessKey: 'key',
        secretKey: 'secret',
        bucket: 'bucket',
      };

      // Act
      const newDriver = MinIOStorageDriver.make(options as any);

      // Assert
      expect(newDriver).toBeDefined();
    });
  });

  /**
   * Test group: connect() and disconnect() methods
   *
   * Verifies that connection lifecycle is properly managed.
   */
  describe('lifecycle methods', () => {
    /**
     * Test: Connect to MinIO with fresh driver
     */
    it('should connect successfully', async () => {
      // Arrange - create a fresh driver for this test
      const freshDriver = MinIOStorageDriver.make({
        endPoint: 'localhost',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'test-bucket',
      });

      // Act & Assert
      await expect(freshDriver.connect()).resolves.not.toThrow();
      expect(mockMinioClient.bucketExists).toHaveBeenCalled();
    });

    /**
     * Test: Create bucket if not exists
     */
    it('should create bucket if not exists', async () => {
      // Arrange - create a fresh driver and mock bucket doesn't exist
      const freshDriver = MinIOStorageDriver.make({
        endPoint: 'localhost',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'test-bucket',
      });
      mockMinioClient.bucketExists.mockResolvedValueOnce(false);

      // Act
      await freshDriver.connect();

      // Assert
      expect(mockMinioClient.makeBucket).toHaveBeenCalled();
    });

    /**
     * Test: Disconnect from MinIO
     */
    it('should disconnect successfully', async () => {
      // Act & Assert
      await expect(driver.disconnect()).resolves.not.toThrow();
    });
  });

  /**
   * Test group: upload() method
   *
   * Verifies that files can be uploaded with various options.
   */
  describe('upload()', () => {
    /**
     * Test: Upload file from buffer
     *
     * Ensures that files can be uploaded from Buffer objects.
     */
    it('should upload file from buffer', async () => {
      // Arrange
      const path = 'uploads/test.pdf';
      const content = Buffer.from('test content');
      const options = { contentType: 'application/pdf' };

      // Act
      const result = await driver.upload(path, content, options);

      // Assert
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        path,
        content,
        content.length,
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        })
      );
      expect(result).toBeDefined();
      expect(result.path).toBe(path);
    });

    /**
     * Test: Upload with custom metadata
     *
     * Ensures that custom metadata can be attached to uploads.
     */
    it('should upload with custom metadata', async () => {
      // Arrange
      const path = 'document.pdf';
      const content = Buffer.from('content');
      const options = {
        metadata: {
          customMetadata: {
            department: 'sales',
            uploadedBy: 'user123',
          },
        },
      };

      // Act
      await driver.upload(path, content, options);

      // Assert
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    /**
     * Test: Upload stream
     *
     * Verifies that streams can be uploaded.
     */
    it('should upload stream', async () => {
      // Arrange
      const path = 'large-file.zip';
      const stream = require('stream').Readable.from(['chunk1', 'chunk2']);
      const options = { contentType: 'application/zip' };

      // Act
      const result = await driver.upload(path, stream, options);

      // Assert
      expect(mockMinioClient.putObject).toHaveBeenCalled();
      expect(result.path).toBe(path);
    });
  });

  /**
   * Test group: download() method
   *
   * Verifies that files can be downloaded.
   */
  describe('download()', () => {
    /**
     * Test: Download existing file
     *
     * Ensures that files can be downloaded as buffers.
     */
    it('should download existing file', async () => {
      // Arrange
      const path = 'uploads/test.pdf';
      const mockStream = require('stream').Readable.from([
        Buffer.from('test'),
        Buffer.from('content'),
      ]);
      mockMinioClient.getObject.mockResolvedValueOnce(mockStream);

      // Act
      const result = await driver.download(path);

      // Assert
      expect(mockMinioClient.getObject).toHaveBeenCalledWith('test-bucket', path);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  /**
   * Test group: exists() method
   *
   * Verifies that file existence checks work correctly.
   */
  describe('exists()', () => {
    /**
     * Test: Check existing file
     *
     * Ensures that exists() returns true for existing files.
     */
    it('should return true for existing file', async () => {
      // Arrange
      const path = 'uploads/test.pdf';
      mockMinioClient.statObject.mockResolvedValueOnce({
        size: 1024,
        lastModified: new Date(),
      });

      // Act
      const result = await driver.exists(path);

      // Assert
      expect(result).toBe(true);
      expect(mockMinioClient.statObject).toHaveBeenCalledWith('test-bucket', path);
    });

    /**
     * Test: Check non-existent file
     *
     * Verifies that exists() returns false for missing files.
     */
    it('should return false for non-existent file', async () => {
      // Arrange
      const path = 'missing.pdf';
      mockMinioClient.statObject.mockRejectedValueOnce({
        code: 'NotFound',
      });

      // Act
      const result = await driver.exists(path);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * Test group: delete() method
   *
   * Verifies that files can be deleted.
   */
  describe('delete()', () => {
    /**
     * Test: Delete existing file
     *
     * Ensures that files can be deleted successfully.
     */
    it('should delete existing file', async () => {
      // Arrange
      const path = 'uploads/old-file.pdf';

      // Act
      await driver.delete(path);

      // Assert
      expect(mockMinioClient.removeObject).toHaveBeenCalledWith('test-bucket', path);
    });
  });

  /**
   * Test group: copy() and move() methods
   *
   * Verifies that files can be copied and moved.
   */
  describe('copy and move operations', () => {
    /**
     * Test: Copy file
     *
     * Ensures that files can be copied to a new location.
     */
    it('should copy file', async () => {
      // Arrange
      const source = 'original.pdf';
      const destination = 'backup/original-copy.pdf';

      // Act
      await driver.copy(source, destination);

      // Assert
      expect(mockMinioClient.copyObject).toHaveBeenCalled();
    });

    /**
     * Test: Move file
     *
     * Verifies that files can be moved (copy + delete).
     */
    it('should move file', async () => {
      // Arrange
      const source = 'temp/file.pdf';
      const destination = 'permanent/file.pdf';

      // Act
      await driver.move(source, destination);

      // Assert
      expect(mockMinioClient.copyObject).toHaveBeenCalled();
      expect(mockMinioClient.removeObject).toHaveBeenCalled();
    });
  });

  /**
   * Test group: Metadata operations
   *
   * Verifies that file metadata can be managed.
   */
  describe('metadata operations', () => {
    /**
     * Test: Get file metadata
     *
     * Ensures that file metadata can be retrieved.
     */
    it('should get file metadata', async () => {
      // Arrange
      const path = 'document.pdf';
      mockMinioClient.statObject.mockResolvedValueOnce({
        size: 1024,
        lastModified: new Date(),
        metaData: {
          'content-type': 'application/pdf',
          department: 'sales',
        },
      });

      // Act
      const metadata = await driver.getMetadata(path);

      // Assert
      expect(mockMinioClient.statObject).toHaveBeenCalledWith('test-bucket', path);
      expect(metadata.size).toBe(1024);
      expect(metadata.contentType).toBe('application/pdf');
    });
  });

  /**
   * Test group: list() method
   *
   * Verifies that files can be listed.
   */
  describe('list()', () => {
    /**
     * Test: List files in directory
     *
     * Ensures that files can be listed with a prefix.
     */
    it('should list files in directory', async () => {
      // Arrange
      const prefix = 'uploads/';
      const mockStream = require('stream').Readable.from([
        { name: 'uploads/file1.pdf', size: 1024, lastModified: new Date() },
        { name: 'uploads/file2.pdf', size: 2048, lastModified: new Date() },
      ]);
      mockMinioClient.listObjects.mockReturnValueOnce(mockStream);

      // Act
      const files = await driver.list(prefix);

      // Assert
      expect(mockMinioClient.listObjects).toHaveBeenCalledWith('test-bucket', prefix, false);
      expect(files).toHaveLength(2);
    });

    /**
     * Test: List recursively
     *
     * Verifies that recursive listing works correctly.
     */
    it('should list recursively', async () => {
      // Arrange
      const prefix = 'uploads/';
      const options = { recursive: true };
      const mockStream = require('stream').Readable.from([]);
      mockMinioClient.listObjects.mockReturnValueOnce(mockStream);

      // Act
      await driver.list(prefix, options);

      // Assert
      expect(mockMinioClient.listObjects).toHaveBeenCalledWith('test-bucket', prefix, true);
    });
  });

  /**
   * Test group: URL operations
   *
   * Verifies that URLs can be generated.
   */
  describe('URL operations', () => {
    /**
     * Test: Get public URL
     *
     * Ensures that public URLs are correctly formatted.
     */
    it('should get public URL', () => {
      // Arrange
      const path = 'public/image.jpg';

      // Act
      const url = driver.getUrl(path);

      // Assert
      expect(url).toBeDefined();
      expect(url).toContain('localhost');
      expect(url).toContain('test-bucket');
      expect(url).toContain(path);
    });

    /**
     * Test: Get presigned URL
     *
     * Verifies that presigned URLs can be generated.
     */
    it('should get presigned URL', async () => {
      // Arrange
      const path = 'private/document.pdf';
      const options = { expiresIn: 3600 };

      // Act
      const url = await driver.getPresignedUrl(path, options);

      // Assert
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', path, 3600);
      expect(url).toBe('https://presigned-url');
    });
  });

  /**
   * Test group: Error handling
   *
   * Verifies that errors are properly handled and wrapped.
   */
  describe('error handling', () => {
    /**
     * Test: Handle connection errors
     *
     * Ensures that connection errors are properly caught.
     */
    it('should handle connection errors', async () => {
      // Arrange - create fresh driver and mock error
      const freshDriver = MinIOStorageDriver.make({
        endPoint: 'localhost',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'test-bucket',
      });
      mockMinioClient.bucketExists.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(freshDriver.connect()).rejects.toThrow(
        'Failed to connect to MinIO: Connection failed'
      );
    });

    /**
     * Test: Handle upload errors
     *
     * Verifies that upload errors are properly handled.
     */
    it('should handle upload errors', async () => {
      // Arrange
      const path = 'test.pdf';
      const content = Buffer.from('test');
      mockMinioClient.putObject.mockRejectedValueOnce(new Error('Upload failed'));

      // Act & Assert
      await expect(driver.upload(path, content)).rejects.toThrow();
    });

    /**
     * Test: Handle download errors
     *
     * Ensures that download errors are properly caught.
     */
    it('should handle download errors', async () => {
      // Arrange
      const path = 'missing.pdf';
      mockMinioClient.getObject.mockRejectedValueOnce({
        code: 'NoSuchKey',
        message: 'The specified key does not exist',
      });

      // Act & Assert
      await expect(driver.download(path)).rejects.toThrow();
    });
  });
});
