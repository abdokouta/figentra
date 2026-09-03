import { hasMetadata } from '@/has-metadata';
import { defineMetadata } from '@/define-metadata';
import { clearMetadata } from '@/clear-metadata';

describe('hasMetadata', () => {
  describe('Basic Functionality', () => {
    /**
     * Test case: hasMetadata should return true when metadata exists on target
     *
     * This test validates the core functionality of detecting metadata presence.
     */
    it('should return true when metadata is defined on target', () => {
      // Arrange: Create a class with metadata
      const metadataKey = Symbol('test-key');
      const target = class TestClass {};

      Reflect.defineMetadata(metadataKey, 'test-value', target);

      // Act & Assert: Should detect the metadata
      expect(hasMetadata(metadataKey, target)).toBe(true);
    });

    /**
     * Test case: hasMetadata should return false when no metadata exists
     *
     * This test validates that the function correctly identifies when metadata is absent.
     */
    it('should return false when no metadata is defined', () => {
      // Arrange: Create a clean class with no metadata
      const metadataKey = Symbol('nonexistent-key');
      const target = class CleanClass {};

      // Act & Assert: Should not detect any metadata
      expect(hasMetadata(metadataKey, target)).toBe(false);
    });

    /**
     * Test case: hasMetadata should work with various key types
     *
     * This test validates that different types of metadata keys are supported.
     */
    it('should work with various metadata key types', () => {
      // Arrange: Create a class and test with different key types
      class TestClass {}

      const stringKey = 'string-key';
      const symbolKey = Symbol('symbol-key');
      const numberKey = 42;
      const objectKey = { type: 'object-key' };

      // Define metadata with different key types
      defineMetadata(stringKey, 'string-value', TestClass);
      defineMetadata(symbolKey, 'symbol-value', TestClass);
      defineMetadata(numberKey, 'number-value', TestClass);
      defineMetadata(objectKey, 'object-value', TestClass);

      // Act & Assert: Should detect all key types
      expect(hasMetadata(stringKey, TestClass)).toBe(true);
      expect(hasMetadata(symbolKey, TestClass)).toBe(true);
      expect(hasMetadata(numberKey, TestClass)).toBe(true);
      expect(hasMetadata(objectKey, TestClass)).toBe(true);

      // Should not detect non-existent keys
      expect(hasMetadata('non-existent', TestClass)).toBe(false);
      expect(hasMetadata(Symbol('non-existent'), TestClass)).toBe(false);
    });
  });

  describe('Inheritance and Prototype Chain', () => {
    /**
     * Test case: hasMetadata should detect inherited metadata from parent classes
     *
     * This test validates that metadata defined on parent classes is detected
     * when checking child classes.
     */
    it('should return true when metadata is defined on parent class', () => {
      // Arrange: Create inheritance hierarchy with parent metadata
      const metadataKey = Symbol('inheritance-key');
      class ParentClass {}
      class ChildClass extends ParentClass {}

      Reflect.defineMetadata(metadataKey, 'parent-value', ParentClass);

      // Act & Assert: Child should detect parent's metadata
      expect(hasMetadata(metadataKey, ChildClass)).toBe(true);
      expect(hasMetadata(metadataKey, ParentClass)).toBe(true);
    });

    /**
     * Test case: hasMetadata should work with deep inheritance hierarchies
     *
     * This test validates metadata detection through multiple inheritance levels.
     */
    it('should work with multiple levels of inheritance', () => {
      // Arrange: Create deep inheritance hierarchy
      const metadataKey = 'deep-inheritance';

      class GrandParentClass {}
      class ParentClass extends GrandParentClass {}
      class ChildClass extends ParentClass {}
      class GrandChildClass extends ChildClass {}

      defineMetadata(metadataKey, 'grandparent-value', GrandParentClass);

      // Act & Assert: All levels should detect the metadata
      expect(hasMetadata(metadataKey, GrandParentClass)).toBe(true);
      expect(hasMetadata(metadataKey, ParentClass)).toBe(true);
      expect(hasMetadata(metadataKey, ChildClass)).toBe(true);
      expect(hasMetadata(metadataKey, GrandChildClass)).toBe(true);
    });

    /**
     * Test case: hasMetadata should prioritize child metadata over parent metadata
     *
     * This test validates that child classes can override parent metadata
     * and both are detectable.
     */
    it('should detect metadata when both parent and child define the same key', () => {
      // Arrange: Create inheritance with overriding metadata
      const metadataKey = 'override-test';

      class BaseClass {}
      class DerivedClass extends BaseClass {}

      defineMetadata(metadataKey, 'base-value', BaseClass);
      defineMetadata(metadataKey, 'derived-value', DerivedClass);

      // Act & Assert: Both should detect the metadata
      expect(hasMetadata(metadataKey, BaseClass)).toBe(true);
      expect(hasMetadata(metadataKey, DerivedClass)).toBe(true);
    });
  });

  describe('Property-specific Metadata', () => {
    /**
     * Test case: hasMetadata should detect metadata on specific properties
     *
     * This test validates detection of property-level metadata.
     */
    it('should detect metadata on class properties', () => {
      // Arrange: Create a class with property metadata
      class TestClass {
        propertyWithMetadata: string = 'test';
        propertyWithoutMetadata: string = 'test';
      }

      const metadataKey = 'property-metadata';
      defineMetadata(metadataKey, 'property-value', TestClass.prototype, 'propertyWithMetadata');

      // Act & Assert: Should detect metadata on specific property
      expect(hasMetadata(metadataKey, TestClass.prototype, 'propertyWithMetadata')).toBe(true);
      expect(hasMetadata(metadataKey, TestClass.prototype, 'propertyWithoutMetadata')).toBe(false);
    });

    /**
     * Test case: hasMetadata should distinguish between class and property metadata
     *
     * This test ensures that class-level and property-level metadata are distinct.
     */
    it('should distinguish between class and property metadata', () => {
      // Arrange: Create class with metadata at both levels
      class TestClass {
        testProperty: string = 'test';
      }

      const metadataKey = 'same-key';
      defineMetadata(metadataKey, 'class-value', TestClass);
      defineMetadata(metadataKey, 'property-value', TestClass.prototype, 'testProperty');

      // Act & Assert: Should distinguish between class and property metadata
      expect(hasMetadata(metadataKey, TestClass)).toBe(true); // Class level
      expect(hasMetadata(metadataKey, TestClass.prototype, 'testProperty')).toBe(true); // Property level
      expect(hasMetadata(metadataKey, TestClass.prototype)).toBe(false); // No metadata on prototype itself
    });

    /**
     * Test case: hasMetadata should work with inherited property metadata
     *
     * This test validates detection of property metadata through inheritance.
     */
    it('should detect inherited property metadata', () => {
      // Arrange: Create inheritance with property metadata
      class BaseClass {
        sharedProperty: string = 'base';
      }
      class DerivedClass extends BaseClass {
        ownProperty: string = 'derived';
      }

      const sharedMetadataKey = 'shared-property-meta';
      const ownMetadataKey = 'own-property-meta';

      defineMetadata(sharedMetadataKey, 'shared-value', BaseClass.prototype, 'sharedProperty');
      defineMetadata(ownMetadataKey, 'own-value', DerivedClass.prototype, 'ownProperty');

      // Act & Assert: Inheritance should work for property metadata
      expect(hasMetadata(sharedMetadataKey, DerivedClass.prototype, 'sharedProperty')).toBe(true);
      expect(hasMetadata(ownMetadataKey, DerivedClass.prototype, 'ownProperty')).toBe(true);
      expect(hasMetadata(ownMetadataKey, BaseClass.prototype, 'ownProperty')).toBe(false);
    });
  });

  describe('Dynamic Metadata Operations', () => {
    /**
     * Test case: hasMetadata should reflect metadata state changes
     *
     * This test validates that metadata detection updates when metadata is added or removed.
     */
    it('should reflect changes when metadata is added or removed', () => {
      // Arrange: Create a class for dynamic testing
      class DynamicClass {}
      const metadataKey = 'dynamic-key';

      // Initially no metadata
      expect(hasMetadata(metadataKey, DynamicClass)).toBe(false);

      // Add metadata
      defineMetadata(metadataKey, 'dynamic-value', DynamicClass);
      expect(hasMetadata(metadataKey, DynamicClass)).toBe(true);

      // Remove metadata
      clearMetadata(metadataKey, DynamicClass);
      expect(hasMetadata(metadataKey, DynamicClass)).toBe(false);
    });

    /**
     * Test case: hasMetadata should handle metadata updates correctly
     *
     * This test validates that updating metadata doesn't affect detection.
     */
    it('should continue to detect metadata after updates', () => {
      // Arrange: Create class with initial metadata
      class UpdateClass {}
      const metadataKey = 'update-key';

      defineMetadata(metadataKey, 'initial-value', UpdateClass);
      expect(hasMetadata(metadataKey, UpdateClass)).toBe(true);

      // Update metadata value
      defineMetadata(metadataKey, 'updated-value', UpdateClass);

      // Act & Assert: Should still detect the metadata
      expect(hasMetadata(metadataKey, UpdateClass)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test case: hasMetadata should handle null and undefined keys gracefully
     *
     * This test ensures the function behaves correctly with edge case keys.
     */
    it('should handle null and undefined keys gracefully', () => {
      // Arrange: Create a test class
      class TestClass {}

      // Act & Assert: Should handle edge case keys without throwing
      expect(() => hasMetadata(null, TestClass)).not.toThrow();
      expect(() => hasMetadata(undefined, TestClass)).not.toThrow();

      // These should return false (no metadata with null/undefined keys)
      expect(hasMetadata(null, TestClass)).toBe(false);
      expect(hasMetadata(undefined, TestClass)).toBe(false);
    });

    /**
     * Test case: hasMetadata should work with class instances
     *
     * This test ensures the function works with class instances, not just constructors.
     */
    it('should work with class instances', () => {
      // Arrange: Create class and instances
      class TestClass {
        instanceProperty: string = 'test';
      }

      const instance1 = new TestClass();
      const instance2 = new TestClass();

      const metadataKey = 'instance-metadata';

      // Define metadata on instances
      defineMetadata(metadataKey, 'instance1-value', instance1);

      // Act & Assert: Should work with instances
      expect(hasMetadata(metadataKey, instance1)).toBe(true);
      expect(hasMetadata(metadataKey, instance2)).toBe(false);

      // Should also work with instance properties
      defineMetadata('property-meta', 'prop-value', instance1, 'instanceProperty');
      expect(hasMetadata('property-meta', instance1, 'instanceProperty')).toBe(true);
      expect(hasMetadata('property-meta', instance2, 'instanceProperty')).toBe(false);
    });

    /**
     * Test case: hasMetadata should handle complex object keys
     *
     * This test validates behavior with complex object keys.
     */
    it('should work with complex object keys', () => {
      // Arrange: Create complex keys
      class TestClass {}

      const arrayKey = ['array', 'key'];
      const objectKey = { type: 'object', id: 123 };
      const functionKey = function namedFunction() {};
      const dateKey = new Date('2023-01-01');

      // Define metadata with complex keys
      defineMetadata(arrayKey, 'array-value', TestClass);
      defineMetadata(objectKey, 'object-value', TestClass);
      defineMetadata(functionKey, 'function-value', TestClass);
      defineMetadata(dateKey, 'date-value', TestClass);

      // Act & Assert: Should detect complex key types
      expect(hasMetadata(arrayKey, TestClass)).toBe(true);
      expect(hasMetadata(objectKey, TestClass)).toBe(true);
      expect(hasMetadata(functionKey, TestClass)).toBe(true);
      expect(hasMetadata(dateKey, TestClass)).toBe(true);

      // Similar but different keys should not match
      expect(hasMetadata(['array', 'key'], TestClass)).toBe(false); // Different array instance
      expect(hasMetadata({ type: 'object', id: 123 }, TestClass)).toBe(false); // Different object instance
    });

    /**
     * Test case: hasMetadata should handle concurrent operations
     *
     * This test validates thread safety and consistency in concurrent scenarios.
     */
    it('should handle rapid metadata operations consistently', () => {
      // Arrange: Create test class
      class ConcurrentClass {}
      const metadataKey = 'concurrent-key';

      // Perform rapid operations
      for (let i = 0; i < 100; i++) {
        defineMetadata(`${metadataKey}-${i}`, `value-${i}`, ConcurrentClass);
      }

      // Act & Assert: All metadata should be detectable
      for (let i = 0; i < 100; i++) {
        expect(hasMetadata(`${metadataKey}-${i}`, ConcurrentClass)).toBe(true);
      }

      // Non-existent keys should still return false
      expect(hasMetadata('non-existent-key', ConcurrentClass)).toBe(false);
    });
  });

  describe('Performance and Consistency', () => {
    /**
     * Test case: hasMetadata should be consistent with getMetadata
     *
     * This test ensures that hasMetadata and getMetadata are consistent.
     */
    it('should be consistent with getMetadata results', () => {
      // Arrange: Create test scenarios
      class ConsistencyClass {}

      const existingKey = 'existing-metadata';
      const missingKey = 'missing-metadata';

      defineMetadata(existingKey, 'some-value', ConsistencyClass);

      // Act & Assert: hasMetadata should be consistent with getMetadata !== undefined
      const hasExisting = hasMetadata(existingKey, ConsistencyClass);
      const hasMissing = hasMetadata(missingKey, ConsistencyClass);

      expect(hasExisting).toBe(true);
      expect(hasMissing).toBe(false);

      // This consistency should hold even for falsy values
      defineMetadata('falsy-key', false, ConsistencyClass);
      expect(hasMetadata('falsy-key', ConsistencyClass)).toBe(true);

      defineMetadata('null-key', null, ConsistencyClass);
      expect(hasMetadata('null-key', ConsistencyClass)).toBe(true);

      defineMetadata('zero-key', 0, ConsistencyClass);
      expect(hasMetadata('zero-key', ConsistencyClass)).toBe(true);
    });
  });
});
