/**
 * @file brand-payload.interface.ts
 * @module @stackra/contracts/interfaces/brand
 * @description Wire shape for a tenant / user's brand identity
 *   payload, returned by the backend at boot.
 *
 *   Returned by:
 *   - `GET /api/v1/tenants/by-slug?slug={subdomain}` — unauthenticated
 *     pre-auth brand lookup (login page, marketing site).
 *   - `GET /api/v1/auth/me` — authenticated bootstrap; carries
 *     `tenant.brand` alongside the identity payload.
 *
 *   Consumed by `BrandService.applyPayload(payload)` on the frontend.
 *   The service folds `payload.metadata` on top of the boot-time
 *   `brandConfig().metadata` and re-applies to the platform's head
 *   surface — `<title>`, `<meta description>`, favicon, OG/Twitter,
 *   JSON-LD Organization.
 *
 *   Sibling: `IThemingPayload` (in
 *   `@stackra/contracts/interfaces/theming`) — the two travel
 *   together in one boot response, split at the client-side router.
 */

import type { IBrandMetadata } from "./brand-metadata.interface";

/**
 * Tenant brand payload — carries an `IBrandMetadata` bag from the
 * backend. When applied, overrides the app's boot-time default
 * brand identity via a shallow merge.
 *
 * The wire shape is `IBrandMetadata` verbatim, not a `Partial` of
 * it. `IBrandMetadata` already declares every field optional
 * except `name` and `description` (the two anchors of the title
 * formatter), so a backend can legitimately send a payload as
 * small as `{ name, description }` or as broad as a full brand
 * override — the type surface enforces the required floor without
 * a `Partial<>` utility-type detour.
 */
export interface IBrandPayload {
  /**
   * The brand identity to apply. Missing optional fields fall
   * back to the app's default brand from `brandConfig` on merge.
   */
  readonly metadata: IBrandMetadata;
}
