import { OmitType } from "@/helpers/omit-type.helper";
import { IsString, IsEmail, IsNumber, IsOptional, IsBoolean } from "class-validator";
import { Expose, Exclude, Type as TransformType, Transform } from "class-transformer";

describe("OmitType", () => {
  describe("Basic Type Creation", () => {
    /**
     * Test case: OmitType should create a new class excluding omitted properties
     *
     * This test validates that OmitType creates a class containing all properties
     * except those specified in the omit array.
     */
    it("should create a new class excluding omitted properties", () => {
      // Arrange: Create source class with multiple properties
      class SourceClass {
        name: string = "test";
        email: string = "test@example.com";
        age: number = 25;
        password: string = "secret";
        isActive: boolean = true;
      }

      // Act: Omit password and age properties
      class SafeUserClass extends OmitType(SourceClass, ["password", "age"]) {}

      // Assert: Instance should have all properties except omitted ones
      const instance = new SafeUserClass();

      expect(instance).toHaveProperty("name");
      expect(instance).toHaveProperty("email");
      expect(instance).toHaveProperty("isActive");
      expect(instance).not.toHaveProperty("password");
      expect(instance).not.toHaveProperty("age");

      // Verify property initialization
      expect(instance.name).toBe("test");
      expect(instance.email).toBe("test@example.com");
      expect(instance.isActive).toBe(true);
    });

    /**
     * Test case: OmitType should preserve types of remaining properties
     *
     * This test ensures that non-omitted properties maintain their original types
     * and initialization values.
     */
    it("should preserve types and values of remaining properties", () => {
      // Arrange: Source class with various property types
      class DataClass {
        stringProp: string = "text";
        numberProp: number = 42;
        booleanProp: boolean = false;
        arrayProp: string[] = ["a", "b"];
        objectProp: { key: string } = { key: "value" };
        dateProp: Date = new Date("2023-01-01");
        // This will be omitted
        secretProp: string = "secret";
      }

      // Act: Omit only the secret property
      class PublicDataClass extends OmitType(DataClass, ["secretProp"]) {}

      // Assert: All other properties should be preserved with correct types
      const instance = new PublicDataClass();

      expect(typeof instance.stringProp).toBe("string");
      expect(typeof instance.numberProp).toBe("number");
      expect(typeof instance.booleanProp).toBe("boolean");
      expect(Array.isArray(instance.arrayProp)).toBe(true);
      expect(instance.dateProp instanceof Date).toBe(true);

      expect(instance.stringProp).toBe("text");
      expect(instance.numberProp).toBe(42);
      expect(instance.booleanProp).toBe(false);
      expect(instance.arrayProp).toEqual(["a", "b"]);
      expect(instance.objectProp).toEqual({ key: "value" });
      expect(instance.dateProp).toEqual(new Date("2023-01-01"));

      // Verify omitted property is not present
      expect(instance).not.toHaveProperty("secretProp");
    });

    /**
     * Test case: OmitType should work when omitting all properties
     *
     * This test validates behavior when all properties are omitted.
     */
    it("should create empty class when all properties are omitted", () => {
      // Arrange: Source class with properties
      class SourceClass {
        prop1: string = "value1";
        prop2: number = 100;
        prop3: boolean = true;
      }

      // Act: Omit all properties
      class EmptyClass extends OmitType(SourceClass, ["prop1", "prop2", "prop3"]) {}

      // Assert: Instance should have no properties from source
      const instance = new EmptyClass();

      expect(instance).not.toHaveProperty("prop1");
      expect(instance).not.toHaveProperty("prop2");
      expect(instance).not.toHaveProperty("prop3");
      expect(Object.keys(instance)).toEqual([]);
    });

    /**
     * Test case: OmitType should preserve all properties when omitting none
     *
     * This test validates behavior when no properties are omitted.
     */
    it("should preserve all properties when omitting none", () => {
      // Arrange: Source class with properties
      class FullClass {
        name: string = "full";
        value: number = 999;
        active: boolean = false;
      }

      // Act: Omit no properties (empty array)
      class CompleteClass extends OmitType(FullClass, []) {}

      // Assert: All properties should be preserved
      const instance = new CompleteClass();

      expect(instance).toHaveProperty("name");
      expect(instance).toHaveProperty("value");
      expect(instance).toHaveProperty("active");

      expect(instance.name).toBe("full");
      expect(instance.value).toBe(999);
      expect(instance.active).toBe(false);
    });
  });

  describe("Class-Validator Integration", () => {
    /**
     * Test case: OmitType should inherit validation metadata for remaining properties
     *
     * This test validates that validation decorators are properly inherited
     * for non-omitted properties only.
     */
    it("should inherit validation metadata for remaining properties", () => {
      // Arrange: Source class with validation decorators
      class UserDto {
        @IsString({ message: "Name must be a string" })
        name: string = "";

        @IsEmail({}, { message: "Email must be valid" })
        email: string = "";

        @IsNumber({}, { message: "Age must be a number" })
        age: number = 0;

        @IsString({ message: "Password is required" })
        password: string = "";

        @IsBoolean()
        isActive: boolean = true;
      }

      // Act: Omit password and age (keeping name, email, isActive)
      class PublicUserDto extends OmitType(UserDto, ["password", "age"]) {}

      // Assert: Validation metadata should be present for remaining properties only
      const metadataStorage = require("class-validator").getMetadataStorage();
      const targetMetadatas = metadataStorage.getTargetValidationMetadatas(
        PublicUserDto,
        null,
        false,
        false,
      );

      // Should have validation metadata for remaining properties
      const propertyNames = targetMetadatas.map((metadata: any) => metadata.propertyName);
      expect(propertyNames).toContain("name");
      expect(propertyNames).toContain("email");
      expect(propertyNames).toContain("isActive");

      // Should not have validation metadata for omitted properties
      expect(propertyNames).not.toContain("password");
      expect(propertyNames).not.toContain("age");

      // Verify specific validation constraints are preserved
      const nameMetadata = targetMetadatas.find((m: any) => m.propertyName === "name");
      const emailMetadata = targetMetadatas.find((m: any) => m.propertyName === "email");
      const isActiveMetadata = targetMetadatas.find((m: any) => m.propertyName === "isActive");

      expect(nameMetadata.name).toBe("isString");
      expect(nameMetadata.message).toBe("Name must be a string");
      expect(emailMetadata.name).toBe("isEmail");
      expect(emailMetadata.message).toBe("Email must be valid");
      expect(isActiveMetadata.name).toBe("isBoolean");
    });

    /**
     * Test case: OmitType should preserve complex validation rules
     *
     * This test ensures that complex validation setups including conditional
     * and optional validations are properly inherited.
     */
    it("should preserve complex validation rules", () => {
      // Arrange: Source class with complex validation rules
      class ComplexDto {
        @IsString({ message: "Required field" })
        requiredField: string = "";

        @IsOptional()
        @IsString({ message: "Optional but validated if present" })
        optionalField?: string;

        @IsNumber({ allowInfinity: false }, { message: "Must be finite number" })
        numericField: number = 0;

        // This will be omitted
        @IsString()
        secretField: string = "";

        @IsBoolean({ message: "Must be boolean" })
        flagField: boolean = false;
      }

      // Act: Omit secretField only
      class FilteredDto extends OmitType(ComplexDto, ["secretField"]) {}

      // Assert: Complex validation rules should be preserved
      const metadataStorage = require("class-validator").getMetadataStorage();
      const targetMetadatas = metadataStorage.getTargetValidationMetadatas(
        FilteredDto,
        null,
        false,
        false,
      );

      // Check that all validation rules are preserved for remaining fields
      const requiredFieldValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "requiredField",
      );
      const optionalFieldValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "optionalField",
      );
      const numericFieldValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "numericField",
      );
      const flagFieldValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "flagField",
      );
      const secretFieldValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "secretField",
      );

      expect(requiredFieldValidations).toHaveLength(1);
      expect(requiredFieldValidations[0].message).toBe("Required field");

      expect(optionalFieldValidations).toHaveLength(2); // IsOptional + IsString
      expect(optionalFieldValidations.find((v: any) => v.name === "isOptional")).toBeDefined();
      expect(optionalFieldValidations.find((v: any) => v.name === "isString")).toBeDefined();

      expect(numericFieldValidations).toHaveLength(1);
      expect(numericFieldValidations[0].constraints[0]).toEqual({ allowInfinity: false });

      expect(flagFieldValidations).toHaveLength(1);
      expect(flagFieldValidations[0].name).toBe("isBoolean");

      // Secret field should have no validations
      expect(secretFieldValidations).toHaveLength(0);
    });
  });

  describe("Class-Transformer Integration", () => {
    /**
     * Test case: OmitType should inherit transformation metadata for remaining properties
     *
     * This test validates that transformation decorators are properly inherited
     * for non-omitted properties.
     */
    it("should inherit transformation metadata for remaining properties", () => {
      // Arrange: Source class with transformation decorators
      class TransformDto {
        @Expose()
        publicField: string = "";

        @Expose({ name: "custom_name" })
        fieldWithCustomName: string = "";

        @Transform(({ value }) => value.toUpperCase())
        @Expose()
        transformedField: string = "";

        @Exclude()
        hiddenField: string = "";

        // Will be omitted from type but has transformation metadata
        @Expose()
        @Transform(({ value }) => value * 2)
        calculatedField: number = 0;
      }

      // Act: Omit calculatedField (but keep hiddenField for metadata inheritance test)
      class FilteredTransformDto extends OmitType(TransformDto, ["calculatedField"]) {}

      // Assert: Transformation metadata should be inherited for remaining properties
      let defaultMetadataStorage: any;
      try {
        defaultMetadataStorage = require("class-transformer/cjs/storage").defaultMetadataStorage;
      } catch {
        defaultMetadataStorage = require("class-transformer/storage").defaultMetadataStorage;
      }

      // Check expose metadata
      const exposeMetadatas = defaultMetadataStorage._exposeMetadatas;
      if (exposeMetadatas?.has(FilteredTransformDto)) {
        const exposeMap = exposeMetadatas.get(FilteredTransformDto);

        expect(exposeMap.has("publicField")).toBe(true);
        expect(exposeMap.has("fieldWithCustomName")).toBe(true);
        expect(exposeMap.has("transformedField")).toBe(true);
        expect(exposeMap.has("calculatedField")).toBe(false); // omitted

        // Check custom name mapping
        const customNameMetadata = exposeMap.get("fieldWithCustomName");
        expect(customNameMetadata.options).toEqual({ name: "custom_name" });
      }

      // Check exclude metadata
      const excludeMetadatas = defaultMetadataStorage._excludeMetadatas;
      if (excludeMetadatas?.has(FilteredTransformDto)) {
        const excludeMap = excludeMetadatas.get(FilteredTransformDto);
        expect(excludeMap.has("hiddenField")).toBe(true);
        expect(excludeMap.has("calculatedField")).toBe(false); // omitted
      }

      // Check transform metadata
      const transformMetadatas = defaultMetadataStorage._transformMetadatas;
      if (transformMetadatas?.has(FilteredTransformDto)) {
        const transformMap = transformMetadatas.get(FilteredTransformDto);
        expect(transformMap.has("transformedField")).toBe(true);
        expect(transformMap.has("calculatedField")).toBe(false); // omitted
      }
    });
  });

  describe("Complex Scenarios", () => {
    /**
     * Test case: OmitType should work with inheritance hierarchies
     *
     * This test validates behavior when omitting properties from classes
     * that inherit from other classes.
     */
    it("should work with inheritance hierarchies", () => {
      // Arrange: Create inheritance hierarchy
      class BaseEntity {
        @IsString()
        id: string = "";

        @IsString()
        createdBy: string = "";

        createdAt: Date = new Date();
      }

      class UserEntity extends BaseEntity {
        @IsString()
        name: string = "";

        @IsEmail()
        email: string = "";

        @IsString()
        password: string = "";

        isActive: boolean = true;
      }

      // Act: Omit sensitive fields
      class UserResponseDto extends OmitType(UserEntity, ["password", "createdBy"]) {}

      // Assert: Should have remaining properties from both base and derived class
      const instance = new UserResponseDto();

      expect(instance).toHaveProperty("id"); // from BaseEntity
      expect(instance).toHaveProperty("createdAt"); // from BaseEntity
      expect(instance).toHaveProperty("name"); // from UserEntity
      expect(instance).toHaveProperty("email"); // from UserEntity
      expect(instance).toHaveProperty("isActive"); // from UserEntity
      expect(instance).not.toHaveProperty("password"); // omitted from UserEntity
      expect(instance).not.toHaveProperty("createdBy"); // omitted from BaseEntity

      // Verify validation metadata inheritance for remaining properties
      const metadataStorage = require("class-validator").getMetadataStorage();
      const validationMetadatas = metadataStorage.getTargetValidationMetadatas(
        UserResponseDto,
        null,
        false,
        false,
      );
      const propertyNames = validationMetadatas.map((m: any) => m.propertyName);

      expect(propertyNames).toContain("id");
      expect(propertyNames).toContain("name");
      expect(propertyNames).toContain("email");
      expect(propertyNames).not.toContain("password");
      expect(propertyNames).not.toContain("createdBy");
    });

    /**
     * Test case: OmitType should preserve property initializers for remaining properties
     *
     * This test validates that default property values are properly inherited
     * for non-omitted properties.
     */
    it("should preserve property initializers for remaining properties", () => {
      // Arrange: Source class with various property initializers
      class ConfigClass {
        theme: string = "dark";
        fontSize: number = 16;
        autoSave: boolean = true;
        shortcuts: string[] = ["ctrl+s", "ctrl+z"];
        // Sensitive settings to omit
        apiKey: string = "secret-key";
        adminSettings: { debug: boolean } = { debug: true };
      }

      // Act: Omit sensitive configuration
      class UserConfigClass extends OmitType(ConfigClass, ["apiKey", "adminSettings"]) {}

      // Assert: Remaining properties should have their default values
      const instance = new UserConfigClass();

      expect(instance.theme).toBe("dark");
      expect(instance.fontSize).toBe(16);
      expect(instance.autoSave).toBe(true);
      expect(instance.shortcuts).toEqual(["ctrl+s", "ctrl+z"]);

      // Verify omitted properties are not present
      expect(instance).not.toHaveProperty("apiKey");
      expect(instance).not.toHaveProperty("adminSettings");

      // Verify modifications work correctly on remaining properties
      instance.theme = "light";
      instance.shortcuts.push("ctrl+y");

      expect(instance.theme).toBe("light");
      expect(instance.shortcuts).toEqual(["ctrl+s", "ctrl+z", "ctrl+y"]);
    });

    /**
     * Test case: OmitType should work with generic classes
     *
     * This test validates behavior with generic class definitions.
     */
    it("should work with generic source classes", () => {
      // Arrange: Generic source class
      class GenericEntity<T> {
        @IsString()
        id: string = "";

        data: T = {} as T;

        @IsNumber()
        version: number = 1;

        // Metadata field to omit
        internalMetadata: { created: Date; modified: Date } = {
          created: new Date(),
          modified: new Date(),
        };
      }

      // Specialize the generic class
      interface ProductData {
        name: string;
        price: number;
      }

      class ProductEntity extends GenericEntity<ProductData> {
        constructor() {
          super();
          this.data = { name: "", price: 0 };
        }
      }

      // Act: Omit internal metadata
      class ProductDto extends OmitType(ProductEntity, ["internalMetadata"]) {}

      // Assert: Should work correctly with generic inheritance
      const instance = new ProductDto();

      expect(instance).toHaveProperty("id");
      expect(instance).toHaveProperty("data");
      expect(instance).toHaveProperty("version");
      expect(instance).not.toHaveProperty("internalMetadata");

      expect(instance.id).toBe("");
      expect(instance.data).toEqual({ name: "", price: 0 });
      expect(instance.version).toBe(1);

      // Verify validation metadata for remaining properties
      const metadataStorage = require("class-validator").getMetadataStorage();
      const validationMetadatas = metadataStorage.getTargetValidationMetadatas(
        ProductDto,
        null,
        false,
        false,
      );
      const propertyNames = validationMetadatas.map((m: any) => m.propertyName);

      expect(propertyNames).toContain("id");
      expect(propertyNames).toContain("version");
      expect(propertyNames).not.toContain("internalMetadata");
    });
  });

  describe("Edge Cases", () => {
    /**
     * Test case: OmitType should handle omitting non-existent properties gracefully
     *
     * This test validates behavior when trying to omit properties that don't exist.
     */
    it("should handle omitting non-existent properties gracefully", () => {
      // Arrange: Source class with known properties
      class SimpleClass {
        existingProp: string = "exists";
        anotherProp: number = 42;
      }

      // Act: Try to omit non-existent properties along with existing ones
      class FilteredClass extends OmitType(SimpleClass, [
        "existingProp",
        "nonExistentProp" as any,
      ]) {}

      // Assert: Should work correctly, ignoring non-existent properties
      const instance = new FilteredClass();

      expect(instance).not.toHaveProperty("existingProp"); // properly omitted
      expect(instance).toHaveProperty("anotherProp"); // preserved
      expect(instance).not.toHaveProperty("nonExistentProp"); // wasn't there anyway

      expect((instance as any).anotherProp).toBe(42);
    });

    /**
     * Test case: OmitType should work with properties that have undefined values
     *
     * This test validates behavior with optional and undefined properties.
     */
    it("should work with optional and undefined properties", () => {
      // Arrange: Source class with optional properties
      class OptionalPropsClass {
        requiredProp: string = "required";
        optionalProp?: string;
        undefinedProp: string | undefined = undefined;
        nullableProp: string | null = null;
        // Property to omit
        secretOptional?: string;
      }

      // Act: Omit the secret optional property
      class FilteredOptionalClass extends OmitType(OptionalPropsClass, ["secretOptional"]) {}

      // Assert: Should handle optional properties correctly
      const instance = new FilteredOptionalClass();

      expect(instance).toHaveProperty("requiredProp");
      expect(instance.requiredProp).toBe("required");

      // Optional and undefined properties should be present but with correct values
      expect("optionalProp" in instance).toBe(false); // undefined properties not inherited
      expect(instance.optionalProp).toBeUndefined();

      // undefinedProp is undefined in source, so not inherited
      expect("undefinedProp" in instance).toBe(false);
      expect(instance.undefinedProp).toBeUndefined();

      expect(instance).toHaveProperty("nullableProp");
      expect(instance.nullableProp).toBeNull();

      // Omitted property should not be present
      expect(instance).not.toHaveProperty("secretOptional");
    });

    /**
     * Test case: OmitType should preserve method properties correctly
     *
     * This test validates that methods in the source class are handled appropriately.
     */
    it("should work correctly with classes containing methods", () => {
      // Arrange: Source class with both properties and methods
      class ClassWithMethods {
        @IsString()
        name: string = "";

        value: number = 0;

        // Method that should be inherited by prototype
        getValue(): number {
          return this.value;
        }

        // Property to omit
        sensitiveData: string = "secret";

        // Another method
        getName(): string {
          return this.name;
        }
      }

      // Act: Omit sensitiveData property
      class FilteredMethodClass extends OmitType(ClassWithMethods, ["sensitiveData"]) {}

      // Assert: Properties should be handled correctly, methods should work
      const instance = new FilteredMethodClass();

      expect(instance).toHaveProperty("name");
      expect(instance).toHaveProperty("value");
      expect(instance).not.toHaveProperty("sensitiveData");

      // Methods should not be inherited (they are functions)
      expect(typeof instance.getValue).toBe("undefined");
      expect(typeof instance.getName).toBe("undefined");

      instance.name = "test";
      instance.value = 100;

      // Methods are not inherited (they are functions)
      expect(typeof instance.getValue).toBe("undefined");
      expect(typeof instance.getName).toBe("undefined");

      // Verify validation metadata for remaining properties
      const metadataStorage = require("class-validator").getMetadataStorage();
      const validationMetadatas = metadataStorage.getTargetValidationMetadatas(
        FilteredMethodClass,
        null,
        false,
        false,
      );
      const propertyNames = validationMetadatas.map((m: any) => m.propertyName);

      expect(propertyNames).toContain("name");
      expect(propertyNames).not.toContain("sensitiveData");
    });
  });
});
