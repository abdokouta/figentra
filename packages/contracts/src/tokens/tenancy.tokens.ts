/**
 * @file tenancy.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for `@stackra/tenancy` — host-aware
 *   multi-tenant SaaS resolution.
 *
 *   Tokens live in contracts so cross-package consumers (routing
 *   guards, dashboard chrome, auth-ui workspace picker) can inject
 *   tenancy state without pulling in the `@stackra/tenancy` runtime.
 *
 *   Every token uses `Symbol.for(...)` so the identity is observed
 *   across module realms.
 */

/**
 * DI token for the `ITenancyService` singleton — the top-level host
 * classifier + active-tenant store.
 *
 * @remarks Bound by `TenancyModule.forRoot`.
 */
export const TENANCY_SERVICE = Symbol.for("TENANCY_SERVICE");

/**
 * DI token for the resolved `ITenancyConfig` — the merged options
 * (defaults ∪ user overrides) that `TenancyService` reads to
 * classify hosts.
 *
 * @remarks Bound by `TenancyModule.forRoot`.
 */
export const TENANCY_CONFIG = "tenancy" as const;

/**
 * DI token for the platform-specific `IHostResolver`.
 *
 * @remarks Bound by `WebTenancyModule.forRoot` (browser resolver)
 *   and `NativeTenancyModule.forRoot` (SecureStore-backed resolver).
 *   Consumers who only need to know the raw host inject this token;
 *   consumers who want the classified state inject
 *   {@link TENANCY_SERVICE} instead.
 */
export const HOST_RESOLVER = Symbol.for("HOST_RESOLVER");
