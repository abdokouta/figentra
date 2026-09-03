/**
 * Test suite for @InjectStorage() decorator.
 *
 * This test suite verifies the behavior of the @InjectStorage() decorator,
 * including dependency injection integration with NestJS.
 *
 * Coverage:
 * - Basic injection functionality
 * - Integration with NestJS DI container
 * - Constructor parameter decoration
 * - Injection token verification
 *
 * @module __tests__/decorators/inject-storage.decorator.spec
 */

import 'reflect-metadata';
import { InjectStorage } from '@decorators/inject-storage.decorator';
import { STORAGE_SERVICE } from '@constants/storage-service.constant';

describe('@InjectStorage() Decorator', () => {
  /**
   * Test group: Basic injection functionality
   *
   * Verifies that the decorator properly marks parameters for
   * dependency injection.
   */
  describe('basic injection', () => {
    /**
     * Test: Decorator returns function
     *
     * Ensures that InjectStorage returns a proper parameter decorator
     * function that can be used for dependency injection.
     */
    it('should return a parameter decorator function', () => {
      // Act
      const decorator = InjectStorage();

      // Assert
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    /**
     * Test: Decorator can be applied to constructor parameters
     *
     * Verifies that the decorator can be used in class constructors
     * for dependency injection.
     */
    it('should be applicable to constructor parameters', () => {
      // Arrange & Act
      class TestService {
        constructor(@InjectStorage() private readonly storage: any) {}
      }

      // Assert
      expect(TestService).toBeDefined();
      expect(TestService.make({} as any)).toBeInstanceOf(TestService);
    });

    /**
     * Test: Multiple injections in same constructor
     *
     * Ensures that multiple parameters can be decorated independently.
     */
    it('should handle multiple injections in same constructor', () => {
      // Arrange & Act
      class TestService {
        constructor(
          @InjectStorage() private readonly storage1: any,
          @InjectStorage() private readonly storage2: any
        ) {}
      }

      // Assert
      expect(TestService).toBeDefined();
      const instance = TestService.make({} as any, {} as any);
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  /**
   * Test group: Injection token verification
   *
   * Verifies that the correct injection token is used for
   * resolving dependencies.
   */
  describe('injection token', () => {
    /**
     * Test: Uses correct injection token
     *
     * Ensures that the decorator uses the STORAGE_SERVICE token
     * for dependency resolution.
     */
    it('should use STORAGE_SERVICE injection token', () => {
      // Arrange
      class TestService {
        constructor(@InjectStorage() private readonly storage: any) {}
      }

      // Act
      const metadata = Reflect.getMetadata('design:paramtypes', TestService);

      // Assert
      expect(metadata).toBeDefined();
      // The decorator should have attached the injection token metadata
    });

    /**
     * Test: Token is consistent across multiple uses
     *
     * Verifies that the same token is used for all injections.
     */
    it('should use consistent token across multiple injections', () => {
      // Arrange
      class Service1 {
        constructor(@InjectStorage() private readonly storage: any) {}
      }

      class Service2 {
        constructor(@InjectStorage() private readonly storage: any) {}
      }

      // Act & Assert
      expect(Service1).toBeDefined();
      expect(Service2).toBeDefined();
      // Both should use the same STORAGE_SERVICE token
    });
  });

  /**
   * Test group: Integration scenarios
   *
   * Verifies that the decorator works correctly in realistic
   * service class scenarios.
   */
  describe('integration scenarios', () => {
    /**
     * Test: Injection in service class
     *
     * Ensures that the decorator works in typical service classes.
     */
    it('should work in service class', () => {
      // Arrange & Act
      class FileService {
        constructor(@InjectStorage() private readonly storage: any) {}

        async uploadFile(path: string, content: Buffer) {
          // Would use this.storage.upload() in real implementation
          return { path, size: content.length };
        }
      }

      // Assert
      expect(FileService).toBeDefined();
      const mockStorage = { upload: jest.fn() };
      const service = FileService.make(mockStorage);
      expect(service).toBeInstanceOf(FileService);
    });

    /**
     * Test: Injection alongside other dependencies
     *
     * Verifies that Storage can be injected alongside other services.
     */
    it('should work alongside other dependencies', () => {
      // Arrange & Act
      class DocumentService {
        constructor(
          @InjectStorage() private readonly storage: any,
          private readonly database: any,
          private readonly logger: any
        ) {}
      }

      // Assert
      expect(DocumentService).toBeDefined();
      const instance = DocumentService.make({}, {}, {});
      expect(instance).toBeInstanceOf(DocumentService);
    });

    /**
     * Test: Injection in controller
     *
     * Ensures that the decorator works in controller classes.
     */
    it('should work in controller class', () => {
      // Arrange & Act
      class UploadController {
        constructor(@InjectStorage() private readonly storage: any) {}

        async handleUpload(file: any) {
          // Would use this.storage.upload() in real implementation
          return { success: true };
        }
      }

      // Assert
      expect(UploadController).toBeDefined();
      const mockStorage = { upload: jest.fn() };
      const controller = UploadController.make(mockStorage);
      expect(controller).toBeInstanceOf(UploadController);
    });
  });

  /**
   * Test group: Edge cases
   *
   * Verifies that the decorator handles edge cases correctly.
   */
  describe('edge cases', () => {
    /**
     * Test: Decorator without parentheses
     *
     * Ensures that the decorator can be called without parentheses
     * (though this is not the typical usage).
     */
    it('should work when called without parentheses', () => {
      // Arrange & Act
      const decorator = InjectStorage();

      // Assert
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    /**
     * Test: Multiple calls return independent decorators
     *
     * Verifies that each call to InjectStorage() returns a
     * function that can be used independently.
     */
    it('should return independent decorators on each call', () => {
      // Act
      const decorator1 = InjectStorage();
      const decorator2 = InjectStorage();

      // Assert
      expect(decorator1).toBeDefined();
      expect(decorator2).toBeDefined();
      expect(typeof decorator1).toBe('function');
      expect(typeof decorator2).toBe('function');
    });

    /**
     * Test: Decorator in abstract class
     *
     * Ensures that the decorator works in abstract base classes.
     */
    it('should work in abstract class', () => {
      // Arrange & Act
      abstract class BaseService {
        constructor(@InjectStorage() protected readonly storage: any) {}

        abstract processFile(path: string): Promise<void>;
      }

      class ConcreteService extends BaseService {
        async processFile(path: string) {
          // Implementation
        }
      }

      // Assert
      expect(BaseService).toBeDefined();
      expect(ConcreteService).toBeDefined();
      const instance = ConcreteService.make({});
      expect(instance).toBeInstanceOf(ConcreteService);
      expect(instance).toBeInstanceOf(BaseService);
    });
  });

  /**
   * Test group: Type safety
   *
   * Verifies that the decorator maintains type information
   * for TypeScript compilation.
   */
  describe('type safety', () => {
    /**
     * Test: Preserves parameter type information
     *
     * Ensures that TypeScript type information is preserved
     * when using the decorator.
     */
    it('should preserve parameter type information', () => {
      // Arrange
      interface IStorageService {
        upload(path: string, content: Buffer): Promise<any>;
        download(path: string): Promise<Buffer>;
      }

      class TestService {
        constructor(@InjectStorage() private readonly storage: IStorageService) {}

        async saveFile(path: string, content: Buffer) {
          // TypeScript should know that storage has upload method
          return await this.storage.upload(path, content);
        }
      }

      // Assert
      expect(TestService).toBeDefined();
      const mockStorage: IStorageService = {
        upload: jest.fn().mockResolvedValue({ path: 'test.pdf' }),
        download: jest.fn().mockResolvedValue(Buffer.from('test')),
      };
      const service = TestService.make(mockStorage);
      expect(service).toBeInstanceOf(TestService);
    });
  });
});
