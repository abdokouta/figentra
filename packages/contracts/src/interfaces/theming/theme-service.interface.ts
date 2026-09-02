/**
 * @file theme-service.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Public verb surface of the theming runtime — the
 *   contract bound behind `THEME_SERVICE` in the container.
 *
 *   Cross-package consumers (`TenantBrandBridge` in `@stackra/tenancy`,
 *   theme-preset picker, marketing preview widgets) type against
 *   this interface rather than the concrete `ThemeService` class.
 *
 *   Implemented by `ThemeService` in `@stackra/theming`. The
 *   concrete implementation carries additional lifecycle affordances
 *   (`onModuleInit`, `restorePersistedState`, `destroy`) that
 *   aren't part of the cross-package public contract.
 */

import type { ColorMode } from "./color-mode.type";
import type { IThemeValues } from "./theme-values.interface";
import type { IThemingPayload } from "./theming-payload.interface";

/**
 * Central orchestrator for theming operations.
 */
export interface IThemeService {
  /**
   * Set the color mode preference. Persists, resolves the mode
   * against the OS when `"system"`, and re-applies tokens.
   *
   * @param mode - `"light"` / `"dark"` / `"system"`.
   */
  setMode(mode: ColorMode): void;

  /**
   * Activate a named theme preset by id. Runs the palette engine
   * on the theme's `IThemeValues` and writes tokens through the
   * platform bindings.
   *
   * @param id - Theme id (must be registered).
   * @throws when the id isn't registered.
   */
  setTheme(id: string): void;

  /**
   * Register a tenant-brand theme from raw scalar values and
   * activate it. Idempotent — a second call overwrites the first
   * so the registry never accumulates one theme per tenant.
   *
   * @param values - The 7-scalar authoring bag.
   * @param label - Optional label for the registered entry.
   */
  applyValues(values: IThemeValues, label?: string): void;

  /**
   * Apply a wire-shaped `IThemingPayload`. Resolves priority
   * `tokens > values > presetId` and dispatches to the right
   * verb, then applies `mode` when set.
   *
   * Called by `TenantBrandBridge` on tenant resolve.
   *
   * @param payload - The wire-shaped theming payload.
   */
  applyPayload(payload: IThemingPayload): void;
}
