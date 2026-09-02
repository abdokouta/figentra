/**
 * @file workspace-picker-entry.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description Row shape rendered by the central-host workspace
 *   picker.
 *
 *   The picker lists every tenant the current user has access to.
 *   Each row is one `IWorkspacePickerEntry`. Selecting a row triggers
 *   the cross-subdomain exchange-code auth handoff — the central
 *   host mints a short-lived exchange code, redirects the browser to
 *   `https://<slug>.academorix.app/#exchange=<code>`, and the tenant
 *   subdomain reads the fragment on first paint + trades it for a
 *   PAT.
 */

/**
 * One entry in the workspace picker.
 *
 * Composed at the central-host layer from
 * `GET /api/v1/auth/workspaces` — each entry pairs a tenant view
 * model with the exchange code the tenant subdomain needs to
 * redeem for a PAT.
 *
 * @example
 * ```ts
 * const rows: IWorkspacePickerEntry[] = [
 *   {
 *     slug: "acme",
 *     displayName: "Acme Sports Academy",
 *     exchangeCode: "xch_01H..."
 *   },
 *   {
 *     slug: "wolves-fc",
 *     displayName: "Wolves FC",
 *     exchangeCode: "xch_01H..."
 *   },
 * ];
 * ```
 */
export interface IWorkspacePickerEntry {
  /** Tenant slug — becomes the subdomain the user is redirected to. */
  readonly slug: string;

  /** Human-readable tenant name. Rendered as the picker row's title. */
  readonly displayName: string;

  /**
   * Short-lived exchange code (typically 60-second TTL) the tenant
   * subdomain redeems for a PAT during first-paint. Never persisted
   * on the central host — flows through the URL fragment
   * (`#exchange=<code>`) so it never leaves the browser or hits
   * a server log.
   */
  readonly exchangeCode: string;

  /** Logo URL when the tenant has uploaded one. */
  readonly logoUrl?: string | null;

  /** Optional secondary label rendered under `displayName`. */
  readonly subtitle?: string;
}
