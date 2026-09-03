import { getAllMetadata } from "@/get-all-metadata";
import { defineMetadata } from "@/define-metadata";

describe("getAllMetadata", () => {
  describe("Basic Functionality", () => {
    /**
     * Test case: getAllMetadata should retrieve all requested metadata values
     *
     * This test validates the core functionality of retrieving multiple
     * metadata values in a single operation.
     */
    it("should return all metadata for specified keys", () => {
      // Arrange: Create a class with multiple metadata entries
      class TestClass {}
      const metadataKeys = ["config", "version", "author"];

      const configData = { timeout: 5000, retries: 3 };
      const versionData = "2.1.0";
      const authorData = { name: "John Doe", email: "john@example.com" };

      Reflect.defineMetadata("config", configData, TestClass.prototype);
      Reflect.defineMetadata("version", versionData, TestClass.prototype);
      Reflect.defineMetadata("author", authorData, TestClass.prototype);

      // Act: Retrieve all metadata at once
      const result = getAllMetadata<{
        config: typeof configData;
        version: string;
        author: typeof authorData;
      }>(metadataKeys, TestClass.prototype);

      // Assert: Should return all metadata values
      expect(result.config).toEqual(configData);
      expect(result.version).toBe(versionData);
      expect(result.author).toEqual(authorData);
      expect(Object.keys(result)).toHaveLength(3);
    });

    /**
     * Test case: getAllMetadata should handle missing metadata gracefully
     *
     * This test ensures that missing metadata values are returned as undefined
     * without breaking the overall operation.
     */
    it("should return undefined for missing metadata keys", () => {
      // Arrange: Create a class with partial metadata
      class TestClass {}
      const metadataKeys = ["existing", "missing1", "missing2"];

      const existingData = { exists: true };
      Reflect.defineMetadata("existing", existingData, TestClass);

      // Act: Request both existing and non-existing metadata
      const result = getAllMetadata<{
        existing: typeof existingData;
        missing1: any;
        missing2: any;
      }>(metadataKeys, TestClass);

      // Assert: Should return existing data and undefined for missing
      expect(result.existing).toEqual(existingData);
      expect(result.missing1).toBeUndefined();
      expect(result.missing2).toBeUndefined();
      expect(Object.keys(result)).toHaveLength(3);
    });

    /**
     * Test case: getAllMetadata should handle empty key arrays
     *
     * This test validates behavior when no keys are requested.
     */
    it("should return empty object for empty key array", () => {
      // Arrange: Create a class with metadata
      class TestClass {}
      Reflect.defineMetadata("someKey", "someValue", TestClass);

      // Act: Request no metadata keys
      const result = getAllMetadata<{}>([], TestClass);

      // Assert: Should return empty object
      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("Property-specific Metadata", () => {
    /**
     * Test case: getAllMetadata should retrieve metadata from specific properties
     *
     * This test validates retrieving multiple metadata values associated with
     * specific class properties.
     */
    it("should retrieve metadata from class properties", () => {
      // Arrange: Create a class with property metadata
      class UserModel {
        name: string = "";
        email: string = "";
        age: number = 0;
      }

      const nameValidation = { required: true, minLength: 2, maxLength: 50 };
      const nameFormat = { capitalize: true, trim: true };
      const nameDisplay = { label: "Full Name", placeholder: "Enter your name" };

      defineMetadata("validation", nameValidation, UserModel.prototype, "name");
      defineMetadata("format", nameFormat, UserModel.prototype, "name");
      defineMetadata("display", nameDisplay, UserModel.prototype, "name");

      // Act: Get all metadata for the 'name' property
      const result = getAllMetadata<{
        validation: typeof nameValidation;
        format: typeof nameFormat;
        display: typeof nameDisplay;
      }>(["validation", "format", "display"], UserModel.prototype, "name");

      // Assert: Should return all property-specific metadata
      expect(result.validation).toEqual(nameValidation);
      expect(result.format).toEqual(nameFormat);
      expect(result.display).toEqual(nameDisplay);
    });

    /**
     * Test case: getAllMetadata should distinguish between class and property metadata
     *
     * This test ensures that class-level and property-level metadata are kept separate.
     */
    it("should distinguish between class and property metadata", () => {
      // Arrange: Create class with both class and property metadata
      class ApiController {
        handleRequest(): void {}
      }

      const classConfig = { baseRoute: "/api", version: "v1" };
      const methodConfig = { route: "/users", method: "GET" };

      defineMetadata("config", classConfig, ApiController);
      defineMetadata("config", methodConfig, ApiController.prototype, "handleRequest");

      // Act: Get metadata from both class and method
      const classResult = getAllMetadata(["config"], ApiController);
      const methodResult = getAllMetadata(["config"], ApiController.prototype, "handleRequest");

      // Assert: Should return different metadata for each level
      expect(classResult.config).toEqual(classConfig);
      expect(methodResult.config).toEqual(methodConfig);
      expect(classResult.config).not.toEqual(methodResult.config);
    });
  });

  describe("Inheritance and Prototype Chain", () => {
    /**
     * Test case: getAllMetadata should retrieve inherited metadata
     *
     * This test validates that metadata from parent classes is accessible
     * through the prototype chain.
     */
    it("should retrieve metadata from parent classes", () => {
      // Arrange: Create inheritance hierarchy with metadata
      class BaseService {
        process(): void {}
      }
      class UserService extends BaseService {}

      const baseMetadata = { service: "base", level: 1 };
      const configMetadata = { timeout: 5000 };

      defineMetadata("service", baseMetadata, BaseService);
      defineMetadata("config", configMetadata, BaseService);

      // Act: Get metadata from child class
      const result = getAllMetadata<{
        service: typeof baseMetadata;
        config: typeof configMetadata;
      }>(["service", "config"], UserService);

      // Assert: Should retrieve inherited metadata
      expect(result.service).toEqual(baseMetadata);
      expect(result.config).toEqual(configMetadata);
    });

    /**
     * Test case: getAllMetadata should prioritize child metadata over parent metadata
     *
     * This test ensures that when both parent and child define the same metadata key,
     * the child's metadata takes precedence.
     */
    it("should prioritize child metadata over parent metadata", () => {
      // Arrange: Create inheritance with overriding metadata
      class ParentClass {}
      class ChildClass extends ParentClass {}

      const parentData = { source: "parent", priority: 1 };
      const childData = { source: "child", priority: 2 };
      const sharedData = { shared: true };

      defineMetadata("override", parentData, ParentClass);
      defineMetadata("shared", sharedData, ParentClass);
      defineMetadata("override", childData, ChildClass);

      // Act: Get metadata from child class
      const result = getAllMetadata<{
        override: typeof childData;
        shared: typeof sharedData;
      }>(["override", "shared"], ChildClass);

      // Assert: Child metadata should override parent, shared should be inherited
      expect(result.override).toEqual(childData);
      expect(result.override.source).toBe("child");
      expect(result.shared).toEqual(sharedData);
    });
  });

  describe("Type Safety and Complex Structures", () => {
    /**
     * Test case: getAllMetadata should work with complex nested metadata structures
     *
     * This test validates handling of complex, deeply nested metadata objects.
     */
    it("should handle complex nested metadata structures", () => {
      // Arrange: Create complex metadata structures
      class APIEndpoint {}

      const routeConfig = {
        method: "POST",
        path: "/api/users/:id",
        middleware: ["auth", "validation"],
        parameters: {
          path: { id: { type: "string", required: true } },
          body: { user: { type: "object", required: true } },
        },
      };

      const securityConfig = {
        authentication: { required: true, type: "bearer" },
        authorization: { roles: ["admin", "user"], permissions: ["user:write"] },
        rateLimit: { requests: 100, window: 3600 },
      };

      const docsConfig = {
        title: "Update User",
        description: "Updates an existing user record",
        tags: ["users", "management"],
        examples: {
          request: { user: { name: "John", email: "john@example.com" } },
          response: { success: true, user: { id: 1, name: "John" } },
        },
      };

      defineMetadata("route", routeConfig, APIEndpoint);
      defineMetadata("security", securityConfig, APIEndpoint);
      defineMetadata("docs", docsConfig, APIEndpoint);

      // Act: Retrieve all complex metadata
      const result = getAllMetadata<{
        route: typeof routeConfig;
        security: typeof securityConfig;
        docs: typeof docsConfig;
      }>(["route", "security", "docs"], APIEndpoint);

      // Assert: Complex structures should be preserved
      expect(result.route).toEqual(routeConfig);
      expect(result.route.parameters.path.id.type).toBe("string");
      expect(result.security.authorization.roles).toContain("admin");
      expect(result.docs.examples.request.user.name).toBe("John");
    });

    /**
     * Test case: getAllMetadata should provide proper TypeScript type inference
     *
     * This test validates that the generic type parameter works correctly.
     */
    it("should provide type-safe metadata retrieval", () => {
      // Arrange: Define typed metadata interfaces
      interface ServiceConfig {
        name: string;
        version: string;
        endpoints: string[];
      }

      interface CacheConfig {
        enabled: boolean;
        ttl: number;
        strategy: "lru" | "fifo";
      }

      class MicroService {}

      const serviceConfig: ServiceConfig = {
        name: "user-service",
        version: "2.1.0",
        endpoints: ["/users", "/auth", "/profile"],
      };

      const cacheConfig: CacheConfig = {
        enabled: true,
        ttl: 3600,
        strategy: "lru",
      };

      defineMetadata("service", serviceConfig, MicroService);
      defineMetadata("cache", cacheConfig, MicroService);

      // Act: Retrieve with strong typing
      const result = getAllMetadata<{
        service: ServiceConfig;
        cache: CacheConfig;
      }>(["service", "cache"], MicroService);

      // Assert: Should return properly typed metadata
      expect(result.service).toEqual(serviceConfig);
      expect(result.service.endpoints).toHaveLength(3);
      expect(result.cache.strategy).toBe("lru");
      expect(typeof result.service.version).toBe("string");
      expect(typeof result.cache.enabled).toBe("boolean");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    /**
     * Test case: getAllMetadata should handle Symbol keys
     *
     * This test validates that Symbol keys work correctly in batch operations.
     */
    it("should work with Symbol metadata keys", () => {
      // Arrange: Create metadata with Symbol keys
      class TestClass {}
      const symbol1 = Symbol("internal-config");
      const symbol2 = Symbol("debug-info");

      const internalConfig = { debug: true, level: "verbose" };
      const debugInfo = { timestamp: Date.now(), session: "test-session" };

      defineMetadata(symbol1, internalConfig, TestClass);
      defineMetadata(symbol2, debugInfo, TestClass);

      // Act: Retrieve metadata using Symbol keys
      const result = getAllMetadata<{
        [symbol1]: typeof internalConfig;
        [symbol2]: typeof debugInfo;
      }>([symbol1, symbol2], TestClass);

      // Assert: Symbol keys should work correctly
      expect(result[symbol1]).toEqual(internalConfig);
      expect(result[symbol2]).toEqual(debugInfo);
    });

    /**
     * Test case: getAllMetadata should work with mixed key types
     *
     * This test validates handling of different key types in the same request.
     */
    it("should work with mixed key types", () => {
      // Arrange: Create metadata with different key types
      class TestClass {}
      const stringKey = "string-metadata";
      const symbolKey = Symbol("symbol-metadata");
      const numberKey = 42;

      const stringValue = "string data";
      const symbolValue = { symbol: true };
      const numberValue = ["numeric", "array"];

      defineMetadata(stringKey, stringValue, TestClass);
      defineMetadata(symbolKey, symbolValue, TestClass);
      defineMetadata(numberKey, numberValue, TestClass);

      // Act: Retrieve metadata with mixed key types
      const result = getAllMetadata<{
        [stringKey]: string;
        [symbolKey]: typeof symbolValue;
        [numberKey]: string[];
      }>([stringKey, symbolKey, numberKey], TestClass);

      // Assert: All key types should work
      expect(result[stringKey]).toBe(stringValue);
      expect(result[symbolKey]).toEqual(symbolValue);
      expect(result[numberKey]).toEqual(numberValue);
    });

    /**
     * Test case: getAllMetadata should work with class instances
     *
     * This test ensures the function works with class instances, not just constructors.
     */
    it("should work with class instances", () => {
      // Arrange: Create instances with metadata
      class TestClass {
        instanceId: string;
        constructor(id: string) {
          this.instanceId = id;
        }
      }

      const instance1 = new TestClass("instance-1");
      const instance2 = new TestClass("instance-2");

      const config1 = { instance: 1, active: true };
      const config2 = { instance: 2, active: false };
      const settings1 = { theme: "dark", lang: "en" };
      const settings2 = { theme: "light", lang: "es" };

      defineMetadata("config", config1, instance1);
      defineMetadata("settings", settings1, instance1);
      defineMetadata("config", config2, instance2);
      defineMetadata("settings", settings2, instance2);

      // Act: Get metadata from different instances
      const result1 = getAllMetadata<{
        config: typeof config1;
        settings: typeof settings1;
      }>(["config", "settings"], instance1);

      const result2 = getAllMetadata<{
        config: typeof config2;
        settings: typeof settings2;
      }>(["config", "settings"], instance2);

      // Assert: Each instance should have its own metadata
      expect(result1.config).toEqual(config1);
      expect(result1.settings).toEqual(settings1);
      expect(result2.config).toEqual(config2);
      expect(result2.settings).toEqual(settings2);

      // Instances should not interfere with each other
      expect(result1.config).not.toEqual(config2);
      expect(result1.settings).not.toEqual(settings2);
    });
  });
});
