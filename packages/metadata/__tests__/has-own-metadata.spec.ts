import { hasOwnMetadata } from '@/has-own-metadata';
import { hasMetadata } from '@/has-metadata';
import { defineMetadata } from '@/define-metadata';
import { clearMetadata } from '@/clear-metadata';

describe('hasOwnMetadata', () => {
  describe('Basic Direct Metadata Detection', () => {
    /**
     * Test case: hasOwnMetadata should return true when metadata is defined directly on target
     *
     * This test validates the core functionality of detecting direct metadata presence.
     */
    it('should return true when metadata is defined directly on target object', () => {
      // Arrange: Create a class with direct metadata
      const metadataKey = Symbol('direct-key');
      const target = class DirectClass {};

      Reflect.defineMetadata(metadataKey, 'direct-value', target);

      // Act & Assert: Should detect direct metadata
      expect(hasOwnMetadata(metadataKey, target)).toBe(true);
    });

    /**
     * Test case: hasOwnMetadata should return false when no metadata exists
     *
     * This test validates that the function correctly identifies when no direct metadata exists.
     */
    it('should return false when no metadata is defined on target object', () => {
      // Arrange: Create a clean class with no metadata
      const metadataKey = Symbol('nonexistent-key');
      const target = class CleanClass {};

      // Act & Assert: Should not detect any direct metadata
      expect(hasOwnMetadata(metadataKey, target)).toBe(false);
    });

    /**
     * Test case: hasOwnMetadata should work with various key types for direct metadata
     *
     * This test validates that different types of metadata keys work with direct detection.
     */
    it('should work with various metadata key types for direct metadata', () => {
      // Arrange: Create a class and test with different key types
      class TestClass {}

      const stringKey = 'string-key';
      const symbolKey = Symbol('symbol-key');
      const numberKey = 42;
      const objectKey = { type: 'object-key' };

      // Define direct metadata with different key types
      defineMetadata(stringKey, 'string-value', TestClass);
      defineMetadata(symbolKey, 'symbol-value', TestClass);
      defineMetadata(numberKey, 'number-value', TestClass);
      defineMetadata(objectKey, 'object-value', TestClass);

      // Act & Assert: Should detect all direct key types
      expect(hasOwnMetadata(stringKey, TestClass)).toBe(true);
      expect(hasOwnMetadata(symbolKey, TestClass)).toBe(true);
      expect(hasOwnMetadata(numberKey, TestClass)).toBe(true);
      expect(hasOwnMetadata(objectKey, TestClass)).toBe(true);

      // Should not detect non-existent keys
      expect(hasOwnMetadata('non-existent', TestClass)).toBe(false);
      expect(hasOwnMetadata(Symbol('non-existent'), TestClass)).toBe(false);
    });
  });

  describe('Inheritance and Prototype Chain Exclusion', () => {
    /**
     * Test case: hasOwnMetadata should return false for inherited metadata
     *
     * This test validates that metadata defined on parent classes is NOT detected
     * when checking child classes with hasOwnMetadata.
     */
    it('should return false when metadata is defined on parent class', () => {
      // Arrange: Create inheritance hierarchy with parent metadata
      const metadataKey = Symbol('inheritance-key');
      class ParentClass {}
      class ChildClass extends ParentClass {}

      Reflect.defineMetadata(metadataKey, 'parent-value', ParentClass);

      // Act & Assert: Child should NOT detect parent's metadata with hasOwnMetadata
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(false);
      expect(hasOwnMetadata(metadataKey, ParentClass)).toBe(true); // But parent should detect its own

      // Verify that hasMetadata would detect it (for comparison)
      expect(hasMetadata(metadataKey, ChildClass)).toBe(true);
    });

    /**
     * Test case: hasOwnMetadata should distinguish between direct and inherited metadata
     *
     * This test validates the key difference between hasOwnMetadata and hasMetadata.
     */
    it('should distinguish between direct and inherited metadata', () => {
      // Arrange: Create inheritance with different metadata at each level
      const sharedKey = 'shared-metadata';
      const parentKey = 'parent-only';
      const childKey = 'child-only';

      class BaseClass {}
      class DerivedClass extends BaseClass {}

      // Define metadata at different levels
      defineMetadata(sharedKey, 'base-value', BaseClass);
      defineMetadata(parentKey, 'parent-value', BaseClass);
      defineMetadata(sharedKey, 'derived-value', DerivedClass); // Override
      defineMetadata(childKey, 'child-value', DerivedClass);

      // Act & Assert: hasOwnMetadata should only detect direct metadata

      // Base class - should detect its own metadata
      expect(hasOwnMetadata(sharedKey, BaseClass)).toBe(true);
      expect(hasOwnMetadata(parentKey, BaseClass)).toBe(true);
      expect(hasOwnMetadata(childKey, BaseClass)).toBe(false);

      // Derived class - should only detect its own metadata
      expect(hasOwnMetadata(sharedKey, DerivedClass)).toBe(true); // Overridden value
      expect(hasOwnMetadata(parentKey, DerivedClass)).toBe(false); // Inherited, not own
      expect(hasOwnMetadata(childKey, DerivedClass)).toBe(true); // Own metadata

      // Compare with hasMetadata which includes inheritance
      expect(hasMetadata(parentKey, DerivedClass)).toBe(true); // Would find inherited
    });

    /**
     * Test case: hasOwnMetadata should work with deep inheritance hierarchies
     *
     * This test validates that hasOwnMetadata ignores metadata from any level of the prototype chain.
     */
    it('should ignore metadata from deep inheritance hierarchies', () => {
      // Arrange: Create deep inheritance hierarchy
      const metadataKey = 'deep-inheritance';

      class GreatGrandParent {}
      class GrandParent extends GreatGrandParent {}
      class Parent extends GrandParent {}
      class Child extends Parent {}

      // Define metadata only at the top level
      defineMetadata(metadataKey, 'great-grandparent-value', GreatGrandParent);

      // Act & Assert: Only the original definer should detect with hasOwnMetadata
      expect(hasOwnMetadata(metadataKey, GreatGrandParent)).toBe(true);
      expect(hasOwnMetadata(metadataKey, GrandParent)).toBe(false);
      expect(hasOwnMetadata(metadataKey, Parent)).toBe(false);
      expect(hasOwnMetadata(metadataKey, Child)).toBe(false);

      // But hasMetadata should detect it at all levels
      expect(hasMetadata(metadataKey, Child)).toBe(true);
    });
  });

  describe('Property-specific Direct Metadata', () => {
    /**
     * Test case: hasOwnMetadata should detect direct metadata on specific properties
     *
     * This test validates detection of property-level metadata that is defined directly.
     */
    it('should detect direct metadata on class properties', () => {
      // Arrange: Create a class with property metadata
      class TestClass {
        directProperty: string = 'test';
        inheritedProperty: string = 'test';
      }

      class ChildClass extends TestClass {
        ownProperty: string = 'child';
      }

      const metadataKey = 'property-metadata';

      // Define metadata on different properties
      defineMetadata(metadataKey, 'direct-value', TestClass.prototype, 'directProperty');
      defineMetadata(metadataKey, 'inherited-value', TestClass.prototype, 'inheritedProperty');
      defineMetadata(metadataKey, 'own-value', ChildClass.prototype, 'ownProperty');

      // Act & Assert: Should detect direct property metadata only
      expect(hasOwnMetadata(metadataKey, TestClass.prototype, 'directProperty')).toBe(true);
      expect(hasOwnMetadata(metadataKey, TestClass.prototype, 'inheritedProperty')).toBe(true);

      // Child class should only detect its own property metadata
      expect(hasOwnMetadata(metadataKey, ChildClass.prototype, 'ownProperty')).toBe(true);
      expect(hasOwnMetadata(metadataKey, ChildClass.prototype, 'inheritedProperty')).toBe(false); // Inherited

      // But hasMetadata would detect inherited property metadata
      expect(hasMetadata(metadataKey, ChildClass.prototype, 'inheritedProperty')).toBe(true);
    });

    /**
     * Test case: hasOwnMetadata should distinguish between class and property metadata ownership
     *
     * This test ensures that class-level and property-level metadata ownership is distinct.
     */
    it('should distinguish between class and property metadata ownership', () => {
      // Arrange: Create inheritance with metadata at various levels
      class BaseClass {
        baseProperty: string = 'base';
      }
      class DerivedClass extends BaseClass {
        derivedProperty: string = 'derived';
      }

      const metadataKey = 'ownership-test';

      // Define metadata at different levels
      defineMetadata(metadataKey, 'base-class', BaseClass);
      defineMetadata(metadataKey, 'base-property', BaseClass.prototype, 'baseProperty');
      defineMetadata(metadataKey, 'derived-class', DerivedClass);
      defineMetadata(metadataKey, 'derived-property', DerivedClass.prototype, 'derivedProperty');

      // Act & Assert: Each should only detect its own metadata

      // Base class ownership
      expect(hasOwnMetadata(metadataKey, BaseClass)).toBe(true);
      expect(hasOwnMetadata(metadataKey, BaseClass.prototype, 'baseProperty')).toBe(true);

      // Derived class ownership
      expect(hasOwnMetadata(metadataKey, DerivedClass)).toBe(true);
      expect(hasOwnMetadata(metadataKey, DerivedClass.prototype, 'derivedProperty')).toBe(true);

      // Cross-level non-ownership
      expect(hasOwnMetadata(metadataKey, DerivedClass.prototype, 'baseProperty')).toBe(false);
    });
  });

  describe('Metadata Overriding and Shadowing', () => {
    /**
     * Test case: hasOwnMetadata should detect when child classes override parent metadata
     *
     * This test validates detection of metadata overrides in inheritance hierarchies.
     */
    it('should detect metadata overrides in child classes', () => {
      // Arrange: Create inheritance with metadata overrides
      const metadataKey = 'override-test';

      class ParentClass {}
      class ChildClass extends ParentClass {}
      class GrandChildClass extends ChildClass {}

      // Define metadata at multiple levels
      defineMetadata(metadataKey, 'parent-value', ParentClass);
      defineMetadata(metadataKey, 'child-value', ChildClass); // Override
      // GrandChildClass has no direct metadata, inherits from ChildClass

      // Act & Assert: Each should only detect its own direct metadata
      expect(hasOwnMetadata(metadataKey, ParentClass)).toBe(true);
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(true); // Has override
      expect(hasOwnMetadata(metadataKey, GrandChildClass)).toBe(false); // No direct metadata

      // Compare with hasMetadata for inherited detection
      expect(hasMetadata(metadataKey, GrandChildClass)).toBe(true); // Would find child's override
    });

    /**
     * Test case: hasOwnMetadata should handle property metadata overrides
     *
     * This test validates property-level metadata overrides between parent and child classes.
     */
    it('should handle property metadata overrides', () => {
      // Arrange: Create inheritance with property metadata overrides
      class BaseController {
        handleRequest(): void {}
      }
      class UserController extends BaseController {
        // Same method name, potentially different metadata
        handleRequest(): void {}
      }

      const routeKey = 'route';
      const authKey = 'auth';

      // Define base metadata
      defineMetadata(routeKey, '/base', BaseController.prototype, 'handleRequest');
      defineMetadata(authKey, false, BaseController.prototype, 'handleRequest');

      // Override some metadata in child
      defineMetadata(routeKey, '/users', UserController.prototype, 'handleRequest');
      // authKey is not overridden, so it's inherited

      // Act & Assert: Check ownership vs inheritance

      // Base class owns both
      expect(hasOwnMetadata(routeKey, BaseController.prototype, 'handleRequest')).toBe(true);
      expect(hasOwnMetadata(authKey, BaseController.prototype, 'handleRequest')).toBe(true);

      // Child class only owns the overridden one
      expect(hasOwnMetadata(routeKey, UserController.prototype, 'handleRequest')).toBe(true); // Overridden
      expect(hasOwnMetadata(authKey, UserController.prototype, 'handleRequest')).toBe(false); // Inherited

      // But hasMetadata finds both
      expect(hasMetadata(authKey, UserController.prototype, 'handleRequest')).toBe(true);
    });
  });

  describe('Dynamic Metadata Operations', () => {
    /**
     * Test case: hasOwnMetadata should reflect direct metadata state changes
     *
     * This test validates that hasOwnMetadata correctly tracks direct metadata changes.
     */
    it('should reflect changes when direct metadata is added or removed', () => {
      // Arrange: Create a class for dynamic testing
      class DynamicClass {}
      const metadataKey = 'dynamic-key';

      // Initially no metadata
      expect(hasOwnMetadata(metadataKey, DynamicClass)).toBe(false);

      // Add direct metadata
      defineMetadata(metadataKey, 'dynamic-value', DynamicClass);
      expect(hasOwnMetadata(metadataKey, DynamicClass)).toBe(true);

      // Remove direct metadata
      clearMetadata(metadataKey, DynamicClass);
      expect(hasOwnMetadata(metadataKey, DynamicClass)).toBe(false);
    });

    /**
     * Test case: hasOwnMetadata should not be affected by inherited metadata changes
     *
     * This test validates that changes to inherited metadata don't affect hasOwnMetadata results.
     */
    it('should not be affected by inherited metadata changes', () => {
      // Arrange: Create inheritance hierarchy
      class ParentClass {}
      class ChildClass extends ParentClass {}

      const metadataKey = 'inheritance-change-test';

      // Child should not detect parent metadata
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(false);

      // Add metadata to parent
      defineMetadata(metadataKey, 'parent-value', ParentClass);
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(false); // Still no direct metadata
      expect(hasMetadata(metadataKey, ChildClass)).toBe(true); // But hasMetadata finds it

      // Remove metadata from parent
      clearMetadata(metadataKey, ParentClass);
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(false); // Still no direct metadata
      expect(hasMetadata(metadataKey, ChildClass)).toBe(false); // Now hasMetadata doesn't find it either
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test case: hasOwnMetadata should handle null and undefined keys gracefully
     *
     * This test ensures the function behaves correctly with edge case keys.
     */
    it('should handle null and undefined keys gracefully', () => {
      // Arrange: Create a test class
      class TestClass {}

      // Act & Assert: Should handle edge case keys without throwing
      expect(() => hasOwnMetadata(null, TestClass)).not.toThrow();
      expect(() => hasOwnMetadata(undefined, TestClass)).not.toThrow();

      // These should return false (no direct metadata with null/undefined keys)
      expect(hasOwnMetadata(null, TestClass)).toBe(false);
      expect(hasOwnMetadata(undefined, TestClass)).toBe(false);
    });

    /**
     * Test case: hasOwnMetadata should work with class instances
     *
     * This test ensures the function works with class instances, not just constructors.
     */
    it('should work with class instances', () => {
      // Arrange: Create class and instances
      class TestClass {
        instanceProperty: string = 'test';
      }

      class ChildClass extends TestClass {}

      const instance1 = new TestClass();
      const instance2 = new TestClass();
      const childInstance = new ChildClass();

      const metadataKey = 'instance-metadata';

      // Define metadata on instances
      defineMetadata(metadataKey, 'instance1-value', instance1);
      defineMetadata(metadataKey, 'class-value', TestClass); // Different target

      // Act & Assert: Should work with instances for direct metadata only
      expect(hasOwnMetadata(metadataKey, instance1)).toBe(true); // Direct on instance
      expect(hasOwnMetadata(metadataKey, instance2)).toBe(false); // No direct metadata
      expect(hasOwnMetadata(metadataKey, childInstance)).toBe(false); // No direct metadata

      // Class metadata is separate
      expect(hasOwnMetadata(metadataKey, TestClass)).toBe(true);
      expect(hasOwnMetadata(metadataKey, ChildClass)).toBe(false); // No direct class metadata

      // hasMetadata would find class metadata for child class
      expect(hasMetadata(metadataKey, ChildClass)).toBe(true);
    });

    /**
     * Test case: hasOwnMetadata should handle complex object keys
     *
     * This test validates behavior with complex object keys for direct metadata.
     */
    it('should work with complex object keys for direct metadata', () => {
      // Arrange: Create complex keys
      class ParentClass {}
      class ChildClass extends ParentClass {}

      const arrayKey = ['array', 'key'];
      const objectKey = { type: 'object', id: 123 };
      const functionKey = function namedFunction() {};

      // Define metadata with complex keys on parent
      defineMetadata(arrayKey, 'parent-array-value', ParentClass);
      defineMetadata(objectKey, 'parent-object-value', ParentClass);

      // Define same keys on child
      defineMetadata(arrayKey, 'child-array-value', ChildClass);

      // Act & Assert: Should detect direct complex key types only
      expect(hasOwnMetadata(arrayKey, ParentClass)).toBe(true);
      expect(hasOwnMetadata(objectKey, ParentClass)).toBe(true);

      expect(hasOwnMetadata(arrayKey, ChildClass)).toBe(true); // Direct override
      expect(hasOwnMetadata(objectKey, ChildClass)).toBe(false); // Not overridden, inherited only
      expect(hasOwnMetadata(functionKey, ChildClass)).toBe(false); // Never defined

      // hasMetadata would find inherited
      expect(hasMetadata(objectKey, ChildClass)).toBe(true);
    });
  });

  describe('Comparison with hasMetadata', () => {
    /**
     * Test case: hasOwnMetadata vs hasMetadata behavior comparison
     *
     * This test provides a comprehensive comparison between the two functions.
     */
    it('should demonstrate clear differences from hasMetadata', () => {
      // Arrange: Create comprehensive test scenario
      class GreatGrandParent {
        method1(): void {}
      }
      class GrandParent extends GreatGrandParent {
        method2(): void {}
      }
      class Parent extends GrandParent {
        method1(): void {} // Override
        method3(): void {}
      }
      class Child extends Parent {
        method2(): void {} // Override
        method4(): void {}
      }

      const metadataKey = 'comparison-test';

      // Define metadata at each level
      defineMetadata(metadataKey, 'great-grand', GreatGrandParent);
      defineMetadata(metadataKey, 'grand', GrandParent);
      defineMetadata(metadataKey, 'parent', Parent);
      // Child has no direct metadata

      // Property metadata
      defineMetadata('prop-meta', 'ggp-method1', GreatGrandParent.prototype, 'method1');
      defineMetadata('prop-meta', 'gp-method2', GrandParent.prototype, 'method2');
      defineMetadata('prop-meta', 'p-method3', Parent.prototype, 'method3');

      // Act & Assert: Compare hasOwnMetadata vs hasMetadata

      // Class-level metadata
      const classComparisons = [
        { target: GreatGrandParent, hasOwn: true, hasAny: true },
        { target: GrandParent, hasOwn: true, hasAny: true },
        { target: Parent, hasOwn: true, hasAny: true },
        { target: Child, hasOwn: false, hasAny: true }, // Inherits from Parent
      ];

      classComparisons.forEach(({ target, hasOwn, hasAny }) => {
        expect(hasOwnMetadata(metadataKey, target)).toBe(hasOwn);
        expect(hasMetadata(metadataKey, target)).toBe(hasAny);
      });

      // Property-level metadata
      const propertyComparisons = [
        { target: Child.prototype, prop: 'method1', hasOwn: false, hasAny: true }, // Inherits from GreatGrandParent
        { target: Child.prototype, prop: 'method2', hasOwn: false, hasAny: true }, // Inherits from GrandParent
        { target: Child.prototype, prop: 'method3', hasOwn: false, hasAny: true }, // Inherits from Parent
        { target: Child.prototype, prop: 'method4', hasOwn: false, hasAny: false }, // No metadata
      ];

      propertyComparisons.forEach(({ target, prop, hasOwn, hasAny }) => {
        expect(hasOwnMetadata('prop-meta', target, prop)).toBe(hasOwn);
        expect(hasMetadata('prop-meta', target, prop)).toBe(hasAny);
      });
    });
  });
});
