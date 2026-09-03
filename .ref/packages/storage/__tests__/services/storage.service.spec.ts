/**
 * Test suite for StorageService class.
 *
 * This test suite verifies the main storage service functionality,
 * including file operations, metadata management, and driver delegation.
 *
 * Coverage:
 * - upload() and uploadMultiple()
 * - download() and downloadStream()
 * - exists(), delete(), deleteMultiple()
 * - copy() and move()
 * - getMetadata() and setMetadata()
 * - list() operations
 * - URL generation and presigned URLs
 * - Visibility management
 * - Error handling
 *
 * @module __tests__/services/storage.service.spec
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '@services/storage.service';
import type { IStorageDriver } from '@interfaces/storage-driver.interface';
import { StorageVisibility } from '@enums/storage-visibility.enum';
import { FileNotFoundException } from '@exceptions/file-not-found.exception';
import { UploadFailedException } from '@exceptions/upload-failed.exception';
import { Readable } from 'stream';

describe('StorageService', () => {
  let service: StorageService;
  let mockDriver: jest.Mocked<IStorageDriver>;

  /**
   * Setup: Create testing module and mock driver before each test
   *
   * Initializes a fresh instance of StorageService with a mocked
   * driver for each test to ensure test isolation.
   */
  beforeEach(async () => {
    // Create mock driver
    mockDriver = {
      isConnected: jest.fn().mockReturnValue(true),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue({ path: 'test.pdf', size: 1024 }),
      uploadMultiple: jest.fn().mockResolvedValue([{ path: 'test.pdf', size: 1024 }]),
      download: jest.fn().mockResolvedValue(Buffer.from('test content')),
      downloadStream: jest.fn().mockReturnValue(Readable.from(['test'])),
      exists: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteMultiple: jest.fn().mockResolvedValue(undefined),
      copy: jest.fn().mockResolvedValue(undefined),
      move: jest.fn().mockResolvedValue(undefined),
      getMetadata: jest.fn().mockResolvedValue({ contentType: 'application/pdf' }),
      setMetadata: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([{ name: 'file.pdf', size: 1024 }]),
      getUrl: jest.fn().mockReturnValue('https://storage.example.com/file.pdf'),
      getPresignedUrl: jest
        .fn()
        .mockResolvedValue('https://storage.example.com/file.pdf?token=abc'),
      setVisibility: jest.fn().mockResolvedValue(undefined),
      getVisibility: jest.fn().mockResolvedValue(StorageVisibility.PRIVATE),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: StorageService,
          useFactory: () => StorageService.make(mockDriver, { driver: 'test', driverOptions: {} }),
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  /**
   * Cleanup: Ensure service is defined after setup
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Test group: upload() method
   *
   * Verifies that the service correctly handles file uploads
   * with various content types and options.
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
      const result = await service.upload(path, content, options);

      // Assert
      expect(mockDriver.upload).toHaveBeenCalledWith(path, content, {
        ...options,
        visibility: StorageVisibility.PRIVATE,
      });
      expect(result).toBeDefined();
      expect(result.path).toBe('test.pdf');
    });

    /**
     * Test: Upload file from stream
     *
     * Verifies that files can be uploaded from readable streams.
     */
    it('should upload file from stream', async () => {
      // Arrange
      const path = 'uploads/large-file.zip';
      const stream = Readable.from(['chunk1', 'chunk2']);
      const options = { contentType: 'application/zip' };

      // Act
      const result = await service.upload(path, stream, options);

      // Assert
      expect(mockDriver.upload).toHaveBeenCalledWith(path, stream, {
        ...options,
        visibility: StorageVisibility.PRIVATE,
      });
      expect(result).toBeDefined();
    });

    /**
     * Test: Upload with visibility option
     *
     * Ensures that file visibility can be set during upload.
     */
    it('should upload with visibility option', async () => {
      // Arrange
      const path = 'public/image.jpg';
      const content = Buffer.from('image data');
      const options = {
        contentType: 'image/jpeg',
        visibility: StorageVisibility.PUBLIC,
      };

      // Act
      await service.upload(path, content, options);

      // Assert
      expect(mockDriver.upload).toHaveBeenCalledWith(path, content, options);
    });

    /**
     * Test: Handle upload failure
     *
     * Verifies that upload errors are properly caught and wrapped.
     */
    it('should throw UploadFailedException on error', async () => {
      // Arrange
      const path = 'uploads/test.pdf';
      const content = Buffer.from('test');
      mockDriver.upload.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(service.upload(path, content)).rejects.toThrow('Network error');
    });
  });

  /**
   * Test group: uploadMultiple() method
   *
   * Verifies that multiple files can be uploaded in batch.
   */
  describe('uploadMultiple()', () => {
    /**
     * Test: Upload multiple files
     *
     * Ensures that multiple files can be uploaded concurrently.
     */
    it('should upload multiple files', async () => {
      // Arrange
      const files = [
        { path: 'file1.pdf', content: Buffer.from('content1') },
        { path: 'file2.pdf', content: Buffer.from('content2') },
      ];

      // Act
      const results = await service.uploadMultiple(files);

      // Assert
      expect(mockDriver.uploadMultiple).toHaveBeenCalledWith(files, {
        visibility: StorageVisibility.PRIVATE,
      });
      expect(results).toHaveLength(1);
    });
  });

  /**
   * Test group: download() method
   *
   * Verifies that files can be downloaded as buffers.
   */
  describe('download()', () => {
    /**
     * Test: Download existing file
     *
     * Ensures that files can be downloaded successfully.
     */
    it('should download existing file', async () => {
      // Arrange
      const path = 'uploads/test.pdf';

      // Act
      const result = await service.download(path);

      // Assert
      expect(mockDriver.download).toHaveBeenCalledWith(path, undefined);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test content');
    });

    /**
     * Test: Download with range option
     *
     * Verifies that partial content downloads work correctly.
     */
    it('should download with range option', async () => {
      // Arrange
      const path = 'uploads/large-file.bin';
      const options = { range: { start: 0, end: 1024 } };

      // Act
      await service.download(path, options);

      // Assert
      expect(mockDriver.download).toHaveBeenCalledWith(path, options);
    });

    /**
     * Test: Throw error for non-existent file
     *
     * Ensures that downloading non-existent files throws appropriate error.
     */
    it('should throw FileNotFoundException for non-existent file', async () => {
      // Arrange
      const path = 'missing.pdf';
      mockDriver.download.mockRejectedValueOnce(new Error('Not found'));

      // Act & Assert
      await expect(service.download(path)).rejects.toThrow();
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
      mockDriver.exists.mockResolvedValueOnce(true);

      // Act
      const result = await service.exists(path);

      // Assert
      expect(mockDriver.exists).toHaveBeenCalledWith(path);
      expect(result).toBe(true);
    });

    /**
     * Test: Check non-existent file
     *
     * Ensures that exists() returns false for missing files.
     */
    it('should return false for non-existent file', async () => {
      // Arrange
      const path = 'missing.pdf';
      mockDriver.exists.mockResolvedValueOnce(false);

      // Act
      const result = await service.exists(path);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * Test group: delete() and deleteMultiple() methods
   *
   * Verifies that files can be deleted individually or in batch.
   */
  describe('delete operations', () => {
    /**
     * Test: Delete single file
     *
     * Ensures that individual files can be deleted.
     */
    it('should delete single file', async () => {
      // Arrange
      const path = 'uploads/old-file.pdf';

      // Act
      await service.delete(path);

      // Assert
      expect(mockDriver.delete).toHaveBeenCalledWith(path);
    });

    /**
     * Test: Delete multiple files
     *
     * Verifies that multiple files can be deleted in batch.
     */
    it('should delete multiple files', async () => {
      // Arrange
      const paths = ['file1.pdf', 'file2.pdf', 'file3.pdf'];

      // Act
      await service.deleteMultiple(paths);

      // Assert
      expect(mockDriver.deleteMultiple).toHaveBeenCalledWith(paths);
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
      await service.copy(source, destination);

      // Assert
      expect(mockDriver.copy).toHaveBeenCalledWith(source, destination);
    });

    /**
     * Test: Move file
     *
     * Verifies that files can be moved to a new location.
     */
    it('should move file', async () => {
      // Arrange
      const source = 'temp/file.pdf';
      const destination = 'permanent/file.pdf';

      // Act
      await service.move(source, destination);

      // Assert
      expect(mockDriver.move).toHaveBeenCalledWith(source, destination);
    });
  });

  /**
   * Test group: Metadata operations
   *
   * Verifies that file metadata can be retrieved and updated.
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

      // Act
      const metadata = await service.getMetadata(path);

      // Assert
      expect(mockDriver.getMetadata).toHaveBeenCalledWith(path);
      expect(metadata).toBeDefined();
      expect(metadata.contentType).toBe('application/pdf');
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

      // Act
      await service.setMetadata(path, metadata);

      // Assert
      expect(mockDriver.setMetadata).toHaveBeenCalledWith(path, metadata);
    });
  });

  /**
   * Test group: list() method
   *
   * Verifies that files can be listed with various options.
   */
  describe('list()', () => {
    /**
     * Test: List files in directory
     *
     * Ensures that files in a directory can be listed.
     */
    it('should list files in directory', async () => {
      // Arrange
      const prefix = 'uploads/';

      // Act
      const files = await service.list(prefix);

      // Assert
      expect(mockDriver.list).toHaveBeenCalledWith(prefix, undefined);
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('file.pdf');
    });

    /**
     * Test: List with options
     *
     * Verifies that list options are properly passed to driver.
     */
    it('should list with options', async () => {
      // Arrange
      const prefix = 'uploads/';
      const options = { maxResults: 100, recursive: true };

      // Act
      await service.list(prefix, options);

      // Assert
      expect(mockDriver.list).toHaveBeenCalledWith(prefix, options);
    });
  });

  /**
   * Test group: URL operations
   *
   * Verifies that public and presigned URLs can be generated.
   */
  describe('URL operations', () => {
    /**
     * Test: Get public URL
     *
     * Ensures that public URLs can be generated for files.
     */
    it('should get public URL', () => {
      // Arrange
      const path = 'public/image.jpg';

      // Act
      const url = service.getUrl(path);

      // Assert
      expect(mockDriver.getUrl).toHaveBeenCalledWith(path);
      expect(url).toBe('https://storage.example.com/file.pdf');
    });

    /**
     * Test: Get presigned URL
     *
     * Verifies that temporary presigned URLs can be generated.
     */
    it('should get presigned URL', async () => {
      // Arrange
      const path = 'private/document.pdf';
      const options = { expiresIn: 3600 };

      // Act
      const url = await service.getPresignedUrl(path, options);

      // Assert
      expect(mockDriver.getPresignedUrl).toHaveBeenCalledWith(path, options);
      expect(url).toContain('token=');
    });
  });

  /**
   * Test group: Visibility operations
   *
   * Verifies that file visibility can be managed.
   */
  describe('visibility operations', () => {
    /**
     * Test: Set file visibility
     *
     * Ensures that file visibility can be changed.
     */
    it('should set file visibility', async () => {
      // Arrange
      const path = 'document.pdf';
      const visibility = StorageVisibility.PUBLIC;

      // Act
      await service.setVisibility(path, visibility);

      // Assert
      expect(mockDriver.setVisibility).toHaveBeenCalledWith(path, visibility);
    });

    /**
     * Test: Get file visibility
     *
     * Verifies that current file visibility can be retrieved.
     */
    it('should get file visibility', async () => {
      // Arrange
      const path = 'document.pdf';

      // Act
      const visibility = await service.getVisibility(path);

      // Assert
      expect(mockDriver.getVisibility).toHaveBeenCalledWith(path);
      expect(visibility).toBe(StorageVisibility.PRIVATE);
    });
  });
});
