import { clearMetadata } from '@/clear-metadata';
import { getMetadata } from '@/get-metadata';

describe('clearMetadata', () => {
  describe('Complete Metadata Clearing', () => {
    /**
     * Test case: clearMetadata should remove all metadata from a target object
     *
     * This test validates the core functionality of clearing all metadata
     * when no specific key is provided.
     */
    it('should clear all metadata keys from an object', () => {
      // Arrange: Create a class with multiple metadata entries
      class TestClass {}

      const metadata1 = { key: 'value1', type: 'string' };
      const metadata2 = { key: 'value2', type: 'number' };
      const metadata3 = { key: 'value3', type: 'boolean' };

      Reflect.defineMetadata('meta1', metadata1, TestClass.prototype);
      Reflect.defineMetadata('meta2', metadata2, TestClass.prototype);
      Reflect.defineMetadata('meta3', metadata3, TestClass.prototype);

      // Verify metadata exists before clearing
      expect(Reflect.getMetadataKeys(TestClass.prototype)).toHaveLength(3);

      // Act: Clear all metadata
      clearMetadata(undefined, TestClass.prototype);

      // Assert: All metadata should be removed
      const remainingKeys = Reflect.getMetadataKeys(TestClass.prototype);
      expect(remainingKeys).toHaveLength(0);
      expect(remainingKeys).toEqual([]);
    });

    /**
     * Test case: clearMetadata should handle objects with no metadata gracefully
     *
     * This test ensures the function doesn't fail when attempting to clear
     * metadata from objects that have no metadata defined.
     */
    it('should handle objects with no metadata gracefully', () => {
      // Arrange: Create a class with no metadata
      class EmptyClass {}

      // Verify no metadata exists
      expect(Reflect.getMetadataKeys(EmptyClass)).toHaveLength(0);

      // Act & Assert: Should not throw and should remain empty
      expect(() => clearMetadata(undefined, EmptyClass)).not.toThrow();
      expect(Reflect.getMetadataKeys(EmptyClass)).toHaveLength(0);
    });
  });

  describe('Selective Metadata Clearing', () => {
    /**
     * Test case: clearMetadata should remove only the specified metadata key
     *
     * This test validates selective metadata removal while preserving
     * other metadata entries.
     */
    it('should clear only the specified metadata key', () => {
      // Arrange: Create a class with multiple metadata entries
      class TestClass {}

      const keepMetadata = { keep: true, important: 'data' };
      const removeMetadata = { remove: true, temporary: 'data' };
      const alsoKeepMetadata = { alsoKeep: true, value: 42 };

      Reflect.defineMetadata('keep-this', keepMetadata, TestClass);
      Reflect.defineMetadata('remove-this', removeMetadata, TestClass);
      Reflect.defineMetadata('also-keep-this', alsoKeepMetadata, TestClass);

      // Verify all metadata exists before selective clearing
      expect(Reflect.getMetadataKeys(TestClass)).toHaveLength(3);

      // Act: Clear only the specified metadata
      clearMetadata('remove-this', TestClass);

      // Assert: Only the specified metadata should be removed
      const remainingKeys = Reflect.getMetadataKeys(TestClass);
      expect(remainingKeys).toHaveLength(2);
      expect(remainingKeys).toContain('keep-this');
      expect(remainingKeys).toContain('also-keep-this');
      expect(remainingKeys).not.toContain('remove-this');

      // Verify remaining metadata is intact
      expect(getMetadata('keep-this', TestClass)).toEqual(keepMetadata);
      expect(getMetadata('also-keep-this', TestClass)).toEqual(alsoKeepMetadata);
      expect(getMetadata('remove-this', TestClass)).toBeUndefined();
    });

    /**
     * Test case: clearMetadata should handle non-existent keys gracefully
     *
     * This test ensures the function doesn't fail when attempting to clear
     * a metadata key that doesn't exist.
     */
    it('should handle non-existent metadata keys gracefully', () => {
      // Arrange: Create a class with some metadata
      class TestClass {}
      const existingMetadata = { exists: true };

      Reflect.defineMetadata('existing-key', existingMetadata, TestClass);

      // Act & Assert: Should not throw when clearing non-existent key
      expect(() => clearMetadata('non-existent-key', TestClass)).not.toThrow();

      // Verify existing metadata is unchanged
      expect(getMetadata('existing-key', TestClass)).toEqual(existingMetadata);
      expect(Reflect.getMetadataKeys(TestClass)).toContain('existing-key');
    });
  });

  describe('Property-specific Metadata Clearing', () => {
    /**
     * Test case: clearMetadata should clear metadata from specific properties
     *
     * This test validates clearing metadata that is associated with specific
     * class properties rather than the class itself.
     */
    it('should clear metadata from specific properties', () => {
      // Arrange: Create a class with property metadata
      class TestClass {
        property1: string = 'test1';
        property2: string = 'test2';
      }

      const prop1Metadata = { type: 'string', validation: 'required' };
      const prop2Metadata = { type: 'string', validation: 'optional' };
      const classMetadata = { entity: true };

      Reflect.defineMetadata('prop-meta', prop1Metadata, TestClass.prototype, 'property1');
      Reflect.defineMetadata('prop-meta', prop2Metadata, TestClass.prototype, 'property2');
      Reflect.defineMetadata('class-meta', classMetadata, TestClass);

      // Act: Clear metadata from specific property
      clearMetadata(undefined, TestClass.prototype, 'property1');

      // Assert: Only property1 metadata should be cleared
      expect(getMetadata('prop-meta', TestClass.prototype, 'property1')).toBeUndefined();
      expect(getMetadata('prop-meta', TestClass.prototype, 'property2')).toEqual(prop2Metadata);
      expect(getMetadata('class-meta', TestClass)).toEqual(classMetadata);
    });

    /**
     * Test case: clearMetadata should clear specific metadata keys from specific properties
     *
     * This test validates selective clearing of property metadata.
     */
    it('should clear specific metadata keys from specific properties', () => {
      // Arrange: Create a class with multiple property metadata entries
      class TestClass {
        testProperty: string = 'test';
      }

      const validationMeta = { required: true, minLength: 5 };
      const typeMeta = { type: 'string', nullable: false };
      const displayMeta = { label: 'Test Property', visible: true };

      Reflect.defineMetadata('validation', validationMeta, TestClass.prototype, 'testProperty');
      Reflect.defineMetadata('type', typeMeta, TestClass.prototype, 'testProperty');
      Reflect.defineMetadata('display', displayMeta, TestClass.prototype, 'testProperty');

      // Act: Clear only validation metadata from the property
      clearMetadata('validation', TestClass.prototype, 'testProperty');

      // Assert: Only validation metadata should be cleared
      expect(getMetadata('validation', TestClass.prototype, 'testProperty')).toBeUndefined();
      expect(getMetadata('type', TestClass.prototype, 'testProperty')).toEqual(typeMeta);
      expect(getMetadata('display', TestClass.prototype, 'testProperty')).toEqual(displayMeta);
    });
  });

  describe('Inheritance and Prototype Chain', () => {
    /**
     * Test case: clearMetadata should not affect parent class metadata
     *
     * This test ensures that clearing metadata from a child class doesn't
     * impact metadata defined on parent classes.
     */
    it('should not affect parent class metadata when clearing child metadata', () => {
      // Arrange: Create inheritance hierarchy with metadata
      class ParentClass {}
      class ChildClass extends ParentClass {}

      const parentMetadata = { source: 'parent', level: 1 };
      const childMetadata = { source: 'child', level: 2 };

      Reflect.defineMetadata('hierarchy', parentMetadata, ParentClass);
      Reflect.defineMetadata('hierarchy', childMetadata, ChildClass);
      Reflect.defineMetadata('child-only', { exclusive: true }, ChildClass);

      // Act: Clear metadata from child class
      clearMetadata(undefined, ChildClass);

      // Assert: Parent metadata should remain intact
      expect(getMetadata('hierarchy', ParentClass)).toEqual(parentMetadata);
      expect(getMetadata('hierarchy', ChildClass)).toEqual(parentMetadata); // Inherited from parent
      expect(getMetadata('child-only', ChildClass)).toBeUndefined(); // Should be cleared
    });

    /**
     * Test case: clearMetadata should clear metadata without affecting inheritance
     *
     * This test validates that after clearing direct metadata from a child class,
     * inherited metadata from parent classes remains accessible.
     */
    it('should preserve inherited metadata after clearing direct metadata', () => {
      // Arrange: Create inheritance with both direct and inherited metadata
      class BaseClass {}
      class DerivedClass extends BaseClass {}

      const baseMetadata = { inherited: true, baseValue: 'base' };
      const derivedMetadata = { direct: true, derivedValue: 'derived' };

      Reflect.defineMetadata('config', baseMetadata, BaseClass);
      Reflect.defineMetadata('config', derivedMetadata, DerivedClass);
      Reflect.defineMetadata('extra', { additional: true }, DerivedClass);

      // Verify initial state
      expect(getMetadata('config', DerivedClass)).toEqual(derivedMetadata);

      // Act: Clear all metadata from derived class
      clearMetadata(undefined, DerivedClass);

      // Assert: Should now see inherited metadata
      expect(getMetadata('config', DerivedClass)).toEqual(baseMetadata);
      expect(getMetadata('extra', DerivedClass)).toBeUndefined();
      expect(getMetadata('config', BaseClass)).toEqual(baseMetadata); // Unchanged
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test case: clearMetadata should handle invalid targets gracefully
     *
     * This test ensures the function behaves correctly with invalid target parameters.
     */
    it('should handle invalid targets gracefully', () => {
      // Act & Assert: Should not throw with undefined target
      expect(() => clearMetadata('any-key', undefined)).not.toThrow();
      expect(() => clearMetadata(undefined, undefined)).not.toThrow();
    });

    /**
     * Test case: clearMetadata should work with Symbol keys
     *
     * This test validates that the function correctly handles Symbol metadata keys.
     */
    it('should work with Symbol metadata keys', () => {
      // Arrange: Create metadata with Symbol keys
      class TestClass {}
      const symbolKey1 = Symbol('symbol-meta-1');
      const symbolKey2 = Symbol('symbol-meta-2');

      const symbolMetadata1 = { symbol: true, value: 1 };
      const symbolMetadata2 = { symbol: true, value: 2 };

      Reflect.defineMetadata(symbolKey1, symbolMetadata1, TestClass);
      Reflect.defineMetadata(symbolKey2, symbolMetadata2, TestClass);

      // Act: Clear specific Symbol key
      clearMetadata(symbolKey1, TestClass);

      // Assert: Only the specified Symbol metadata should be cleared
      expect(getMetadata(symbolKey1, TestClass)).toBeUndefined();
      expect(getMetadata(symbolKey2, TestClass)).toEqual(symbolMetadata2);
    });

    /**
     * Test case: clearMetadata should work with mixed key types
     *
     * This test validates clearing metadata when using a combination of
     * string, Symbol, and other key types.
     */
    it('should work with mixed metadata key types', () => {
      // Arrange: Create metadata with different key types
      class TestClass {}
      const stringKey = 'string-key';
      const symbolKey = Symbol('symbol-key');
      const numberKey = 42;

      const stringMetadata = { type: 'string' };
      const symbolMetadata = { type: 'symbol' };
      const numberMetadata = { type: 'number' };

      Reflect.defineMetadata(stringKey, stringMetadata, TestClass);
      Reflect.defineMetadata(symbolKey, symbolMetadata, TestClass);
      Reflect.defineMetadata(numberKey, numberMetadata, TestClass);

      // Verify all metadata exists
      expect(Reflect.getMetadataKeys(TestClass)).toHaveLength(3);

      // Act: Clear all metadata
      clearMetadata(undefined, TestClass);

      // Assert: All metadata should be cleared regardless of key type
      expect(Reflect.getMetadataKeys(TestClass)).toHaveLength(0);
      expect(getMetadata(stringKey, TestClass)).toBeUndefined();
      expect(getMetadata(symbolKey, TestClass)).toBeUndefined();
      expect(getMetadata(numberKey, TestClass)).toBeUndefined();
    });

    /**
     * Test case: clearMetadata should work with class instances
     *
     * This test ensures metadata can be cleared from class instances
     * as well as constructor functions.
     */
    it('should work with class instances', () => {
      // Arrange: Create instance with metadata
      class TestClass {}
      const instance = new TestClass();

      const instanceMetadata = { instanceSpecific: true, id: 'instance-1' };
      const classMetadata = { classLevel: true, version: '1.0' };

      Reflect.defineMetadata('instance-meta', instanceMetadata, instance);
      Reflect.defineMetadata('class-meta', classMetadata, TestClass);

      // Act: Clear metadata from instance
      clearMetadata(undefined, instance);

      // Assert: Instance metadata should be cleared, class metadata should remain
      expect(getMetadata('instance-meta', instance)).toBeUndefined();
      expect(getMetadata('class-meta', TestClass)).toEqual(classMetadata);
    });
  });

  describe('Multiple Clearing Operations', () => {
    /**
     * Test case: clearMetadata should handle multiple consecutive clearing operations
     *
     * This test validates that multiple clearing operations work correctly
     * and don't interfere with each other.
     */
    it('should handle multiple consecutive clearing operations', () => {
      // Arrange: Create a class with multiple metadata entries
      class TestClass {}

      Reflect.defineMetadata('meta1', { value: 1 }, TestClass);
      Reflect.defineMetadata('meta2', { value: 2 }, TestClass);
      Reflect.defineMetadata('meta3', { value: 3 }, TestClass);
      Reflect.defineMetadata('meta4', { value: 4 }, TestClass);

      // Act: Perform multiple selective clearing operations
      clearMetadata('meta1', TestClass);
      clearMetadata('meta3', TestClass);

      // Assert: Only specified metadata should be cleared
      expect(getMetadata('meta1', TestClass)).toBeUndefined();
      expect(getMetadata('meta2', TestClass)).toEqual({ value: 2 });
      expect(getMetadata('meta3', TestClass)).toBeUndefined();
      expect(getMetadata('meta4', TestClass)).toEqual({ value: 4 });

      // Act: Clear remaining metadata
      clearMetadata(undefined, TestClass);

      // Assert: All metadata should be cleared
      expect(Reflect.getMetadataKeys(TestClass)).toHaveLength(0);
    });
  });
});
