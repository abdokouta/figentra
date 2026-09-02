/**
 * @file tenancy-context-value.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description The React context value shape exposed by
 *   `<TenancyProvider>` / read via `useTenancy()`.
 *
 *   The React binding IS a projection of the service snapshot plus
 *   two setter shortcuts (`setActiveTenant`, `switchWorkspace`) so
 *   components can trigger workspace changes without pulling in the
 *   service token via `useInject`.
 */

import type { HostContext } from "./host-context.interface";
import type { ISwitchWorkspaceOptions } from "./switch-workspace-options.interface";
import type { ITenant } from "./tenant.interface";
import type { IWorkspacePickerEntry } from "./workspace-picker-entry.interface";

/**
 * The value published by `<TenancyProvider>` under `TenancyContext`.
 *
 * Consumers read this via `useTenancy()` — the hook throws with a
 * helpful message when called outside the provider (per
 * `.kiro/steering/communication-patterns.md` §Lane 2).
 *
 * @example
 * ```tsx
 * function BrandChip() {
 *   const { tenant, isCentral } = useTenancy();
 *   if (isCentral) return <span>Workspaces</span>;
 *   return <span>{tenant?.displayName ?? "…"}</span>;
 * }
 * ```
 */
export interface ITenancyContextValue {
  /** The classified host context. */
  readonly context: HostContext;

  /** The active tenant, or `null` on central / central-admin. */
  readonly tenant: ITenant | null;

  /** `true` when the initial tenant lookup is in-flight. */
  readonly isLoading: boolean;

  /** The most-recent async error, or `null`. */
  readonly error: Error | null;

  /** Shortcut — `context === "central"`. */
  readonly isCentral: boolean;

  /** Shortcut — `context === "central_admin"`. */
  readonly isCentralAdmin: boolean;

  /** Shortcut — `context === "tenant"`. */
  readonly isTenant: boolean;

  /**
   * Force-set the active tenant without refetching. Consumers use
   * this after mutating the tenant (rename, logo update, etc.) so
   * the sidebar chrome re-renders immediately.
   */
  setActiveTenant(next: ITenant): void;

  /**
   * Trigger the cross-subdomain workspace switch — full navigation
   * to `https://<slug>.academorix.app/#exchange=<code>`. Wraps
   * `ITenancyService.switchWorkspace`.
   *
   * @param entry - The workspace picker row the user chose.
   * @param options - Optional deep-link `returnUrl` bag (see
   *   `ISwitchWorkspaceOptions`).
   */
  switchWorkspace(
    entry: IWorkspacePickerEntry,
    options?: ISwitchWorkspaceOptions,
  ): Promise<void>;
}
