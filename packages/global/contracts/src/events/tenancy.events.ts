/**
 * @file tenancy.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/tenancy` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Follows the same shape as sibling `theming.events.ts` and
 *   `i18n.events.ts` — one map object frozen `as const`, one
 *   union type derived from it. Consumers `@OnEvent(...)` /
 *   `useOnEvent(...)` against the map keys per
 *   `.kiro/steering/events-authoring.md`.
 */

/**
 * Tenancy lifecycle event names.
 *
 * Every event follows the past-tense verb convention from
 * `.kiro/steering/events-authoring.md` §Rule — pick the right verb
 * tense. Emissions describe things that HAPPENED, not things the
 * caller wants to happen.
 */
export const TENANCY_EVENTS = {
  /**
   * A tenant was resolved on the current host — either from the
   * tenant subdomain slug OR from a custom domain lookup. Fired
   * on the FIRST transition from `null` → non-null.
   *
   * ## Emitters
   * - `TenancyService.mutate(...)` when the incoming snapshot's
   *   `tenant` transitions from `null` to a real row.
   *
   * ## Current listeners
   * - `TenantBrandBridge` — dispatches `tenant.brand` + `tenant.theming`
   *   payloads to `BrandService.applyPayload` +
   *   `ThemeService.applyPayload`.
   *
   * ## Payload
   * - `tenant: ITenant` — the resolved tenant row.
   *
   * ## Order
   * Undefined — listeners react independently.
   */
  TENANT_RESOLVED: "tenancy.tenant-resolved",

  /**
   * A different tenant became active on the current session —
   * either a workspace switch (central → tenant subdomain) OR a
   * refresh of the same tenant's row that surfaces a different
   * identity. Distinct from `TENANT_RESOLVED` (which fires on
   * `null` → set); this fires on set → set with a different id.
   *
   * ## Emitters
   * - `TenancyService.mutate(...)` when the incoming snapshot's
   *   `tenant.id` differs from the previous one.
   *
   * ## Current listeners
   * - `TenantBrandBridge` — re-dispatches the new tenant's brand +
   *   theming payloads to their respective services so the head +
   *   palette flip mid-session.
   *
   * ## Payload
   * - `tenant: ITenant`         — the newly-active tenant.
   * - `previousTenantId: string` — the previous tenant's id.
   */
  TENANT_CHANGED: "tenancy.tenant-changed",

  /**
   * The active tenant was cleared — the caller navigated back to
   * the central host, signed out, or the tenant row failed to
   * hydrate. Listeners typically restore the app's default brand
   * / palette here.
   *
   * ## Emitters
   * - `TenancyService.mutate(...)` when the incoming snapshot's
   *   `tenant` transitions from set → `null`.
   *
   * ## Current listeners
   * - (none by default — the bridge intentionally leaves the last
   *   applied brand in place so the marketing surface can keep
   *   its own branding without churn)
   *
   * ## Payload
   * - `previousTenantId: string` — the id of the tenant that
   *   just became inactive.
   */
  TENANT_CLEARED: "tenancy.tenant-cleared",
} as const;

/** Union type of every emitted tenancy event name. */
export type TenancyEventName =
  (typeof TENANCY_EVENTS)[keyof typeof TENANCY_EVENTS];
