import { defineMetadata } from '@/define-metadata';
import { getMetadata } from '@/get-metadata';

describe('defineMetadata', () => {
  describe('Basic Metadata Definition', () => {
    /**
     * Test case: defineMetadata should set metadata on target objects
     *
     * This test validates the core functionality of defining metadata
     * with string keys and various value types.
     */
    it('should define metadata with string keys', () => {
      // Arrange: Create a test class
      class TestClass {}
      const metadataKey = 'test-key';
      const metadataValue = 'test-value';

      // Act: Define metadata
      defineMetadata(metadataKey, metadataValue, TestClass.prototype);

      // Assert: Metadata should be retrievable
      const retrievedValue = Reflect.getMetadata(metadataKey, TestClass.prototype);
      expect(retrievedValue).toBe(metadataValue);
    });

    /**
     * Test case: defineMetadata should work with Symbol keys
     *
     * This test validates that Symbol keys can be used for metadata,
     * which helps avoid key collisions.
     */
    it('should define metadata with Symbol keys', () => {
      // Arrange: Create test setup with Symbol key
      class TestClass {}
      const symbolKey = Symbol('unique-symbol-key');
      const metadataValue = { type: 'symbol-metadata', unique: true };

      // Act: Define metadata with Symbol key
      defineMetadata(symbolKey, metadataValue, TestClass);

      // Assert: Should be retrievable with the same Symbol
      expect(getMetadata(symbolKey, TestClass)).toEqual(metadataValue);
    });

    /**
     * Test case: defineMetadata should handle various value types
     *
     * This test ensures the function correctly stores different types of
     * metadata values including primitives, objects, arrays, and functions.
     */
    it('should handle various metadata value types', () => {
      class TestClass {}

      // Test with different value types
      const testCases = [
        { key: 'string-value', value: 'hello world' },
        { key: 'number-value', value: 42 },
        { key: 'boolean-value', value: true },
        { key: 'null-value', value: null },
        { key: 'undefined-value', value: undefined },
        { key: 'object-value', value: { name: 'test', count: 5 } },
        { key: 'array-value', value: [1, 2, 'three', { four: 4 }] },
        { key: 'function-value', value: () => 'test function' },
        { key: 'date-value', value: new Date('2023-01-01') },
        { key: 'regex-value', value: /test-pattern/gi },
      ];

      // Act: Define metadata for each test case
      testCases.forEach(({ key, value }) => {
        defineMetadata(key, value, TestClass);
      });

      // Assert: All values should be retrievable and unchanged
      testCases.forEach(({ key, value }) => {
        const retrieved = getMetadata(key, TestClass);
        if (typeof value === 'object' && value !== null) {
          expect(retrieved).toEqual(value);
        } else {
          expect(retrieved).toBe(value);
        }
      });
    });
  });

  describe('Property-specific Metadata', () => {
    /**
     * Test case: defineMetadata should define metadata on specific properties
     *
     * This test validates defining metadata that is associated with specific
     * class properties rather than the class itself.
     */
    it('should define metadata on class properties', () => {
      // Arrange: Create a class with properties
      class UserClass {
        username: string = '';
        email: string = '';
        age: number = 0;
      }

      const usernameMetadata = { type: 'string', required: true, minLength: 3 };
      const emailMetadata = { type: 'email', required: true, validation: 'email' };
      const ageMetadata = { type: 'number', required: false, min: 0, max: 150 };

      // Act: Define metadata on specific properties
      defineMetadata('validation', usernameMetadata, UserClass.prototype, 'username');
      defineMetadata('validation', emailMetadata, UserClass.prototype, 'email');
      defineMetadata('validation', ageMetadata, UserClass.prototype, 'age');

      // Assert: Each property should have its own metadata
      expect(getMetadata('validation', UserClass.prototype, 'username')).toEqual(usernameMetadata);
      expect(getMetadata('validation', UserClass.prototype, 'email')).toEqual(emailMetadata);
      expect(getMetadata('validation', UserClass.prototype, 'age')).toEqual(ageMetadata);
    });

    /**
     * Test case: defineMetadata should distinguish between class and property metadata
     *
     * This test ensures that metadata defined on a class is separate from
     * metadata defined on its properties, even with the same key.
     */
    it('should distinguish between class and property metadata', () => {
      // Arrange: Create a test class
      class TestClass {
        testProperty: string = 'test';
      }

      const classLevelMetadata = { scope: 'class', entity: true };
      const propertyLevelMetadata = { scope: 'property', column: 'test_column' };
      const metadataKey = 'config';

      // Act: Define metadata on both class and property with same key
      defineMetadata(metadataKey, classLevelMetadata, TestClass);
      defineMetadata(metadataKey, propertyLevelMetadata, TestClass.prototype, 'testProperty');

      // Assert: Should retrieve different metadata for class vs property
      expect(getMetadata(metadataKey, TestClass)).toEqual(classLevelMetadata);
      expect(getMetadata(metadataKey, TestClass.prototype, 'testProperty')).toEqual(
        propertyLevelMetadata
      );
    });
  });

  describe('Metadata Overriding', () => {
    /**
     * Test case: defineMetadata should override existing metadata
     *
     * This test validates that defining metadata with an existing key
     * replaces the previous value.
     */
    it('should override existing metadata with same key', () => {
      // Arrange: Create class with initial metadata
      class TestClass {}
      const metadataKey = 'version';
      const initialMetadata = { version: '1.0.0', stable: false };
      const updatedMetadata = { version: '2.0.0', stable: true, features: ['new-api'] };

      // Act: Define initial metadata, then override it
      defineMetadata(metadataKey, initialMetadata, TestClass);
      expect(getMetadata(metadataKey, TestClass)).toEqual(initialMetadata);

      defineMetadata(metadataKey, updatedMetadata, TestClass);

      // Assert: Should retrieve the updated metadata
      expect(getMetadata(metadataKey, TestClass)).toEqual(updatedMetadata);
      expect(getMetadata(metadataKey, TestClass)).not.toEqual(initialMetadata);
    });

    /**
     * Test case: defineMetadata should allow multiple keys on same target
     *
     * This test validates that multiple metadata keys can be defined
     * on the same target without interference.
     */
    it('should allow multiple metadata keys on same target', () => {
      // Arrange: Create test class
      class TestClass {}

      const metadataEntries = {
        config: { setting: 'value1' },
        permissions: ['read', 'write'],
        audit: { enabled: true, level: 'info' },
        cache: { ttl: 300, strategy: 'lru' },
      };

      // Act: Define multiple metadata entries
      Object.entries(metadataEntries).forEach(([key, value]) => {
        defineMetadata(key, value, TestClass);
      });

      // Assert: All metadata should be retrievable independently
      Object.entries(metadataEntries).forEach(([key, expectedValue]) => {
        expect(getMetadata(key, TestClass)).toEqual(expectedValue);
      });

      // Verify all keys are present
      const allKeys = Reflect.getMetadataKeys(TestClass);
      expect(allKeys).toHaveLength(Object.keys(metadataEntries).length);
      Object.keys(metadataEntries).forEach((key) => {
        expect(allKeys).toContain(key);
      });
    });
  });

  describe('Inheritance Scenarios', () => {
    /**
     * Test case: defineMetadata should work with inheritance hierarchies
     *
     * This test validates metadata definition in inheritance scenarios,
     * including overriding parent metadata.
     */
    it('should work with class inheritance', () => {
      // Arrange: Create inheritance hierarchy
      class ParentClass {}
      class ChildClass extends ParentClass {}
      class GrandchildClass extends ChildClass {}

      const parentMetadata = { level: 'parent', permissions: ['read'] };
      const childMetadata = { level: 'child', permissions: ['read', 'write'] };
      const grandchildMetadata = { level: 'grandchild', permissions: ['read', 'write', 'admin'] };

      // Act: Define metadata at each level
      defineMetadata('hierarchy', parentMetadata, ParentClass);
      defineMetadata('hierarchy', childMetadata, ChildClass);
      defineMetadata('hierarchy', grandchildMetadata, GrandchildClass);

      // Assert: Each class should have its own metadata, with inheritance working
      expect(getMetadata('hierarchy', ParentClass)).toEqual(parentMetadata);
      expect(getMetadata('hierarchy', ChildClass)).toEqual(childMetadata);
      expect(getMetadata('hierarchy', GrandchildClass)).toEqual(grandchildMetadata);

      // Child should not see grandchild metadata, but grandchild can see child metadata if child metadata is removed
      expect(getMetadata('hierarchy', ChildClass)).not.toEqual(grandchildMetadata);
    });

    /**
     * Test case: defineMetadata should allow child classes to override parent metadata
     *
     * This test validates that child classes can override metadata defined
     * by their parent classes.
     */
    it('should allow child classes to override parent metadata', () => {
      // Arrange: Create inheritance with parent metadata
      class BaseController {}
      class UserController extends BaseController {}

      const baseConfig = { timeout: 5000, retries: 3, auth: false };
      const userConfig = { timeout: 10000, retries: 5, auth: true, validation: true };

      // Act: Define metadata on parent, then override on child
      defineMetadata('controller-config', baseConfig, BaseController);
      defineMetadata('controller-config', userConfig, UserController);

      // Assert: Child should have its own metadata, parent unchanged
      expect(getMetadata('controller-config', BaseController)).toEqual(baseConfig);
      expect(getMetadata('controller-config', UserController)).toEqual(userConfig);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test case: defineMetadata should handle edge case keys
     *
     * This test validates behavior with unusual but valid key types.
     */
    it('should handle various key types', () => {
      class TestClass {}

      // Test with different key types (TypeScript allows `any` for metadata keys)
      const testCases = [
        { key: '', value: 'empty string key' },
        { key: ' ', value: 'space key' },
        { key: '123', value: 'numeric string key' },
        { key: 0, value: 'zero number key' },
        { key: 42, value: 'number key' },
        { key: true, value: 'boolean key' },
        { key: {}, value: 'object key' },
        { key: [], value: 'array key' },
      ];

      // Act & Assert: Each key type should work
      testCases.forEach(({ key, value }) => {
        expect(() => defineMetadata(key, value, TestClass)).not.toThrow();
        expect(getMetadata(key, TestClass)).toBe(value);
      });
    });

    /**
     * Test case: defineMetadata should work with class instances
     *
     * This test ensures metadata can be defined on class instances
     * as well as constructor functions.
     */
    it('should work with class instances', () => {
      // Arrange: Create class and instance
      class TestClass {
        instanceId: string;
        constructor(id: string) {
          this.instanceId = id;
        }
      }

      const instance1 = new TestClass('instance-1');
      const instance2 = new TestClass('instance-2');

      const instance1Metadata = { instanceSpecific: true, id: 'meta-1' };
      const instance2Metadata = { instanceSpecific: true, id: 'meta-2' };
      const classMetadata = { classLevel: true, shared: true };

      // Act: Define metadata on instances and class
      defineMetadata('instance-config', instance1Metadata, instance1);
      defineMetadata('instance-config', instance2Metadata, instance2);
      defineMetadata('class-config', classMetadata, TestClass);

      // Assert: Each instance should have its own metadata
      expect(getMetadata('instance-config', instance1)).toEqual(instance1Metadata);
      expect(getMetadata('instance-config', instance2)).toEqual(instance2Metadata);
      expect(getMetadata('class-config', TestClass)).toEqual(classMetadata);

      // Instances shouldn't interfere with each other
      expect(getMetadata('instance-config', instance1)).not.toEqual(instance2Metadata);
      expect(getMetadata('instance-config', instance2)).not.toEqual(instance1Metadata);
    });
  });

  describe('Complex Metadata Structures', () => {
    /**
     * Test case: defineMetadata should handle complex nested metadata
     *
     * This test validates that complex, deeply nested metadata structures
     * are stored and retrieved correctly.
     */
    it('should handle complex nested metadata structures', () => {
      // Arrange: Create complex metadata structure
      class APIEndpoint {}

      const complexMetadata = {
        route: {
          method: 'POST',
          path: '/api/v1/users/:id',
          parameters: {
            path: {
              id: { type: 'string', required: true, pattern: /^[0-9]+$/ },
            },
            query: {
              include: { type: 'array', items: 'string', optional: true },
              format: { type: 'enum', values: ['json', 'xml'], default: 'json' },
            },
            body: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'email', required: true },
                  age: { type: 'number', min: 0, max: 150, optional: true },
                },
              },
            },
          },
          responses: {
            200: { description: 'Success', schema: 'UserResponse' },
            400: { description: 'Bad Request', schema: 'ErrorResponse' },
            404: { description: 'Not Found', schema: 'ErrorResponse' },
          },
          security: {
            authentication: { required: true, type: 'bearer' },
            authorization: { roles: ['user', 'admin'], permissions: ['user:update'] },
          },
          middleware: ['validateAuth', 'rateLimit', 'logging'],
          cache: {
            enabled: false,
            ttl: 0,
            tags: ['user-data'],
          },
        },
      };

      // Act: Define complex metadata
      defineMetadata('api-config', complexMetadata, APIEndpoint);

      // Assert: Complex structure should be preserved
      const retrieved = getMetadata('api-config', APIEndpoint);
      expect(retrieved).toEqual(complexMetadata);

      // Verify deep properties are accessible
      expect(retrieved.route.method).toBe('POST');
      expect(retrieved.route.parameters.path.id.type).toBe('string');
      expect(retrieved.route.security.authentication.required).toBe(true);
      expect(retrieved.route.middleware).toContain('validateAuth');
    });
  });
});
