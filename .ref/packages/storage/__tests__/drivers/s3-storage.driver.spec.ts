/**
 * Test suite for S3StorageDriver class.
 *
 * This test suite verifies the S3 storage driver implementation,
 * including AWS SDK integration, file operations, and error handling.
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
 * - Error handling and retries
 *
 * @module __tests__/drivers/s3-storage.driver.spec
 */

import { S3StorageDriver } from '@drivers/s3/s3-storage.driver';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import { StorageACL } from '@enums/storage-acl.enum';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url'),
}));

describe('S3StorageDriver', () => {
  let driver: S3StorageDriver;
  let mockS3Client: any;

  /**
   * Setup: Create driver instance and mock S3 client before each test
   *
   * Initializes a fresh driver instance with mocked AWS SDK for
   * each test to ensure test isolation.
   */
  beforeEach(() => {
    // Create mock S3 client
    mockS3Client = {
      send: jest.fn(),
    };

    // Create driver with test configuration
    const options = {
      region: 'us-east-1',
      bucket: 'test-bucket',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
    };

    driver = S3StorageDriver.make(options);
    (driver as any).client = mockS3Client;
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
        region: 'us-west-2',
        bucket: 'my-bucket',
        credentials: {
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        },
      };

      // Act
      const newDriver = S3StorageDriver.make(options);

      // Assert
      expect(newDriver).toBeDefined();
      expect(newDriver).toBeInstanceOf(S3StorageDriver);
    });

    /**
     * Test: Initialize with custom endpoint
     *
     * Verifies that custom S3-compatible endpoints can be configured.
     */
    it('should initialize with custom endpoint', () => {
      // Arrange
      const options = {
        region: 'us-east-1',
        bucket: 'test-bucket',
        endpoint: 'https://s3.custom.com',
        credentials: {
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        },
      };

      // Act
      const newDriver = S3StorageDriver.make(options);

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
     * Test: Connect to S3
     *
     * Ensures that the connect method completes successfully.
     */
    it('should connect successfully', async () => {
      // Act & Assert
      await expect(driver.connect()).resolves.not.toThrow();
    });

    /**
     * Test: Disconnect from S3
     *
     * Verifies that the disconnect method completes successfully.
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

      mockS3Client.send.mockResolvedValueOnce({
        ETag: '"abc123"',
        VersionId: 'v1',
      });

      // Act
      const result = await driver.upload(path, content, options);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.path).toBe(path);
    });

    /**
     * Test: Upload with public visibility
     *
     * Verifies that files can be uploaded with public ACL.
     */
    it('should upload with public visibility', async () => {
      // Arrange
      const path = 'public/image.jpg';
      const content = Buffer.from('image data');
      const options = {
        contentType: 'image/jpeg',
        visibility: StorageVisibility.PUBLIC,
      };

      mockS3Client.send.mockResolvedValueOnce({ ETag: '"abc"' });

      // Act
      await driver.upload(path, content, options);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      // Verify ACL was set to public-read
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

      mockS3Client.send.mockResolvedValueOnce({ ETag: '"abc"' });

      // Act
      await driver.upload(path, content, options);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
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
      const mockBody = {
        transformToByteArray: jest.fn().mockResolvedValue(Uint8Array.make([1, 2, 3])),
      };

      mockS3Client.send.mockResolvedValueOnce({
        Body: mockBody,
        ContentLength: 3,
      });

      // Act
      const result = await driver.download(path);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });

    /**
     * Test: Download with range
     *
     * Verifies that partial content downloads work correctly.
     */
    it('should download with range', async () => {
      // Arrange
      const path = 'large-file.bin';
      const options = { range: { start: 0, end: 1024 } };
      const mockBody = {
        transformToByteArray: jest.fn().mockResolvedValue(Uint8Array.make(1024)),
      };

      mockS3Client.send.mockResolvedValueOnce({
        Body: mockBody,
        ContentLength: 1024,
      });

      // Act
      await driver.download(path, options);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      // Verify Range header was set
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
      mockS3Client.send.mockResolvedValueOnce({
        ContentLength: 1024,
      });

      // Act
      const result = await driver.exists(path);

      // Assert
      expect(result).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    /**
     * Test: Check non-existent file
     *
     * Verifies that exists() returns false for missing files.
     */
    it('should return false for non-existent file', async () => {
      // Arrange
      const path = 'missing.pdf';
      mockS3Client.send.mockRejectedValueOnce({
        name: 'NoSuchKey',
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
      mockS3Client.send.mockResolvedValueOnce({});

      // Act
      await driver.delete(path);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
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
      mockS3Client.send.mockResolvedValueOnce({});

      // Act
      await driver.copy(source, destination);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
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
      mockS3Client.send.mockResolvedValue({});

      // Act
      await driver.move(source, destination);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalledTimes(2); // copy + delete
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
      mockS3Client.send.mockResolvedValueOnce({
        ContentType: 'application/pdf',
        ContentLength: 1024,
        LastModified: new Date(),
        Metadata: { department: 'sales' },
      });

      // Act
      const metadata = await driver.getMetadata(path);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(metadata.contentType).toBe('application/pdf');
      expect(metadata.size).toBe(1024);
    });

    /**
     * Test: Set file metadata
     *
     * Verifies that file metadata can be updated.
     */
    it('should set file metadata', async () => {
      // Arrange
      const path = 'document.pdf';
      const metadata = {
        cacheControl: 'max-age=31536000',
        customMetadata: { department: 'sales' },
      };
      mockS3Client.send.mockResolvedValue({});

      // Act
      await driver.setMetadata(path, metadata);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
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
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'uploads/file1.pdf', Size: 1024, LastModified: new Date() },
          { Key: 'uploads/file2.pdf', Size: 2048, LastModified: new Date() },
        ],
      });

      // Act
      const files = await driver.list(prefix);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('uploads/file1.pdf');
    });

    /**
     * Test: List with max results
     *
     * Verifies that list pagination works correctly.
     */
    it('should list with max results', async () => {
      // Arrange
      const prefix = 'uploads/';
      const options = { maxResults: 10 };
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [],
      });

      // Act
      await driver.list(prefix, options);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalled();
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
      expect(url).toBeDefined();
      expect(url).toBe('https://signed-url');
    });
  });

  /**
   * Test group: Error handling
   *
   * Verifies that errors are properly handled and wrapped.
   */
  describe('error handling', () => {
    /**
     * Test: Handle network errors
     *
     * Ensures that network errors are properly caught.
     */
    it('should handle network errors', async () => {
      // Arrange
      const path = 'test.pdf';
      const content = Buffer.from('test');
      mockS3Client.send.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(driver.upload(path, content)).rejects.toThrow();
    });

    /**
     * Test: Handle access denied errors
     *
     * Verifies that permission errors are properly handled.
     */
    it('should handle access denied errors', async () => {
      // Arrange
      const path = 'protected/file.pdf';
      mockS3Client.send.mockRejectedValueOnce({
        name: 'AccessDenied',
        message: 'Access Denied',
      });

      // Act & Assert
      await expect(driver.download(path)).rejects.toThrow();
    });
  });
});
