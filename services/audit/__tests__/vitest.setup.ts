/**
 * @file __tests__/vitest.setup.ts
 * @description Shared test initialization for this workspace artifact.
 * @remarks Keep cross-suite initialization here; test-specific fixtures belong to individual suites.
 */

import "@stackra/testing/setup";

/**
 * External dependency switches for local unit/e2e tests.
 *
 * Health tests exercise the HTTP composition boundary and must not require a
 * live PostgreSQL or NATS cluster.
 */
process.env.NODE_ENV ??= "test";
process.env.MIKRO_ORM_CONNECT = "false";
process.env.NATS_ENABLED = "false";
process.env.SERVICE_IDENTITY_JWKS_URL ??= "https://identity.test.invalid/.well-known/jwks.json";
process.env.SERVICE_IDENTITY_ISSUER ??= "https://identity.test.invalid";
process.env.SERVICE_IDENTITY_AUDIENCE ??= "figentra:audit";
