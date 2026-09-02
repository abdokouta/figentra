/**
 * @file security-and-validation.test.ts
 * @description Security perimeter, validation error handling, and authorization tests for Application Registry.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { createRegistry } from "@/app";
import { createTestD1Database, type MockD1Database } from "../helpers/d1-memory.helper";
import { MockKVNamespace } from "../helpers/kv-memory.helper";
import {
  createTestJwt,
  getTestJwtEnvironment,
  setupMockJwksFetch,
} from "../helpers/jwt.helper";

describe("Application Registry Security & Validation Test Suite", () => {
  let db: MockD1Database;
  let kv: MockKVNamespace;
  let env: Record<string, unknown>;

  beforeEach(async () => {
    await setupMockJwksFetch();
    const jwtEnv = await getTestJwtEnvironment();
    db = createTestD1Database();
    kv = new MockKVNamespace();

    env = {
      DB: db,
      REGISTRY_CACHE: kv,
      IDENTITY_JWKS_URL: jwtEnv.jwksUrl,
      IDENTITY_ISSUER: jwtEnv.issuer,
      IDENTITY_AUDIENCE: "figentra:registry",
      REGISTRY_REGISTRATION_AUDIENCE: "figentra:registry:registration",
      REGISTRY_ROUTE_RESOLUTION_AUDIENCE: "figentra:registry:route-resolution",
      REGISTRY_ALLOWED_UPSTREAM_SUFFIX: "figentra.com",
    };
  });

  it("rejects unauthenticated requests to protected endpoints with 401", async () => {
    const app = createRegistry();

    const appRes = await app.request("https://registry.internal/v1/applications/any", {}, env as never);
    expect(appRes.status).toBe(401);

    const regRes = await app.request(
      "https://registry.internal/v1/registrations",
      { method: "POST", body: "{}" },
      env as never,
    );
    expect(regRes.status).toBe(401);

    const resolveRes = await app.request(
      "https://registry.internal/v1/routes/resolve?method=GET&path=/test",
      {},
      env as never,
    );
    expect(resolveRes.status).toBe(401);
  });

  it("rejects user principals trying to invoke registration with 403", async () => {
    const app = createRegistry();
    const userToken = await createTestJwt({
      principal_type: "user",
      sub: "usr_regular_user_123",
      permissions: ["registry:application:register"],
      aud: ["figentra:registry:registration"],
    });

    const res = await app.request(
      "https://registry.internal/v1/registrations",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${userToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug: "test-app", displayName: "Test", version: "1.0.0", routes: [] }),
      },
      env as never,
    );

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; reason: string };
    expect(body.error).toBe("forbidden");
    expect(body.reason).toBe("service_registration_permission_required");
  });

  it("rejects tokens lacking registration permission with 403", async () => {
    const app = createRegistry();
    const serviceTokenWithoutPerm = await createTestJwt({
      principal_type: "service",
      sub: "svc_unprivileged",
      permissions: ["registry:read"],
      aud: ["figentra:registry:registration"],
    });

    const res = await app.request(
      "https://registry.internal/v1/registrations",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${serviceTokenWithoutPerm}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug: "test-app", displayName: "Test", version: "1.0.0", routes: [] }),
      },
      env as never,
    );

    expect(res.status).toBe(403);
  });

  it("rejects tokens lacking dedicated route-resolution audience with 403", async () => {
    const app = createRegistry();
    const serviceTokenWithoutAudience = await createTestJwt({
      principal_type: "service",
      sub: "svc_gateway",
      permissions: ["registry:route:resolve"],
      aud: ["figentra:registry"], // missing figentra:registry:route-resolution
    });

    const res = await app.request(
      "https://registry.internal/v1/routes/resolve?method=GET&path=/v1/users",
      {
        headers: { authorization: `Bearer ${serviceTokenWithoutAudience}` },
      },
      env as never,
    );

    expect(res.status).toBe(403);
  });

  it("validates application registration payload schema and rejects invalid upstream suffix", async () => {
    const app = createRegistry();
    const serviceToken = await createTestJwt({
      principal_type: "service",
      sub: "svc_deployer",
      permissions: ["registry:application:register"],
      aud: ["figentra:registry:registration"],
    });

    // 1. Invalid slug format (uppercase)
    const invalidSlugRes = await app.request(
      "https://registry.internal/v1/registrations",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${serviceToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug: "INVALID_SLUG",
          displayName: "Test",
          version: "1.0.0",
          routes: [],
        }),
      },
      env as never,
    );
    expect(invalidSlugRes.status).toBe(400);

    // 2. Untrusted upstream domain
    const untrustedUpstreamRes = await app.request(
      "https://registry.internal/v1/registrations",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${serviceToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug: "test-app",
          displayName: "Test App",
          version: "1.0.0",
          routes: [
            {
              method: "GET",
              pathPattern: "/v1/test",
              upstream: "https://evil.attacker.com/v1/test",
              audience: "figentra:test",
            },
          ],
        }),
      },
      env as never,
    );
    expect(untrustedUpstreamRes.status).toBe(400);
    const untrustedBody = (await untrustedUpstreamRes.json()) as { error: string };
    expect(untrustedBody.error).toBe("invalid_upstream");
  });

  it("returns 400 when route resolution parameters are missing", async () => {
    const app = createRegistry();
    const serviceToken = await createTestJwt({
      principal_type: "service",
      sub: "svc_gateway",
      permissions: ["registry:route:resolve"],
      aud: ["figentra:registry:route-resolution"],
    });

    const res = await app.request(
      "https://registry.internal/v1/routes/resolve", // missing method and path
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when route does not match any registered pattern", async () => {
    const app = createRegistry();
    const serviceToken = await createTestJwt({
      principal_type: "service",
      sub: "svc_gateway",
      permissions: ["registry:route:resolve"],
      aud: ["figentra:registry:route-resolution"],
    });

    const res = await app.request(
      "https://registry.internal/v1/routes/resolve?method=GET&path=/v1/nonexistent",
      {
        headers: { authorization: `Bearer ${serviceToken}` },
      },
      env as never,
    );

    expect(res.status).toBe(404);
  });
});
