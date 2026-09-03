/**
 * @file worker-configuration.d.ts
 * @description Generated Cloudflare Worker binding contract.
 *
 * @generated This file mirrors the Wrangler bindings required by the Worker.
 * Run `pnpm cf-typegen` after changing wrangler.jsonc. The generated output
 * should be treated as build metadata and must never contain secrets.
 */
interface CloudflareBindings {
  /** Authoritative D1 registry database. */
  DB: D1Database;
  /** Optional read-through route/metadata cache. */
  REGISTRY_CACHE: KVNamespace;
  /** Supabase/Identity JWKS endpoint. */
  IDENTITY_JWKS_URL: string;
  /** Trusted JWT issuer. */
  IDENTITY_ISSUER: string;
  /** JWT audience used by Registry API calls. */
  IDENTITY_AUDIENCE: string;
  /** Native Cloudflare rate limiter for registration abuse protection. */
  REGISTRATION_RATE_LIMITER: RateLimit;
  /** Dedicated registration audience. */
  REGISTRY_REGISTRATION_AUDIENCE: string;
  /** Dedicated Gateway route-resolution audience. */
  REGISTRY_ROUTE_RESOLUTION_AUDIENCE: string;
  /** Approved upstream DNS suffix. */
  REGISTRY_ALLOWED_UPSTREAM_SUFFIX: string;
}
