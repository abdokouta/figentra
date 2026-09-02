/**
 * @file registry-bindings.interface.ts
 * @description Cloudflare binding contract for the Application Registry.
 */

/**
 * Runtime bindings required by the Registry control plane.
 */
export interface RegistryBindings {
  /** Authoritative D1 database. */
  readonly DB: D1Database;
  /** Optional non-authoritative read cache. */
  readonly REGISTRY_CACHE?: KVNamespace;
  /** Registration abuse-prevention limiter. */
  readonly REGISTRATION_RATE_LIMITER?: RateLimit;
  /** Identity/Supabase JWKS endpoint. */
  readonly IDENTITY_JWKS_URL: string;
  /** Trusted Identity issuer. */
  readonly IDENTITY_ISSUER: string;
  /** Normal Registry audience. */
  readonly IDENTITY_AUDIENCE: string;
  /** Gateway route-resolution audience. */
  readonly REGISTRY_ROUTE_RESOLUTION_AUDIENCE: string;
  /** Application registration audience. */
  readonly REGISTRY_REGISTRATION_AUDIENCE: string;
  /** Approved upstream DNS suffix. */
  readonly REGISTRY_ALLOWED_UPSTREAM_SUFFIX: string;
}
