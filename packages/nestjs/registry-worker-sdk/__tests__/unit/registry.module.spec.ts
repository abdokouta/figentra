/**
 * @file registry.module.spec.ts
 * @description Unit tests for RegistryModule dynamic module variants.
 */

import { Test } from "@nestjs/testing";
import { RegistryModule } from "../../src/registry.module";
import { RegistryService } from "../../src/services/registry.service";
import { RegistryClientService } from "../../src/services/registry-client.service";
import type { RegistryModuleOptions } from "../../src/interfaces/registry-options.interface";

const BASE_OPTIONS: RegistryModuleOptions = {
  application: "test-service",
  displayName: "Test Service",
  version: "1.0.0",
  registryUrl: "http://localhost:8787",
  registrationToken: "test-token",
  enabled: false, // disable auto-registration in tests
};

describe("RegistryModule", () => {
  describe("forRoot()", () => {
    it("should provide RegistryService and RegistryClientService", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [RegistryModule.forRoot(BASE_OPTIONS)],
      }).compile();

      expect(moduleRef.get(RegistryService)).toBeDefined();
      expect(moduleRef.get(RegistryClientService)).toBeDefined();
    });

    it("should inject options with REGISTRY_MODULE_OPTIONS token", async () => {
      const { REGISTRY_MODULE_OPTIONS } = await import("../../src/constants/registry.constants");
      const moduleRef = await Test.createTestingModule({
        imports: [RegistryModule.forRoot(BASE_OPTIONS)],
      }).compile();

      const options = moduleRef.get<RegistryModuleOptions>(REGISTRY_MODULE_OPTIONS);
      expect(options.application).toBe("test-service");
      expect(options.version).toBe("1.0.0");
    });
  });

  describe("forRootAsync() — useFactory", () => {
    it("should resolve options from factory and provide RegistryService", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          RegistryModule.forRootAsync({
            useFactory: () => BASE_OPTIONS,
          }),
        ],
      }).compile();

      expect(moduleRef.get(RegistryService)).toBeDefined();
    });

    it("should support injecting dependencies into the factory via module imports", async () => {
      const TOKEN = "MY_REGISTRY_URL";

      // The external token is provided in a NestJS module that's imported via asyncOptions.imports.
      const { Module } = await import("@nestjs/common");

      @Module({ providers: [{ provide: TOKEN, useValue: "http://test-registry.example.com" }], exports: [TOKEN] })
      class ConfigStubModule {}

      const moduleRef = await Test.createTestingModule({
        imports: [
          RegistryModule.forRootAsync({
            imports: [ConfigStubModule],
            useFactory: (url: string) => ({ ...BASE_OPTIONS, registryUrl: url }),
            inject: [TOKEN],
          }),
        ],
      }).compile();

      const { REGISTRY_MODULE_OPTIONS } = await import("../../src/constants/registry.constants");
      const options = moduleRef.get<RegistryModuleOptions>(REGISTRY_MODULE_OPTIONS);
      expect(options.registryUrl).toBe("http://test-registry.example.com");
    });
  });

  describe("forFeature()", () => {
    it("should register feature provider without exposing root services", async () => {
      const featureModule = RegistryModule.forFeature({
        modules: [{ key: "billing", description: "Billing management" }],
      });

      expect(featureModule.providers?.length).toBeGreaterThan(0);
      expect(featureModule.exports?.length).toBe(0);
    });
  });
});
