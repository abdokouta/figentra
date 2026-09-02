/**
 * @file index.test.ts
 * @description Production contract tests for the Application Registry.
 *
 * These tests cover the public security perimeter and health contracts. Real
 * D1, Identity, and service-binding integration tests run in CI against
 * environment-specific Cloudflare resources.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "./index.js";

function createEnv() {
  return {
    DB: {
      prepare: () => ({
        first: async () => ({ ok: 1 }),
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
        }),
        all: async () => ({ results: [] }),
      }),
      batch: async () => [],
    },
    REGISTRY_CACHE: undefined,
    IDENTITY_JWKS_URL: "https://identity.example.test/.well-known/jwks.json",
    IDENTITY_ISSUER: "https://identity.example.test/auth/v1",
    IDENTITY_AUDIENCE: "figentra:registry",
    REGISTRY_REGISTRATION_AUDIENCE: "figentra:registry:registration",
    REGISTRY_ROUTE_RESOLUTION_AUDIENCE: "figentra:registry:route-resolution",
    REGISTRY_ALLOWED_UPSTREAM_SUFFIX: "figentra.com",
  } as never;
}

describe("Application Registry production perimeter", () => {
  it("exposes liveness without authentication", async () => {
    const response = await createRegistry().request(
      "https://registry.example.test/health/live",
      {},
      createEnv(),
    );
    expect(response.status).toBe(200);
  });

  it("rejects protected registry calls without authentication", async () => {
    const response = await createRegistry().request(
      "https://registry.example.test/v1/applications/example",
      {},
      createEnv(),
    );
    expect(response.status).toBe(401);
  });

  it("rejects route resolution without an authorized service principal", async () => {
    const response = await createRegistry().request(
      "https://registry.example.test/v1/routes/resolve?method=GET&path=%2Fv1%2Ftest",
      {},
      createEnv(),
    );
    expect(response.status).toBe(401);
  });
});
