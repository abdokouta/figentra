/**
 * @file host-resolver.interface.ts
 * @module @stackra/contracts/interfaces/tenancy
 * @description Platform-specific host-resolver contract.
 *
 *   Implemented by the browser resolver (`window.location.hostname`)
 *   and the React Native resolver (persisted active-tenant slug from
 *   `@stackra/storage/native`'s SecureStore). Cross-package consumers
 *   inject this token instead of reaching for browser globals.
 */

/**
 * Abstract host-resolver contract.
 *
 * Bound in `WebTenancyModule` (web) and `NativeTenancyModule` (native).
 *
 * Provides a single primitive — "give me the host string the app is
 * currently running under" — plus an optional subscribe hook for
 * runtimes where the host CAN change at runtime (e.g. a native app
 * where the user picks a new workspace from an inline switcher).
 */
export interface IHostResolver {
  /**
   * Return the current host string.
   *
   * - **Web** — `window.location.hostname` (e.g. `acme.academorix.app`).
   *   In SSR contexts returns a caller-configured `defaultHost`.
   * - **Native** — the active tenant slug composed against the
   *   configured `tenantHostPattern` template, or the app's `centralDomain`
   *   when no tenant has been picked.
   */
  getHost(): string;

  /**
   * Subscribe to host changes. Rarely fires on web (a full navigation
   * reloads the app) but fires every time a native user switches
   * workspaces without leaving the app.
   *
   * @returns Unsubscribe function.
   */
  subscribe?(cb: (host: string) => void): () => void;
}
