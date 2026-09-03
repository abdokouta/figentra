import { getMetadata } from '@/get-metadata';

describe('getMetadata', () => {
  // Clean up metadata after each test to prevent interference
  beforeEach(() => {
    // Clear any residual metadata from previous tests
  });

  describe('Basic Functionality', () => {
    /**
     * Test case: getMetadata should return undefined when no metadata exists
     *
     * This test validates the function's behavior when attempting to retrieve
     * non-existent metadata, ensuring graceful handling of missing values.
     */
    it('should return undefined when no metadata is defined', () => {
      // Arrange: Create a fresh class with no metadata
      class TestClass {}
      const metadataKey = Symbol('nonexistent-key');

      // Act: Attempt to retrieve non-existent metadata
      const result = getMetadata(metadataKey, TestClass);

      // Assert: Should return undefined for missing metadata
      expect(result).toBeUndefined();
    });

    /**
     * Test case: getMetadata should return the correct value when metadata exists
     *
     * This test validates the core functionality of retrieving metadata values
     * that have been previously defined on a target object.
     */
    it('should return metadata when it is defined on the target', () => {
      // Arrange: Set up metadata on a test class
      const metadataKey = Symbol('test-key');
      const metadataValue = 'test-value';
      class TestClass {}

      Reflect.defineMetadata(metadataKey, metadataValue, TestClass);

      // Act: Retrieve the metadata
      const result = getMetadata<string>(metadataKey, TestClass);

      // Assert: Should return the exact metadata value
      expect(result).toBe(metadataValue);
    });

    /**
     * Test case: getMetadata should work with various metadata value types
     *
     * This test ensures the function correctly handles different types of
     * metadata values including primitives, objects, arrays, and functions.
     */
    it('should handle various metadata value types', () => {
      class TestClass {}

      // Test with string value
      const stringKey = 'string-key';
      const stringValue = 'hello world';
      Reflect.defineMetadata(stringKey, stringValue, TestClass);
      expect(getMetadata<string>(stringKey, TestClass)).toBe(stringValue);

      // Test with number value
      const numberKey = 'number-key';
      const numberValue = 42;
      Reflect.defineMetadata(numberKey, numberValue, TestClass);
      expect(getMetadata<number>(numberKey, TestClass)).toBe(numberValue);

      // Test with boolean value
      const booleanKey = 'boolean-key';
      const booleanValue = true;
      Reflect.defineMetadata(booleanKey, booleanValue, TestClass);
      expect(getMetadata<boolean>(booleanKey, TestClass)).toBe(booleanValue);

      // Test with object value
      const objectKey = 'object-key';
      const objectValue = { name: 'test', count: 5 };
      Reflect.defineMetadata(objectKey, objectValue, TestClass);
      expect(getMetadata<typeof objectValue>(objectKey, TestClass)).toEqual(objectValue);

      // Test with array value
      const arrayKey = 'array-key';
      const arrayValue = [1, 2, 3, 'test'];
      Reflect.defineMetadata(arrayKey, arrayValue, TestClass);
      expect(getMetadata<typeof arrayValue>(arrayKey, TestClass)).toEqual(arrayValue);

      // Test with function value
      const functionKey = 'function-key';
      const functionValue = () => 'test function';
      Reflect.defineMetadata(functionKey, functionValue, TestClass);
      expect(getMetadata<typeof functionValue>(functionKey, TestClass)).toBe(functionValue);
    });
  });

  describe('Property-specific Metadata', () => {
    /**
     * Test case: getMetadata should retrieve property-specific metadata
     *
     * This test validates the function's ability to work with metadata
     * associated with specific properties rather than the class itself.
     */
    it('should retrieve metadata from class properties', () => {
      class TestClass {
        testProperty: string = 'test';
        anotherProperty: number = 42;
      }

      // Define metadata on specific properties
      const propertyKey = 'testProperty';
      const metadataKey = 'property-meta';
      const metadataValue = { type: 'string', required: true };

      Reflect.defineMetadata(metadataKey, metadataValue, TestClass.prototype, propertyKey);

      // Act: Retrieve property-specific metadata
      const result = getMetadata<typeof metadataValue>(
        metadataKey,
        TestClass.prototype,
        propertyKey
      );

      // Assert: Should return the property-specific metadata
      expect(result).toEqual(metadataValue);
    });

    /**
     * Test case: getMetadata should not confuse class and property metadata
     *
     * This test ensures that metadata defined on a class is separate from
     * metadata defined on its properties.
     */
    it('should distinguish between class and property metadata', () => {
      class TestClass {
        testProperty: string = 'test';
      }

      const metadataKey = 'config';
      const classMetadata = { level: 'class' };
      const propertyMetadata = { level: 'property' };

      // Define metadata on both class and property with same key
      Reflect.defineMetadata(metadataKey, classMetadata, TestClass);
      Reflect.defineMetadata(metadataKey, propertyMetadata, TestClass.prototype, 'testProperty');

      // Act & Assert: Should retrieve different metadata for class vs property
      expect(getMetadata(metadataKey, TestClass)).toEqual(classMetadata);
      expect(getMetadata(metadataKey, TestClass.prototype, 'testProperty')).toEqual(
        propertyMetadata
      );
    });
  });

  describe('Inheritance and Prototype Chain', () => {
    /**
     * Test case: getMetadata should retrieve inherited metadata from parent classes
     *
     * This test validates that metadata defined on parent classes is accessible
     * from child classes through the prototype chain.
     */
    it('should retrieve metadata from parent classes', () => {
      const metadataKey = 'inheritance-test';
      const parentMetadata = { source: 'parent' };

      // Define parent class with metadata
      class ParentClass {}
      Reflect.defineMetadata(metadataKey, parentMetadata, ParentClass);

      // Define child class extending parent
      class ChildClass extends ParentClass {}

      // Act: Retrieve metadata from child class
      const result = getMetadata<typeof parentMetadata>(metadataKey, ChildClass);

      // Assert: Should retrieve metadata from parent
      expect(result).toEqual(parentMetadata);
    });

    /**
     * Test case: getMetadata should prioritize child metadata over parent metadata
     *
     * This test ensures that when both parent and child classes define metadata
     * with the same key, the child's metadata takes precedence.
     */
    it('should prioritize child metadata over parent metadata', () => {
      const metadataKey = 'override-test';
      const parentMetadata = { source: 'parent', priority: 1 };
      const childMetadata = { source: 'child', priority: 2 };

      // Define parent class with metadata
      class ParentClass {}
      Reflect.defineMetadata(metadataKey, parentMetadata, ParentClass);

      // Define child class with overriding metadata
      class ChildClass extends ParentClass {}
      Reflect.defineMetadata(metadataKey, childMetadata, ChildClass);

      // Act: Retrieve metadata from child class
      const result = getMetadata<typeof childMetadata>(metadataKey, ChildClass);

      // Assert: Should return child metadata, not parent
      expect(result).toEqual(childMetadata);
      expect(result?.source).toBe('child');
    });

    /**
     * Test case: getMetadata should work with deep inheritance hierarchies
     *
     * This test validates metadata retrieval through multiple levels of inheritance.
     */
    it('should work with multiple levels of inheritance', () => {
      const metadataKey = 'deep-inheritance';
      const grandparentMetadata = { level: 'grandparent' };

      // Define inheritance chain
      class GrandparentClass {}
      Reflect.defineMetadata(metadataKey, grandparentMetadata, GrandparentClass);

      class ParentClass extends GrandparentClass {}
      class ChildClass extends ParentClass {}

      // Act: Retrieve metadata from deeply inherited class
      const result = getMetadata<typeof grandparentMetadata>(metadataKey, ChildClass);

      // Assert: Should retrieve metadata from the inheritance chain
      expect(result).toEqual(grandparentMetadata);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test case: getMetadata should handle null and undefined keys gracefully
     *
     * This test ensures the function behaves correctly with invalid keys.
     */
    it('should handle invalid metadata keys', () => {
      class TestClass {}

      // Test with null key (TypeScript allows any as key type)
      expect(getMetadata(null, TestClass)).toBeUndefined();

      // Test with undefined key
      expect(getMetadata(undefined, TestClass)).toBeUndefined();
    });

    /**
     * Test case: getMetadata should work with symbol keys
     *
     * This test validates that the function correctly handles Symbol keys,
     * which are commonly used for metadata to avoid key collisions.
     */
    it('should work with Symbol metadata keys', () => {
      class TestClass {}
      const symbolKey = Symbol('test-symbol');
      const metadataValue = 'symbol-metadata';

      Reflect.defineMetadata(symbolKey, metadataValue, TestClass);

      const result = getMetadata<string>(symbolKey, TestClass);
      expect(result).toBe(metadataValue);
    });

    /**
     * Test case: getMetadata should work with instances, not just constructors
     *
     * This test ensures metadata can be retrieved from class instances as well
     * as constructor functions.
     */
    it('should work with class instances', () => {
      class TestClass {}
      const instance = new TestClass();
      const metadataKey = 'instance-test';
      const metadataValue = { type: 'instance' };

      // Define metadata on the instance
      Reflect.defineMetadata(metadataKey, metadataValue, instance);

      // Act: Retrieve metadata from instance
      const result = getMetadata<typeof metadataValue>(metadataKey, instance);

      // Assert: Should retrieve instance metadata
      expect(result).toEqual(metadataValue);
    });
  });

  describe('Type Safety', () => {
    /**
     * Test case: getMetadata should provide proper TypeScript type inference
     *
     * This test validates that the generic type parameter works correctly
     * for providing type safety at compile time.
     */
    it('should provide type-safe metadata retrieval', () => {
      interface UserMetadata {
        role: string;
        permissions: string[];
        isActive: boolean;
      }

      class UserClass {}
      const metadataKey = 'user-metadata';
      const userMetadata: UserMetadata = {
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        isActive: true,
      };

      Reflect.defineMetadata(metadataKey, userMetadata, UserClass);

      // Act: Retrieve with type parameter
      const result = getMetadata<UserMetadata>(metadataKey, UserClass);

      // Assert: Should return properly typed metadata
      expect(result).toEqual(userMetadata);
      expect(result?.role).toBe('admin');
      expect(result?.permissions).toContain('read');
      expect(result?.isActive).toBe(true);
    });
  });
});
