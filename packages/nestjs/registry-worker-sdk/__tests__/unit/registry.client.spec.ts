/**
 * @file registry.client.spec.ts
 * @description Unit tests for RegistryClientService HTTP request construction and error handling.
 */

import { Test } from "@nestjs/testing";
import { RegistryClientService, RegistryClientError } from "../../src/services/registry-client.service";
import { REGISTRY_MODULE_OPTIONS } from "../../src/constants/registry.constants";
import type { RegistryModuleOptions } from "../../src/interfaces/registry-options.interface";
import type { ApplicationManifest } from "../../src/interfaces/registry-manifest.interface";

const OPTIONS: RegistryModuleOptions = {
  application: "test-service",
  displayName: "Test Service",
  version: "1.0.0",
  registryUrl: "http://localhost:8787",
  registrationToken: "test-bearer-token",
  registrationRetries: 1,
  registrationTimeoutMs: 5000,
  enabled: false,
};

const MINIMAL_MANIFEST: ApplicationManifest = {
  slug: "test-service",
  displayName: "Test Service",
  version: "1.0.0",
};

describe("RegistryClientService", () => {
  let client: RegistryClientService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistryClientService,
        { provide: REGISTRY_MODULE_OPTIONS, useValue: OPTIONS },
      ],
    }).compile();

    client = moduleRef.get(RegistryClientService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("register()", () => {
    it("should POST to /v1/registrations with the Bearer token", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "reg-123",
          slug: "test-service",
          version: "1.0.0",
          contentHash: "abc123",
        }),
      } as Response);

      const result = await client.register(MINIMAL_MANIFEST);
      expect(result.slug).toBe("test-service");
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8787/v1/registrations",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-bearer-token",
          }),
        }),
      );
    });

    it("should throw RegistryClientError on non-2xx response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: "validation_error" }),
      } as Response);

      await expect(client.register(MINIMAL_MANIFEST)).rejects.toBeInstanceOf(RegistryClientError);
    });

    it("should include status code in RegistryClientError", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: "validation_error" }),
      } as Response);

      const error = await client.register(MINIMAL_MANIFEST).catch((e) => e) as RegistryClientError;
      expect(error.status).toBe(422);
    });
  });

  describe("resolveRoute()", () => {
    it("should GET /v1/routes/resolve with method and path query parameters", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          slug: "audit",
          upstream: "http://audit:3000",
          audience: "figentra:audit",
        }),
      } as Response);

      const result = await client.resolveRoute("GET", "/api/audit/entries");
      expect(result.slug).toBe("audit");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/v1/routes/resolve"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(fetchMock.mock.calls[0][0]).toContain("method=GET");
    });
  });

  describe("getCatalog()", () => {
    it("should GET /v1/catalog/:category", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getCatalog("workflow");
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8787/v1/catalog/workflow",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should append application filter to query string", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getCatalog("event", { application: "audit" });
      expect(fetchMock.mock.calls[0][0]).toContain("application=audit");
    });
  });
});
