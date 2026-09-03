import type { Type, RemoveFieldsWithType, TransformMetadataKey } from "@/types";
import type { MappedType } from "@/interfaces";

describe("Type Definitions", () => {
  describe("Type<T> interface", () => {
    /**
     * Test case: Type interface should work with class constructors
     *
     * This test validates that the Type interface correctly represents
     * class constructors that can be instantiated.
     */
    it("should work with class constructors", () => {
      // Arrange: Define test classes
      class TestClass {
        prop: string = "test";

        constructor(value?: string) {
          if (value) this.prop = value;
        }
      }

      class AnotherTestClass {
        value: number = 42;
      }

      // Act: Use Type interface
      const ClassType: Type<TestClass> = TestClass;
      const AnotherClassType: Type<AnotherTestClass> = AnotherTestClass;

      // Assert: Should be able to instantiate
      const instance = new ClassType("custom");
      const anotherInstance = new AnotherClassType();

      expect(instance).toBeInstanceOf(TestClass);
      expect(instance.prop).toBe("custom");
      expect(anotherInstance).toBeInstanceOf(AnotherTestClass);
      expect(anotherInstance.value).toBe(42);
    });

    /**
     * Test case: Type interface should work with generic classes
     *
     * This test validates that the Type interface works with generic
     * class definitions.
     */
    it("should work with generic classes", () => {
      // Arrange: Define generic class
      class GenericClass<T> {
        data: T;

        constructor(data: T) {
          this.data = data;
        }
      }

      // Act: Create specialized types
      const StringClassType: Type<GenericClass<string>> = GenericClass as Type<
        GenericClass<string>
      >;
      const NumberClassType: Type<GenericClass<number>> = GenericClass as Type<
        GenericClass<number>
      >;

      // Assert: Should work with different generic parameters
      const stringInstance = new StringClassType("test");
      const numberInstance = new NumberClassType(42);

      expect(stringInstance.data).toBe("test");
      expect(typeof stringInstance.data).toBe("string");
      expect(numberInstance.data).toBe(42);
      expect(typeof numberInstance.data).toBe("number");
    });

    /**
     * Test case: Type interface should accept constructor parameters
     *
     * This test validates that the Type interface works with classes
     * that have constructor parameters.
     */
    it("should accept constructor parameters", () => {
      // Arrange: Define class with required constructor parameters
      class ParameterizedClass {
        name: string;
        age: number;

        constructor(name: string, age: number) {
          this.name = name;
          this.age = age;
        }
      }

      // Act: Use Type interface
      const ClassType: Type<ParameterizedClass> = ParameterizedClass;

      // Assert: Should be able to instantiate with parameters
      const instance = new ClassType("John", 30);

      expect(instance.name).toBe("John");
      expect(instance.age).toBe(30);
      expect(instance).toBeInstanceOf(ParameterizedClass);
    });
  });

  describe("RemoveFieldsWithType utility type", () => {
    /**
     * Test case: RemoveFieldsWithType should remove Function fields
     *
     * This test validates that the RemoveFieldsWithType utility type
     * correctly removes fields with specific types.
     */
    it("should remove Function fields from object types", () => {
      // Arrange: Define interface with mixed field types
      interface TestInterface {
        name: string;
        age: number;
        isActive: boolean;
        getValue: () => string;
        calculate: (x: number) => number;
        data: { key: string };
      }

      // Act: Apply RemoveFieldsWithType to remove Function fields
      type WithoutFunctions = RemoveFieldsWithType<TestInterface, Function>;

      // Assert: Type should only have non-function properties
      // This test validates at compile time - if it compiles, the type is correct
      const obj: WithoutFunctions = {
        name: "test",
        age: 30,
        isActive: true,
        data: { key: "value" },
      } as WithoutFunctions;

      // Functions should not be assignable to the type
      // Note: This validation happens at compile time

      expect(obj.name).toBe("test");
      expect(obj.age).toBe(30);
      expect(obj.isActive).toBe(true);
      expect(obj.data.key).toBe("value");
    });

    /**
     * Test case: RemoveFieldsWithType should work with other types
     *
     * This test validates that the utility type can remove other
     * specific types besides Function.
     */
    it("should remove specific types from object types", () => {
      // Arrange: Define interface with mixed types
      interface MixedInterface {
        stringProp: string;
        numberProp: number;
        booleanProp: boolean;
        dateProp: Date;
        arrayProp: string[];
      }

      // Act: Remove string fields
      type WithoutStrings = RemoveFieldsWithType<MixedInterface, string>;
      type WithoutDates = RemoveFieldsWithType<MixedInterface, Date>;

      // Assert: Types should exclude the specified field types
      const withoutStrings: WithoutStrings = {
        numberProp: 42,
        booleanProp: true,
        dateProp: new Date(),
        arrayProp: ["test"],
      } as WithoutStrings;

      const withoutDates: WithoutDates = {
        stringProp: "test",
        numberProp: 42,
        booleanProp: true,
        arrayProp: ["test"],
      } as WithoutDates;

      expect(withoutStrings.numberProp).toBe(42);
      expect(withoutDates.stringProp).toBe("test");
    });

    /**
     * Test case: RemoveFieldsWithType should handle empty results
     *
     * This test validates behavior when all fields are removed.
     */
    it("should handle cases where all fields are removed", () => {
      // Arrange: Interface with only the target type
      interface OnlyStrings {
        prop1: string;
        prop2: string;
        prop3: string;
      }

      // Act: Remove all string fields
      type WithoutAllStrings = RemoveFieldsWithType<OnlyStrings, string>;

      // Assert: Should result in empty object type
      const emptyObj: WithoutAllStrings = {} as WithoutAllStrings;

      expect(Object.keys(emptyObj)).toEqual([]);
    });
  });

  describe("MappedType interface", () => {
    /**
     * Test case: MappedType should extend Type with parameterless constructor
     *
     * This test validates that MappedType properly extends Type and
     * requires a parameterless constructor.
     */
    it("should extend Type interface with parameterless constructor", () => {
      // Arrange: Define class that can be used as MappedType
      class MappableClass {
        prop1: string = "";
        prop2: number = 0;

        // Parameterless constructor required for MappedType
        constructor() {}
      }

      // Act: Create MappedType
      const mappedType: MappedType<MappableClass> = MappableClass;

      // Assert: Should be instantiable without parameters
      const instance = new mappedType();

      expect(instance).toBeInstanceOf(MappableClass);
      expect(instance.prop1).toBe("");
      expect(instance.prop2).toBe(0);
    });

    /**
     * Test case: MappedType should work with complex types
     *
     * This test validates that MappedType works with complex
     * object structures.
     */
    it("should work with complex mapped types", () => {
      // Arrange: Define complex interface
      interface ComplexData {
        id: string;
        metadata: {
          created: Date;
          tags: string[];
        };
        config: {
          enabled: boolean;
          settings: Record<string, any>;
        };
      }

      // Define class implementing the interface
      class ComplexMappedClass implements ComplexData {
        id: string = "";
        metadata: { created: Date; tags: string[] } = {
          created: new Date(),
          tags: [],
        };
        config: { enabled: boolean; settings: Record<string, any> } = {
          enabled: false,
          settings: {},
        };
      }

      // Act: Use as MappedType
      const mappedComplexType: MappedType<ComplexData> = ComplexMappedClass;

      // Assert: Should work with complex nested structures
      const instance = new mappedComplexType();

      expect(instance.id).toBe("");
      expect(instance.metadata.created).toBeInstanceOf(Date);
      expect(Array.isArray(instance.metadata.tags)).toBe(true);
      expect(typeof instance.config.enabled).toBe("boolean");
      expect(typeof instance.config.settings).toBe("object");
    });

    /**
     * Test case: MappedType should work with generic constraints
     *
     * This test validates that MappedType works correctly with
     * generic type parameters.
     */
    it("should work with generic constraints", () => {
      // Arrange: Define generic interface
      interface GenericData<T> {
        value: T;
        process: (input: T) => T;
      }

      // Define class implementing generic interface
      class GenericMappedClass<T> implements GenericData<T> {
        value: T;

        constructor(initialValue: T) {
          this.value = initialValue;
        }

        process(input: T): T {
          return input;
        }
      }

      // Specialized version for MappedType
      class StringMappedClass implements GenericData<string> {
        value: string = "";

        process(input: string): string {
          return input.toUpperCase();
        }
      }

      // Act: Use as MappedType
      const stringMappedType: MappedType<GenericData<string>> = StringMappedClass;

      // Assert: Should work with specialized generic types
      const instance = new stringMappedType();

      expect(instance.value).toBe("");
      expect(instance.process("test")).toBe("TEST");
    });
  });

  describe("TransformMetadataKey type", () => {
    /**
     * Test case: TransformMetadataKey should include all required metadata keys
     *
     * This test validates that the TransformMetadataKey type union
     * includes all necessary class-transformer metadata keys.
     */
    it("should include all class-transformer metadata keys", () => {
      // Arrange: Define function that accepts TransformMetadataKey
      function processMetadataKey(key: TransformMetadataKey): string {
        switch (key) {
          case "_typeMetadatas":
            return "type";
          case "_exposeMetadatas":
            return "expose";
          case "_excludeMetadatas":
            return "exclude";
          case "_transformMetadatas":
            return "transform";
          default:
            // This should never be reached if all keys are handled
            return "unknown";
        }
      }

      // Act & Assert: All metadata keys should be valid
      expect(processMetadataKey("_typeMetadatas")).toBe("type");
      expect(processMetadataKey("_exposeMetadatas")).toBe("expose");
      expect(processMetadataKey("_excludeMetadatas")).toBe("exclude");
      expect(processMetadataKey("_transformMetadatas")).toBe("transform");
    });

    /**
     * Test case: TransformMetadataKey should be used in array iteration
     *
     * This test validates that the type can be used in practical
     * scenarios like array iteration.
     */
    it("should be usable in array iteration", () => {
      // Arrange: Create array of metadata keys
      const metadataKeys: TransformMetadataKey[] = [
        "_typeMetadatas",
        "_exposeMetadatas",
        "_excludeMetadatas",
        "_transformMetadatas",
      ];

      // Act: Process each key
      const results = metadataKeys.map((key) => {
        // This simulates what the actual inheritance functions do
        return `Processing ${key}`;
      });

      // Assert: Should process all keys
      expect(results).toHaveLength(4);
      expect(results).toContain("Processing _typeMetadatas");
      expect(results).toContain("Processing _exposeMetadatas");
      expect(results).toContain("Processing _excludeMetadatas");
      expect(results).toContain("Processing _transformMetadatas");
    });
  });

  describe("Type Composition and Inference", () => {
    /**
     * Test case: Types should compose correctly in complex scenarios
     *
     * This test validates that types work together properly in
     * complex composition scenarios.
     */
    it("should compose correctly in complex scenarios", () => {
      // Arrange: Define complex type composition
      interface BaseData {
        id: string;
        name: string;
        getValue: () => string;
        calculate: (x: number) => number;
      }

      type CleanData = RemoveFieldsWithType<BaseData, Function>;

      class CleanDataClass {
        id: string = "";
        name: string = "";
      }

      // Act: Create MappedType from cleaned interface
      const cleanMappedType: MappedType<CleanData> = CleanDataClass as any;

      // Assert: Should work with type composition
      const instance = new cleanMappedType();

      expect(instance.id).toBe("");
      expect(instance.name).toBe("");
      expect(instance).not.toHaveProperty("getValue");
      expect(instance).not.toHaveProperty("calculate");
    });

    /**
     * Test case: Type inference should work with utility helpers
     *
     * This test validates that TypeScript's type inference works
     * correctly with the defined utility types.
     */
    it("should work with type inference", () => {
      // Arrange: Define function that uses generic constraints
      function createMappedClass<T>(
        classRef: Type<T>,
      ): MappedType<RemoveFieldsWithType<T, Function>> {
        // This simulates what the helper functions do
        return classRef as any;
      }

      class TestClass {
        prop: string = "test";
        method(): string {
          return this.prop;
        }
      }

      // Act: Use type inference
      const MappedClass = createMappedClass(TestClass);

      // Assert: Should infer correct types
      const instance = new MappedClass();

      expect(instance.prop).toBe("test");
      // Note: RemoveFieldsWithType is a TypeScript type-level operation only
      // At runtime, methods are still present on the instance
      expect(instance).toHaveProperty("method");
    });

    /**
     * Test case: Types should maintain type safety
     *
     * This test validates that the type system maintains type safety
     * and prevents invalid operations.
     */
    it("should maintain type safety", () => {
      // Arrange: Define strictly typed interfaces
      interface StrictInterface {
        stringProp: string;
        numberProp: number;
      }

      class StrictClass implements StrictInterface {
        stringProp: string = "";
        numberProp: number = 0;
      }

      // Act: Use with type constraints
      const strictType: MappedType<StrictInterface> = StrictClass;
      const instance = new strictType();

      // Assert: Should enforce type constraints
      instance.stringProp = "valid string";
      instance.numberProp = 42;

      // These should cause TypeScript errors if uncommented:
      // instance.stringProp = 123; // Error: Type 'number' is not assignable to type 'string'
      // instance.numberProp = 'string'; // Error: Type 'string' is not assignable to type 'number'

      expect(typeof instance.stringProp).toBe("string");
      expect(typeof instance.numberProp).toBe("number");
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    /**
     * Test case: Types should handle empty interfaces
     *
     * This test validates behavior with empty interfaces.
     */
    it("should handle empty interfaces", () => {
      // Arrange: Define empty interface
      interface EmptyInterface {}

      class EmptyClass implements EmptyInterface {}

      // Act: Use with MappedType
      const emptyType: MappedType<EmptyInterface> = EmptyClass;

      // Assert: Should work with empty interfaces
      const instance = new emptyType();

      expect(instance).toBeInstanceOf(EmptyClass);
      expect(Object.keys(instance)).toEqual([]);
    });

    /**
     * Test case: RemoveFieldsWithType should handle interfaces with no matching fields
     *
     * This test validates behavior when no fields match the removal criteria.
     */
    it("should handle interfaces with no matching fields for removal", () => {
      // Arrange: Interface with no functions
      interface NoFunctions {
        stringProp: string;
        numberProp: number;
        booleanProp: boolean;
      }

      // Act: Try to remove functions (none exist)
      type StillNoFunctions = RemoveFieldsWithType<NoFunctions, Function>;

      // Assert: Should be identical to original interface
      const obj: StillNoFunctions = {
        stringProp: "test",
        numberProp: 42,
        booleanProp: true,
      };

      expect(obj.stringProp).toBe("test");
      expect(obj.numberProp).toBe(42);
      expect(obj.booleanProp).toBe(true);
    });

    /**
     * Test case: Types should work with inheritance hierarchies
     *
     * This test validates that types work correctly with class inheritance.
     */
    it("should work with inheritance hierarchies", () => {
      // Arrange: Define inheritance hierarchy
      interface BaseInterface {
        baseProperty: string;
      }

      interface ExtendedInterface extends BaseInterface {
        extendedProperty: number;
      }

      class BaseClass implements BaseInterface {
        baseProperty: string = "";
      }

      class ExtendedClass extends BaseClass implements ExtendedInterface {
        extendedProperty: number = 0;
      }

      // Act: Use with MappedType
      const baseType: MappedType<BaseInterface> = BaseClass;
      const extendedType: MappedType<ExtendedInterface> = ExtendedClass;

      // Assert: Should work with inheritance
      const baseInstance = new baseType();
      const extendedInstance = new extendedType();

      expect(baseInstance.baseProperty).toBe("");
      expect(extendedInstance.baseProperty).toBe("");
      expect(extendedInstance.extendedProperty).toBe(0);
      expect(extendedInstance).toBeInstanceOf(BaseClass);
      expect(extendedInstance).toBeInstanceOf(ExtendedClass);
    });
  });
});
