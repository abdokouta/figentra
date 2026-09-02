/**
 * @file switch-workspace-options.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description Optional configuration for `switchWorkspace(...)`.
 *
 *   Introduced in tenancy 1.1.0 to carry a deep-link return path
 *   through the cross-subdomain exchange. See
 *   `.kiro/steering/tenancy-columns.md` cross-reference for the
 *   round-trip contract.
 */

/**
 * Optional bag for `ITenancyService.switchWorkspace(entry, options?)`.
 */
export interface ISwitchWorkspaceOptions {
  /**
   * Path (with query, no origin) the tenant SPA should navigate to
   * AFTER redeeming the exchange code + attaching the returned PAT.
   *
   * Typically sourced from a `?returnUrl=<path>` query on the
   * central host (built by `<TenantGate>` when it redirected the
   * user to the workspace picker). Appended to the tenant URL's
   * fragment as `&returnUrl=<encoded path>`.
   *
   * Fragment (not query) so the return path stays out of server
   * logs — same rationale as the exchange code itself.
   *
   * Consumers who don't care about deep-links omit this field —
   * the tenant SPA falls back to its own home route on first
   * paint post-redemption.
   */
  readonly returnUrl?: string | null;
}
