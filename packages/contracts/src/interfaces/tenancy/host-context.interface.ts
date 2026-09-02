/**
 * @file host-context.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description `HostContext` literal-union — classifies the current
 *   request host into one of three canonical categories.
 *
 *   The frontend resolves this at boot from `window.location.hostname`
 *   (web) or an app-supplied slug (native). Every downstream feature
 *   gate — routing, auth provider selection, http baseURL derivation,
 *   sidebar chrome — reads this value.
 *
 *   Codified as a `const` object + `type` alias (per
 *   `.kiro/steering/frontend-packages.md` §3 — literal unions never
 *   TS `enum {}`) so the union tree-shakes cleanly.
 */

/**
 * Canonical host contexts.
 *
 * - `central` — the workspace picker / marketing surface (e.g.
 *   `academorix.app`, `www.academorix.app`). Users pick a workspace
 *   or self-serve register a new tenant.
 * - `central_admin` — Figentra/Stackra staff surface (e.g.
 *   `admin.academorix.app`). Cross-application, uses the
 *   `platform_admin` guard.
 * - `tenant` — a specific tenant's dashboard (e.g.
 *   `acme.academorix.app` OR the enterprise vanity domain
 *   `dashboard.acme.com`). Every tenant-scoped screen lives here.
 */
export const HostContext = {
  Central: "central",
  CentralAdmin: "central_admin",
  Tenant: "tenant",
} as const;

/**
 * The union of every {@link HostContext} value. Use this as the
 * type of a caller's `context` parameter / field — never a TS
 * `enum` (per workspace conventions).
 */
export type HostContext = (typeof HostContext)[keyof typeof HostContext];
