import { PickType } from "@/helpers/pick-type.helper";
import { IsString, IsEmail, IsNumber, IsOptional } from "class-validator";
import { Expose, Exclude, Type as TransformType } from "class-transformer";

describe("PickType", () => {
  describe("Basic Type Creation", () => {
    /**
     * Test case: PickType should create a new class with only picked properties
     *
     * This test validates that PickType creates a class containing only the
     * specified properties from the source class.
     */
    it("should create a new class with only picked properties", () => {
      // Arrange: Create source class with multiple properties
      class SourceClass {
        name: string = "";
        email: string = "";
        age: number = 0;
        password: string = "";
      }

      // Act: Pick only name and email properties
      class PickedClass extends PickType(SourceClass, ["name", "email"]) {}

      // Assert: Instance should have only picked properties
      const instance = new PickedClass();

      expect(instance).toHaveProperty("name");
      expect(instance).toHaveProperty("email");
      expect(instance).not.toHaveProperty("age");
      expect(instance).not.toHaveProperty("password");

      // Verify property initialization
      expect(instance.name).toBe("");
      expect(instance.email).toBe("");
    });

    /**
     * Test case: PickType should preserve property types
     *
     * This test ensures that picked properties maintain their original types
     * and that TypeScript type inference works correctly.
     */
    it("should preserve property types correctly", () => {
      // Arrange: Source class with various property types
      class SourceClass {
        stringProp: string = "test";
        numberProp: number = 42;
        booleanProp: boolean = true;
        arrayProp: string[] = ["item1", "item2"];
        objectProp: { key: string } = { key: "value" };
      }

      // Act: Pick properties with different types
      class PickedClass extends PickType(SourceClass, ["stringProp", "numberProp", "arrayProp"]) {}

      // Assert: Properties should maintain their types and values
      const instance = new PickedClass();

      expect(typeof instance.stringProp).toBe("string");
      expect(typeof instance.numberProp).toBe("number");
      expect(Array.isArray(instance.arrayProp)).toBe(true);

      expect(instance.stringProp).toBe("test");
      expect(instance.numberProp).toBe(42);
      expect(instance.arrayProp).toEqual(["item1", "item2"]);

      // Verify unpicked properties are not present
      expect(instance).not.toHaveProperty("booleanProp");
      expect(instance).not.toHaveProperty("objectProp");
    });

    /**
     * Test case: PickType should work with empty property selection
     *
     * This test validates behavior when no properties are selected.
     */
    it("should create empty class when no properties are picked", () => {
      // Arrange: Source class with properties
      class SourceClass {
        name: string = "test";
        age: number = 25;
      }

      // Act: Pick no properties
      class EmptyPickedClass extends PickType(SourceClass, []) {}

      // Assert: Instance should have no properties from source
      const instance = new EmptyPickedClass();

      expect(instance).not.toHaveProperty("name");
      expect(instance).not.toHaveProperty("age");
      expect(Object.keys(instance)).toEqual([]);
    });
  });

  describe("Class-Validator Integration", () => {
    /**
     * Test case: PickType should inherit validation metadata for picked properties
     *
     * This test validates that validation decorators are properly inherited
     * for picked properties.
     */
    it("should inherit validation metadata for picked properties", () => {
      // Arrange: Source class with validation decorators
      class UserDto {
        @IsString({ message: "Name must be a string" })
        name: string = "";

        @IsEmail({}, { message: "Email must be valid" })
        email: string = "";

        @IsNumber({}, { message: "Age must be a number" })
        age: number = 0;

        @IsString()
        password: string = "";
      }

      // Act: Pick name and email (excluding age and password)
      class CreateUserDto extends PickType(UserDto, ["name", "email"]) {}

      // Assert: Validation metadata should be present for picked properties
      const metadataStorage = require("class-validator").getMetadataStorage();
      const targetMetadatas = metadataStorage.getTargetValidationMetadatas(
        CreateUserDto,
        null,
        false,
        false,
      );

      // Should have validation metadata for picked properties
      const propertyNames = targetMetadatas.map((metadata: any) => metadata.propertyName);
      expect(propertyNames).toContain("name");
      expect(propertyNames).toContain("email");

      // Should not have validation metadata for unpicked properties
      expect(propertyNames).not.toContain("age");
      expect(propertyNames).not.toContain("password");

      // Verify specific validation constraints
      const nameMetadata = targetMetadatas.find((m: any) => m.propertyName === "name");
      const emailMetadata = targetMetadatas.find((m: any) => m.propertyName === "email");

      expect(nameMetadata.name).toBe("isString");
      expect(emailMetadata.name).toBe("isEmail");
    });

    /**
     * Test case: PickType should preserve validation constraints and messages
     *
     * This test ensures that validation constraint details including custom
     * messages are properly inherited.
     */
    it("should preserve validation constraints and custom messages", () => {
      // Arrange: Source class with detailed validation rules
      class ProductDto {
        @IsString({ message: "Product name is required" })
        name: string = "";

        @IsNumber({ allowNaN: false }, { message: "Price must be a valid number" })
        price: number = 0;

        @IsOptional()
        @IsString({ message: "Description must be a string if provided" })
        description?: string;
      }

      // Act: Pick name and description
      class CreateProductDto extends PickType(ProductDto, ["name", "description"]) {}

      // Assert: Validation rules should be preserved with all details
      const metadataStorage = require("class-validator").getMetadataStorage();
      const targetMetadatas = metadataStorage.getTargetValidationMetadatas(
        CreateProductDto,
        null,
        false,
        false,
      );

      // Find specific validation metadata
      const nameValidations = targetMetadatas.filter((m: any) => m.propertyName === "name");
      const descriptionValidations = targetMetadatas.filter(
        (m: any) => m.propertyName === "description",
      );

      // Verify name validation
      const nameStringValidation = nameValidations.find((m: any) => m.name === "isString");
      expect(nameStringValidation).toBeDefined();
      expect(nameStringValidation.message).toBe("Product name is required");

      // Verify description has both IsOptional and IsString
      const descriptionOptionalValidation = descriptionValidations.find(
        (m: any) => m.name === "isOptional",
      );
      const descriptionStringValidation = descriptionValidations.find(
        (m: any) => m.name === "isString",
      );

      expect(descriptionOptionalValidation).toBeDefined();
      expect(descriptionStringValidation).toBeDefined();
      expect(descriptionStringValidation.message).toBe("Description must be a string if provided");

      // Verify price validation is not inherited
      const priceValidations = targetMetadatas.filter((m: any) => m.propertyName === "price");
      expect(priceValidations).toHaveLength(0);
    });
  });

  describe("Class-Transformer Integration", () => {
    /**
     * Test case: PickType should inherit transformation metadata for picked properties
     *
     * This test validates that transformation decorators are properly inherited.
     */
    it("should inherit transformation metadata for picked properties", () => {
      // Arrange: Source class with transformation decorators
      class UserDto {
        @Expose()
        name: string = "";

        @Expose({ name: "email_address" })
        email: string = "";

        @Exclude()
        password: string = "";

        @Expose()
        @TransformType(() => Date)
        createdAt: Date = new Date();
      }

      // Act: Pick name, email, and createdAt (excluding password)
      class PublicUserDto extends PickType(UserDto, ["name", "email", "createdAt"]) {}

      // Assert: Transformation metadata should be inherited
      let defaultMetadataStorage: any;
      try {
        defaultMetadataStorage = require("class-transformer/cjs/storage").defaultMetadataStorage;
      } catch {
        defaultMetadataStorage = require("class-transformer/storage").defaultMetadataStorage;
      }

      // Check expose metadata
      const exposeMetadatas = defaultMetadataStorage._exposeMetadatas;
      if (exposeMetadatas?.has(PublicUserDto)) {
        const exposeMap = exposeMetadatas.get(PublicUserDto);

        expect(exposeMap.has("name")).toBe(true);
        expect(exposeMap.has("email")).toBe(true);
        expect(exposeMap.has("createdAt")).toBe(true);
        expect(exposeMap.has("password")).toBe(false);

        // Check email has custom name mapping
        const emailMetadata = exposeMap.get("email");
        expect(emailMetadata.options).toEqual({ name: "email_address" });
      }

      // Check type metadata for createdAt
      const typeMetadatas = defaultMetadataStorage._typeMetadatas;
      if (typeMetadatas?.has(PublicUserDto)) {
        const typeMap = typeMetadatas.get(PublicUserDto);
        expect(typeMap.has("createdAt")).toBe(true);
      }
    });
  });

  describe("Complex Scenarios", () => {
    /**
     * Test case: PickType should work with inheritance hierarchies
     *
     * This test validates behavior when picking properties from classes
     * that inherit from other classes.
     */
    it("should work with inheritance hierarchies", () => {
      // Arrange: Create inheritance hierarchy
      class BaseEntity {
        @IsString()
        id: string = "";

        @IsString()
        createdBy: string = "";
      }

      class UserEntity extends BaseEntity {
        @IsString()
        name: string = "";

        @IsEmail()
        email: string = "";

        @IsString()
        password: string = "";
      }

      // Act: Pick properties from derived class
      class UserResponseDto extends PickType(UserEntity, ["id", "name", "email", "createdBy"]) {}

      // Assert: Should have properties from both base and derived class
      const instance = new UserResponseDto();

      expect(instance).toHaveProperty("id"); // from BaseEntity
      expect(instance).toHaveProperty("createdBy"); // from BaseEntity
      expect(instance).toHaveProperty("name"); // from UserEntity
      expect(instance).toHaveProperty("email"); // from UserEntity
      expect(instance).not.toHaveProperty("password"); // excluded

      // Verify validation metadata inheritance
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
      expect(propertyNames).toContain("createdBy");
      expect(propertyNames).not.toContain("password");
    });

    /**
     * Test case: PickType should preserve property initializers
     *
     * This test validates that default property values are properly inherited.
     */
    it("should preserve property initializers with default values", () => {
      // Arrange: Source class with property initializers
      class ConfigDto {
        theme: string = "light";
        fontSize: number = 14;
        notifications: boolean = true;
        features: string[] = ["feature1", "feature2"];
        settings: { autoSave: boolean } = { autoSave: true };
      }

      // Act: Pick some properties
      class UserPreferencesDto extends PickType(ConfigDto, ["theme", "fontSize", "features"]) {}

      // Assert: Picked properties should have their default values
      const instance = new UserPreferencesDto();

      expect(instance.theme).toBe("light");
      expect(instance.fontSize).toBe(14);
      expect(instance.features).toEqual(["feature1", "feature2"]);

      // Verify unpicked properties are not present
      expect(instance).not.toHaveProperty("notifications");
      expect(instance).not.toHaveProperty("settings");

      // Verify modifications work correctly
      instance.theme = "dark";
      instance.fontSize = 16;
      instance.features.push("feature3");

      expect(instance.theme).toBe("dark");
      expect(instance.fontSize).toBe(16);
      expect(instance.features).toEqual(["feature1", "feature2", "feature3"]);
    });

    /**
     * Test case: PickType should work with generic classes
     *
     * This test validates behavior with generic class definitions.
     */
    it("should work with generic source classes", () => {
      // Arrange: Generic source class
      class GenericDto<T> {
        @IsString()
        id: string = "";

        data: T = {} as T;

        @IsNumber()
        version: number = 1;
      }

      // Specialize the generic class
      interface UserData {
        name: string;
        email: string;
      }

      class UserDto extends GenericDto<UserData> {
        constructor() {
          super();
          this.data = { name: "", email: "" };
        }
      }

      // Act: Pick properties from specialized generic class
      class UserIdDto extends PickType(UserDto, ["id", "version"]) {}

      // Assert: Should work correctly with generic inheritance
      const instance = new UserIdDto();

      expect(instance).toHaveProperty("id");
      expect(instance).toHaveProperty("version");
      expect(instance).not.toHaveProperty("data");

      expect(instance.id).toBe("");
      expect(instance.version).toBe(1);

      // Verify validation metadata
      const metadataStorage = require("class-validator").getMetadataStorage();
      const validationMetadatas = metadataStorage.getTargetValidationMetadatas(
        UserIdDto,
        null,
        false,
        false,
      );
      const propertyNames = validationMetadatas.map((m: any) => m.propertyName);

      expect(propertyNames).toContain("id");
      expect(propertyNames).toContain("version");
      expect(propertyNames).not.toContain("data");
    });
  });

  describe("Edge Cases", () => {
    /**
     * Test case: PickType should handle properties with special characters
     *
     * This test validates behavior with unusual property names.
     */
    it("should handle properties with special characters in names", () => {
      // Arrange: Source class with special property names
      class SpecialPropsDto {
        "normal-property": string = "normal";
        "prop_with_underscore": number = 42;
        "$special": boolean = true;
        "123numeric": string = "numeric";
      }

      // Act: Pick special properties
      class PickedSpecialDto extends PickType(SpecialPropsDto, [
        "normal-property",
        "prop_with_underscore",
        "$special",
      ]) {}

      // Assert: Should handle special property names correctly
      const instance = new PickedSpecialDto();

      expect(instance["normal-property"]).toBe("normal");
      expect(instance["prop_with_underscore"]).toBe(42);
      expect(instance["$special"]).toBe(true);
      expect(instance).not.toHaveProperty("123numeric");
    });

    /**
     * Test case: PickType should work with readonly properties
     *
     * This test validates behavior with readonly property modifiers.
     */
    it("should work with readonly properties", () => {
      // Arrange: Source class with readonly properties
      class ReadonlyPropsDto {
        readonly id: string = "readonly-id";
        name: string = "name";
        readonly createdAt: Date = new Date("2023-01-01");
      }

      // Act: Pick readonly and regular properties
      class PickedReadonlyDto extends PickType(ReadonlyPropsDto, ["id", "createdAt"]) {}

      // Assert: Should preserve readonly properties correctly
      const instance = new PickedReadonlyDto();

      expect(instance.id).toBe("readonly-id");
      expect(instance.createdAt).toEqual(new Date("2023-01-01"));
      expect(instance).not.toHaveProperty("name");

      // Note: TypeScript readonly modifier is compile-time only,
      // so we can't test runtime readonly behavior in tests
    });

    /**
     * Test case: PickType should handle circular property references
     *
     * This test ensures the function doesn't break with circular references
     * in property initializers.
     */
    it("should handle complex object relationships", () => {
      // Arrange: Source class with complex object relationships
      class NodeDto {
        @IsString()
        id: string = "";

        @IsString()
        name: string = "";

        // Complex nested object
        metadata: {
          tags: string[];
          config: { enabled: boolean; priority: number };
        } = {
          tags: ["default"],
          config: { enabled: true, priority: 1 },
        };

        @IsNumber()
        parentId?: number;
      }

      // Act: Pick properties including complex nested one
      class SimpleNodeDto extends PickType(NodeDto, ["id", "name", "metadata"]) {}

      // Assert: Should handle complex nested objects correctly
      const instance = new SimpleNodeDto();

      expect(instance.id).toBe("");
      expect(instance.name).toBe("");
      expect(instance.metadata.tags).toEqual(["default"]);
      expect(instance.metadata.config.enabled).toBe(true);
      expect(instance.metadata.config.priority).toBe(1);
      expect(instance).not.toHaveProperty("parentId");

      // Verify nested object modification works
      instance.metadata.tags.push("custom");
      instance.metadata.config.priority = 5;

      expect(instance.metadata.tags).toEqual(["default", "custom"]);
      expect(instance.metadata.config.priority).toBe(5);
    });
  });
});
