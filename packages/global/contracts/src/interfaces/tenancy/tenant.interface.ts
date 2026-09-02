/**
 * @file tenant.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description The `ITenant` view-model contract — one row per tenant
 *   in the workspace. Represents a paying customer of an Application
 *   in the subdomain-per-tenant SaaS model.
 *
 *   This is the FRONTEND view model: the shape a React component /
 *   hook actually sees at render time. It mirrors (but does not
 *   duplicate) the backend `Tenant` model — camelCased and pruned
 *   to only the fields a UI ever renders. Persisted rows carry
 *   extra columns (`created_at`, `application_id`, DB primary key,
 *   ...) that never surface here.
 *
 *   Sits at the TOP of the platform tree (see
 *   `.kiro/steering/hierarchy.md`). Every scope resolution (org,
 *   region, branch, team, user) cascades BELOW this row.
 *
 *   Optionally carries `brand` + `theming` payloads inline — when
 *   present, `@stackra/tenancy`'s `TenantBrandBridge` dispatches
 *   them to `BrandService.applyPayload` + `ThemeService.applyPayload`
 *   automatically on tenant resolve. Ships the whole identity in
 *   one HTTP round-trip so the head + palette flip before React
 *   mounts.
 */

import type { IBrandPayload } from "../brand/brand-payload.interface";
import type { IThemingPayload } from "../theming/theming-payload.interface";

/**
 * A tenant — a paying customer of an Application on the
 * subdomain-per-tenant SaaS.
 *
 * @example
 * ```ts
 * const acme: ITenant = {
 *   id: "ten_01H...",
 *   slug: "acme",
 *   displayName: "Acme Sports Academy",
 *   customDomain: null,
 *   status: "active",
 * };
 * ```
 */
export interface ITenant {
  /**
   * Prefixed ULID (e.g. `ten_01HN2K3...`). Never a numeric primary
   * key — the wire always shows the prefixed form, so the frontend
   * treats it as an opaque string.
   */
  readonly id: string;

  /**
   * URL-safe kebab-case slug (e.g. `acme`, `wolves-fc`). Uniquely
   * identifies the tenant within an Application. The subdomain
   * component of `<slug>.academorix.app`.
   */
  readonly slug: string;

  /**
   * Human-readable display name (e.g. `Acme Sports Academy`). What
   * users see in the workspace picker and sidebar branding.
   */
  readonly displayName: string;

  /**
   * Enterprise vanity domain (e.g. `dashboard.acme-sports.com`) when
   * the tenant has one; `null` otherwise. Rendered when a request
   * arrives on the custom domain instead of the workspace's default
   * `<slug>.academorix.app` host.
   */
  readonly customDomain?: string | null;

  /**
   * Tenant lifecycle status. `active` is the happy path. `suspended`
   * / `pending` / `archived` are surfaced via UI badges + gated flows.
   */
  readonly status?: "active" | "pending" | "suspended" | "archived";

  /**
   * URL to the tenant's logo, when uploaded. Rendered in the sidebar
   * + workspace picker. Absent when the tenant hasn't uploaded one.
   */
  readonly logoUrl?: string | null;

  /**
   * Brand accent color (hex or Tailwind token). Applied to sidebar
   * chrome + primary CTAs. Absent when the tenant hasn't customized
   * their theme.
   *
   * @deprecated Prefer `theming` (structured wire shape) — the
   *   `accent` scalar remains only as a lightweight hint for
   *   surfaces that don't compose `@stackra/theming` (workspace
   *   picker chip, avatar tint). New consumers should read
   *   `theming.values.hue` instead.
   */
  readonly accent?: string | null;

  /**
   * Inline brand payload — full identity (name, description, logo,
   * favicon, OG/Twitter, JSON-LD). When present,
   * `@stackra/tenancy`'s `TenantBrandBridge` dispatches this to
   * `BrandService.applyPayload(brand)` on tenant resolve so the
   * document `<head>` flips atomically to the tenant's identity
   * before React mounts.
   *
   * Absent when the tenant hasn't customized their brand OR the
   * backend elected to serve brand via a separate endpoint (in
   * which case `ITenancyModuleOptions.brandFetcher` closes the
   * gap).
   *
   * Consumers who don't compose `@stackra/brand` can ignore this
   * field — the bridge is a no-op when the brand service isn't
   * bound in the container.
   */
  readonly brand?: IBrandPayload | null;

  /**
   * Inline theming payload — tokens / values / preset id + optional
   * default color mode. When present, `@stackra/tenancy`'s
   * `TenantBrandBridge` dispatches this to
   * `ThemeService.applyPayload(theming)` on tenant resolve so the
   * palette + CSS variables flip atomically to the tenant's
   * identity before the first paint.
   *
   * Sibling of `brand` — the two travel together (identity + look)
   * in the same wire response, split at the client bridge.
   *
   * Consumers who don't compose `@stackra/theming` can ignore this
   * field — the bridge is a no-op when the theming service isn't
   * bound in the container.
   */
  readonly theming?: IThemingPayload | null;
}
