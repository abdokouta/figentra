/**
 * @file host-context-resolution.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description The output shape of `resolveHostContext(host, config)`
 *   — a `HostContext` classification plus the extracted tenant slug
 *   / custom domain (when applicable).
 *
 *   Deliberately narrow — the tenant record itself (`ITenant`) is
 *   NOT returned here because host-parsing is a pure string
 *   operation. Fetching the full tenant view model is a separate,
 *   async step delegated to `ITenancyService.loadTenant(...)`.
 */

import type { HostContext } from "./host-context.interface";

/**
 * Result of a `resolveHostContext(host, config)` call.
 *
 * Every branch carries `context`; the other fields are populated
 * per the branch:
 *
 * - `central` / `central_admin` — no tenant, no custom domain.
 * - `tenant` matched via `tenantHostPattern` (e.g.
 *   `acme.academorix.app`) — `slug` populated.
 * - `tenant` matched via custom domain (e.g.
 *   `dashboard.acme-corp.com`) — `customDomain` populated, `slug`
 *   absent (the caller must resolve the slug via a backend lookup).
 *
 * @example
 * ```ts
 * // Central
 * { context: "central" }
 *
 * // Central admin
 * { context: "central_admin" }
 *
 * // Tenant subdomain
 * { context: "tenant", slug: "acme" }
 *
 * // Custom domain tenant
 * { context: "tenant", customDomain: "dashboard.acme-corp.com" }
 * ```
 */
export interface IHostContextResolution {
  /** The classified host context. */
  readonly context: HostContext;

  /**
   * Tenant slug extracted from a subdomain match. Populated when the
   * host matched the `tenantHostPattern` regex — the slug comes from
   * the regex's `slug` named capture group.
   */
  readonly slug?: string;

  /**
   * The raw host string when no pattern matched but the request
   * still looks like a tenant surface (a candidate custom domain).
   * The caller then delegates to `ITenancyService.resolveCustomDomain(host)`
   * to look up the tenant slug on the backend.
   */
  readonly customDomain?: string;

  /**
   * The regex pattern that matched (for debugging / analytics).
   * Absent for the custom-domain branch (no pattern matched).
   */
  readonly matchedPattern?: string;
}
