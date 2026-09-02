/**
 * @file tenancy-service.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description The `ITenancyService` contract — the single source of
 *   truth for host classification + active-tenant state on the
 *   frontend.
 *
 *   Implemented by `@stackra/tenancy`'s default `TenancyService` and
 *   any caller-supplied override bound to `TENANCY_SERVICE`. The
 *   React bindings (`<TenancyProvider>`, `useTenancy()`) consume this
 *   contract only — they never reach the concrete class.
 */

import type { IHostContextResolution } from "./host-context-resolution.interface";
import type { HostContext } from "./host-context.interface";
import type { ISwitchWorkspaceOptions } from "./switch-workspace-options.interface";
import type { ITenant } from "./tenant.interface";
import type { IWorkspacePickerEntry } from "./workspace-picker-entry.interface";

/**
 * Serialisable snapshot of the tenancy service — pushed to
 * subscribers on every state change and consumed by
 * `<TenancyProvider>` via `useSyncExternalStore`.
 */
export interface ITenancyServiceSnapshot {
  /** The classified host context (never null once boot completes). */
  readonly context: HostContext;

  /**
   * The full host-classification payload. Carries the tenant slug OR
   * custom-domain candidate from the pattern match — the field
   * `resolveHostContext(...)` returned.
   */
  readonly resolution: IHostContextResolution;

  /**
   * The active tenant view model. Populated after
   * `loadTenant(slug)` / `resolveCustomDomain(host)` resolves the
   * backend row; `null` while resolving or on central / central-admin
   * hosts.
   */
  readonly tenant: ITenant | null;

  /**
   * Whether the service is currently resolving the active tenant
   * (a backend fetch is in-flight). Consumers use this to gate the
   * initial skeleton state.
   */
  readonly isLoading: boolean;

  /**
   * The error thrown by the most-recent async operation, when one
   * happened. Cleared to `null` on the next successful operation.
   */
  readonly error: Error | null;
}

/**
 * Frontend tenancy service contract.
 *
 * Owns:
 * - Host classification (`central` | `central_admin` | `tenant`).
 * - Active tenant identity resolution.
 * - Cross-subdomain workspace switch handoff.
 * - Change subscription for React bindings.
 *
 * Does NOT own:
 * - Persistence of user auth tokens (that's `@stackra/auth`).
 * - Cascading value resolution below the tenant (that's `@stackra/scope`).
 * - The tenant configuration substrate (that's `@stackra/settings`).
 *
 * @example
 * ```typescript
 * import { TENANCY_SERVICE, type ITenancyService } from '@stackra/contracts';
 *
 * class SidebarBrandService {
 *   public constructor(
 *     @Inject(TENANCY_SERVICE) private readonly tenancy: ITenancyService,
 *   ) {}
 *
 *   public getBrandLogo(): string | null {
 *     return this.tenancy.getSnapshot().tenant?.logoUrl ?? null;
 *   }
 * }
 * ```
 */
export interface ITenancyService {
  /**
   * Synchronously read the current snapshot.
   *
   * `useSyncExternalStore`-friendly — always returns a stable
   * reference between change events.
   */
  getSnapshot(): ITenancyServiceSnapshot;

  /**
   * The current {@link HostContext}. Shortcut for
   * `getSnapshot().context`.
   */
  getContext(): HostContext;

  /**
   * The active tenant, or `null` on central / central-admin hosts /
   * before the async lookup resolves.
   */
  getTenant(): ITenant | null;

  /**
   * Whether the current host is the central workspace picker.
   * Shortcut for `getContext() === HostContext.Central`.
   */
  isCentral(): boolean;

  /**
   * Whether the current host is the central admin surface.
   * Shortcut for `getContext() === HostContext.CentralAdmin`.
   */
  isCentralAdmin(): boolean;

  /**
   * Whether the current host is a tenant subdomain (or a custom
   * domain that resolves to a tenant). Shortcut for
   * `getContext() === HostContext.Tenant`.
   */
  isTenant(): boolean;

  /**
   * Fetch + set the active tenant row on the current tenant subdomain
   * during boot. Rejects with `UnknownTenantError` when the backend
   * returns 404. Idempotent — calling twice with the same slug re-uses
   * the cached fetch.
   *
   * @param slug - Tenant slug parsed from the host.
   */
  loadTenant(slug: string): Promise<ITenant>;

  /**
   * Resolve an enterprise vanity domain (e.g. `dashboard.acme.com`)
   * to its owning tenant row. Called during boot when
   * `resolveHostContext(...)` returns a `customDomain` branch.
   *
   * @param host - The raw host string (no `https://` prefix).
   */
  resolveCustomDomain(host: string): Promise<ITenant>;

  /**
   * List every workspace the currently-authenticated user has access
   * to. Fetched from `GET /api/v1/auth/workspaces`. Only useful on
   * the central host (the picker's data source).
   */
  listMyWorkspaces(): Promise<IWorkspacePickerEntry[]>;

  /**
   * Trigger a full-navigation redirect from the central host to the
   * chosen tenant subdomain, carrying the exchange code in the URL
   * fragment. The tenant subdomain reads the fragment on first paint
   * (see {@link exchangeCodeForPat}).
   *
   * @param entry - The workspace picker row the user chose.
   * @param options - Optional bag carrying a deep-link `returnUrl`
   *   through the exchange fragment so the tenant SPA can navigate
   *   to the path the user originally requested (before the tenant
   *   gate bounced them into the picker). See
   *   {@link ISwitchWorkspaceOptions}.
   */
  switchWorkspace(
    entry: IWorkspacePickerEntry,
    options?: ISwitchWorkspaceOptions,
  ): Promise<void>;

  /**
   * On the tenant subdomain during first paint, redeem the exchange
   * code (read from `window.location.hash`) for a PAT via
   * `POST /api/v1/auth/exchange`. The PAT is handed to `@stackra/auth`'s
   * `ISessionStorage` — this service never persists it.
   *
   * Rejects with `ExchangeCodeInvalidError` when the code is missing,
   * expired, or already redeemed.
   *
   * @param code - The exchange code from the URL fragment.
   */
  exchangeCodeForPat(code: string): Promise<{ readonly token: string }>;

  /**
   * Subscribe to snapshot changes.
   *
   * @param listener - Called with the new snapshot after every state
   *   mutation. `useSyncExternalStore`-compatible.
   * @returns Unsubscribe function.
   */
  subscribe(listener: (snapshot: ITenancyServiceSnapshot) => void): () => void;
}
