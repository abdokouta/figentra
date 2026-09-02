/**
 * @file registry.service.spec.ts
 * @description Unit tests for RegistryService manifest assembly and bootstrap lifecycle.
 */

import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { DiscoveryModule } from "@nestjs/core";
import { Injectable } from "@nestjs/common";
import { RegistryService } from "../../src/services/registry.service";
import { RegistryClientService } from "../../src/services/registry-client.service";
import { RegistryDiscoveryService } from "../../src/services/registry-discovery.service";
import { REGISTRY_MODULE_OPTIONS, REGISTRY_FEATURES } from "../../src/constants/registry.constants";
import { RegisterModule, RegisterResource, RegisterAction } from "../../src/decorators";
import type { RegistryModuleOptions } from "../../src/interfaces/registry-options.interface";
import type { RegistryFeature } from "../../src/interfaces/registry-feature.interface";

const OPTIONS: RegistryModuleOptions = {
  application: "test-service",
  displayName: "Test Service",
  version: "1.2.3",
  registryUrl: "http://localhost:8787",
  registrationToken: "test-token",
  enabled: true,
  failOnRegistrationError: false,
};

@RegisterModule({ key: "audit" })
@RegisterResource({ key: "audit-entry", moduleKey: "audit" })
@RegisterAction({ key: "audit-entry:read", resourceKey: "audit-entry", permission: "audit:read" })
@Injectable()
class MockAuditController {}

const FEATURE: RegistryFeature = {
  modules: [{ key: "billing" }],
  resources: [{ key: "invoice", moduleKey: "billing" }],
};

describe("RegistryService", () => {
  let service: RegistryService;
  let clientMock: { register: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clientMock = { register: vi.fn().mockResolvedValue({ id: "r1", slug: "test-service", version: "1.2.3", contentHash: "h" }) };

    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        RegistryDiscoveryService,
        RegistryService,
        MockAuditController,
        { provide: REGISTRY_MODULE_OPTIONS, useValue: OPTIONS },
        { provide: RegistryClientService, useValue: clientMock },
        { provide: REGISTRY_FEATURES, useValue: [FEATURE] },
      ],
    }).compile();

    service = moduleRef.get(RegistryService);
  });

  it("should call client.register() on application bootstrap", async () => {
    await service.onApplicationBootstrap();
    expect(clientMock.register).toHaveBeenCalledTimes(1);
  });

  it("should build a manifest with correct slug and version", async () => {
    await service.onApplicationBootstrap();
    const [manifest] = clientMock.register.mock.calls[0] as [any];
    expect(manifest.slug).toBe("test-service");
    expect(manifest.version).toBe("1.2.3");
    expect(manifest.displayName).toBe("Test Service");
  });

  it("should include feature modules in the manifest", async () => {
    await service.onApplicationBootstrap();
    const [manifest] = clientMock.register.mock.calls[0] as [any];
    const moduleKeys = manifest.modules?.map((m: any) => m.key);
    expect(moduleKeys).toContain("billing");
    expect(moduleKeys).toContain("audit");
  });

  it("should include discovered actions in the manifest", async () => {
    await service.onApplicationBootstrap();
    const [manifest] = clientMock.register.mock.calls[0] as [any];
    expect(manifest.actions?.some((a: any) => a.key === "audit-entry:read")).toBe(true);
  });

  it("should expose the manifest via getManifest() after bootstrap", async () => {
    expect(service.getManifest()).toBeNull();
    await service.onApplicationBootstrap();
    expect(service.getManifest()?.slug).toBe("test-service");
  });

  it("should not call register() when enabled = false", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        RegistryDiscoveryService,
        RegistryService,
        { provide: REGISTRY_MODULE_OPTIONS, useValue: { ...OPTIONS, enabled: false } },
        { provide: RegistryClientService, useValue: clientMock },
      ],
    }).compile();

    const disabledService = moduleRef.get(RegistryService);
    await disabledService.onApplicationBootstrap();
    expect(clientMock.register).not.toHaveBeenCalled();
  });

  it("should not throw when registration fails and failOnRegistrationError = false", async () => {
    clientMock.register.mockRejectedValueOnce(new Error("network error"));
    await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
  });

  it("should rethrow when registration fails and failOnRegistrationError = true", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        RegistryDiscoveryService,
        RegistryService,
        { provide: REGISTRY_MODULE_OPTIONS, useValue: { ...OPTIONS, failOnRegistrationError: true } },
        { provide: RegistryClientService, useValue: { register: vi.fn().mockRejectedValue(new Error("fail")) } },
      ],
    }).compile();

    const strictService = moduleRef.get(RegistryService);
    await expect(strictService.onApplicationBootstrap()).rejects.toThrow("fail");
  });
});
