/**
 * Test suite for @UploadFile() decorator.
 *
 * This test suite verifies the behavior of the @UploadFile() decorator,
 * including metadata attachment for file upload configuration.
 *
 * Coverage:
 * - Basic decoration without options
 * - Decoration with full options
 * - Decoration with partial options
 * - Multiple decorated methods
 * - Metadata retrieval helper function
 * - Edge cases
 *
 * @module __tests__/decorators/upload-file.decorator.spec
 */

import 'reflect-metadata';
import { UploadFile, getUploadMetadata } from '@decorators/upload-file.decorator';
import { STORAGE_UPLOAD_METADATA } from '@constants/storage-upload-metadata.constant';
import { StorageVisibility } from '@enums/storage-visibility.enum';

describe('@UploadFile() Decorator', () => {
  /**
   * Test group: Basic decoration functionality
   *
   * Verifies that the decorator properly attaches metadata to methods.
   */
  describe('basic decoration', () => {
    /**
     * Test: Decorator without options
     *
     * Ensures that the decorator can be applied without options
     * and attaches empty metadata.
     */
    it('should attach empty metadata when called without options', () => {
      // Arrange
      class TestController {
        @UploadFile()
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual({});
    });

    /**
     * Test: Decorator with undefined options
     *
     * Verifies that explicitly passing undefined works correctly.
     */
    it('should handle undefined options', () => {
      // Arrange
      class TestController {
        @UploadFile(undefined)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual({});
    });
  });

  /**
   * Test group: Decoration with options
   *
   * Verifies that the decorator properly handles various option
   * configurations.
   */
  describe('decoration with options', () => {
    /**
     * Test: Decorator with full options
     *
     * Verifies that the decorator properly attaches all provided
     * options as metadata.
     */
    it('should attach metadata with all options', () => {
      // Arrange
      const options = {
        visibility: StorageVisibility.PUBLIC,
        contentType: 'image/jpeg',
        metadata: {
          cacheControl: 'max-age=31536000',
          customMetadata: {
            department: 'marketing',
          },
        },
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual(options);
      expect(metadata.visibility).toBe(StorageVisibility.PUBLIC);
      expect(metadata.contentType).toBe('image/jpeg');
      expect(metadata.metadata.cacheControl).toBe('max-age=31536000');
    });

    /**
     * Test: Decorator with visibility only
     *
     * Ensures that the decorator works with partial option objects.
     */
    it('should attach metadata with visibility only', () => {
      // Arrange
      const options = {
        visibility: StorageVisibility.PRIVATE,
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.visibility).toBe(StorageVisibility.PRIVATE);
      expect(metadata.contentType).toBeUndefined();
    });

    /**
     * Test: Decorator with content type only
     *
     * Verifies that content type can be specified alone.
     */
    it('should attach metadata with content type only', () => {
      // Arrange
      const options = {
        contentType: 'application/pdf',
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.contentType).toBe('application/pdf');
      expect(metadata.visibility).toBeUndefined();
    });

    /**
     * Test: Decorator with custom metadata only
     *
     * Ensures that custom metadata can be specified alone.
     */
    it('should attach metadata with custom metadata only', () => {
      // Arrange
      const options = {
        metadata: {
          customMetadata: {
            uploadedBy: 'user123',
            department: 'sales',
          },
        },
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.metadata.customMetadata.uploadedBy).toBe('user123');
      expect(metadata.metadata.customMetadata.department).toBe('sales');
    });
  });

  /**
   * Test group: Multiple decorated methods
   *
   * Verifies that multiple methods can be decorated independently
   * with different configurations.
   */
  describe('multiple decorated methods', () => {
    /**
     * Test: Multiple methods with different configurations
     *
     * Ensures that multiple methods can have independent upload
     * configurations.
     */
    it('should handle multiple decorated methods independently', () => {
      // Arrange
      class TestController {
        @UploadFile({ visibility: StorageVisibility.PUBLIC })
        uploadPublic() {}

        @UploadFile({ visibility: StorageVisibility.PRIVATE })
        uploadPrivate() {}

        @UploadFile({ contentType: 'image/jpeg' })
        uploadImage() {}
      }

      // Act
      const publicMetadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadPublic'
      );
      const privateMetadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadPrivate'
      );
      const imageMetadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadImage'
      );

      // Assert
      expect(publicMetadata.visibility).toBe(StorageVisibility.PUBLIC);
      expect(privateMetadata.visibility).toBe(StorageVisibility.PRIVATE);
      expect(imageMetadata.contentType).toBe('image/jpeg');
    });

    /**
     * Test: Configurations don't interfere with each other
     *
     * Verifies that decorating one method doesn't affect others.
     */
    it('should not interfere between different methods', () => {
      // Arrange
      class TestController {
        @UploadFile({ visibility: StorageVisibility.PUBLIC, contentType: 'image/png' })
        uploadA() {}

        @UploadFile({ visibility: StorageVisibility.PRIVATE, contentType: 'application/pdf' })
        uploadB() {}
      }

      // Act
      const metadataA = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadA'
      );
      const metadataB = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadB'
      );

      // Assert
      expect(metadataA.visibility).toBe(StorageVisibility.PUBLIC);
      expect(metadataA.contentType).toBe('image/png');
      expect(metadataB.visibility).toBe(StorageVisibility.PRIVATE);
      expect(metadataB.contentType).toBe('application/pdf');
      expect(metadataA.visibility).not.toBe(metadataB.visibility);
    });
  });

  /**
   * Test group: getUploadMetadata() helper function
   *
   * Verifies that the helper function properly retrieves metadata
   * attached by the decorator.
   */
  describe('getUploadMetadata() helper', () => {
    /**
     * Test: Retrieve metadata from decorated method
     *
     * Ensures that the helper function can retrieve metadata
     * that was attached by the decorator.
     */
    it('should retrieve metadata from decorated method', () => {
      // Arrange
      const options = {
        visibility: StorageVisibility.PUBLIC,
        contentType: 'application/pdf',
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = getUploadMetadata(TestController.prototype, 'uploadFile');

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual(options);
    });

    /**
     * Test: Return undefined for non-decorated method
     *
     * Verifies that the helper function returns undefined when
     * called on a method without the decorator.
     */
    it('should return undefined for non-decorated methods', () => {
      // Arrange
      class TestController {
        uploadFile() {}
      }

      // Act
      const metadata = getUploadMetadata(TestController.prototype, 'uploadFile');

      // Assert
      expect(metadata).toBeUndefined();
    });

    /**
     * Test: Return undefined for non-existent method
     *
     * Ensures that the helper function handles non-existent methods
     * gracefully.
     */
    it('should return undefined for non-existent methods', () => {
      // Arrange
      class TestController {}

      // Act
      const metadata = getUploadMetadata(TestController.prototype, 'nonExistent');

      // Assert
      expect(metadata).toBeUndefined();
    });

    /**
     * Test: Retrieve empty metadata
     *
     * Verifies that empty metadata objects are retrieved correctly.
     */
    it('should retrieve empty metadata correctly', () => {
      // Arrange
      class TestController {
        @UploadFile()
        uploadFile() {}
      }

      // Act
      const metadata = getUploadMetadata(TestController.prototype, 'uploadFile');

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual({});
    });
  });

  /**
   * Test group: Edge cases
   *
   * Verifies that the decorator handles edge cases correctly.
   */
  describe('edge cases', () => {
    /**
     * Test: Empty options object
     *
     * Ensures that empty options objects are handled correctly.
     */
    it('should handle empty options object', () => {
      // Arrange
      class TestController {
        @UploadFile({})
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toEqual({});
    });

    /**
     * Test: Options with null values
     *
     * Verifies that null values in options are preserved.
     */
    it('should handle null values in options', () => {
      // Arrange
      const options = {
        visibility: null as any,
        contentType: null as any,
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.visibility).toBeNull();
      expect(metadata.contentType).toBeNull();
    });

    /**
     * Test: Complex nested metadata
     *
     * Ensures that deeply nested metadata structures are preserved.
     */
    it('should handle complex nested metadata', () => {
      // Arrange
      const options = {
        metadata: {
          cacheControl: 'max-age=31536000',
          customMetadata: {
            'level1-level2-level3': 'deep value',
            'another-key': 'another value',
          },
        },
      };

      class TestController {
        @UploadFile(options)
        uploadFile() {}
      }

      // Act
      const metadata = Reflect.getMetadata(
        STORAGE_UPLOAD_METADATA,
        TestController.prototype,
        'uploadFile'
      );

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata.metadata.customMetadata['level1-level2-level3']).toBe('deep value');
      expect(metadata.metadata.customMetadata['another-key']).toBe('another value');
    });
  });
});
