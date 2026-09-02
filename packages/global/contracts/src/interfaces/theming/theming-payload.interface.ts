/**
 * @file theming-payload.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Wire shape for a tenant / user's theming preferences,
 *   returned by the backend at boot.
 *
 *   Returned by:
 *   - `GET /api/v1/tenants/by-slug?slug={subdomain}` — unauthenticated
 *     pre-auth theming lookup (login page, marketing site).
 *   - `GET /api/v1/auth/me` — authenticated bootstrap; carries
 *     `tenant.theming` alongside the identity payload.
 *
 *   Consumed by `ThemeService.applyPayload(payload)` on the frontend.
 *   Every field optional so a tenant can supply just a preset id, or
 *   just override the mode, or ship a fully-authored `values` bag.
 *
 *   Sibling: `IBrandPayload` (in `@stackra/contracts/interfaces/brand`)
 *   — the two travel together in one boot response, split at the
 *   client-side router.
 */

import type { ColorMode } from "./color-mode.type";
import type { IDesignTokenMap } from "./design-token-map.interface";
import type { IThemeValues } from "./theme-values.interface";

/**
 * Tenant theming payload — one of three shapes the frontend
 * recognizes, in resolution order:
 *
 * 1. `tokens` set → apply verbatim (escape hatch for fully-authored
 *    tenant themes with bespoke shadows / custom variables).
 * 2. `values` set → run through the palette engine.
 * 3. `presetId` set → look up in the registry and apply that theme's
 *    values.
 * 4. None set → keep the app's default theme.
 *
 * `mode` is independent — applies regardless of which of the three
 * theme sources is used.
 */
export interface IThemingPayload {
  /**
   * Fully-authored token override. When set, applied INSTEAD OF the
   * palette engine — the whole map replaces the derived values. Use
   * for tenant themes that ship bespoke shadows, radius scales, or
   * custom variables the engine doesn't cover.
   */
  readonly tokens?: {
    readonly light: IDesignTokenMap;
    readonly dark: IDesignTokenMap;
  };

  /**
   * Algorithmic theme description — the 7-scalar authoring shape.
   * Applied by running through the palette engine to derive the
   * full token map on both modes.
   */
  readonly values?: IThemeValues;

  /**
   * Named preset identifier. Must match a theme registered in
   * `THEME_REGISTRY` (built-in or `forFeature`-contributed).
   * Applied by resolving to `theme.values` and running through the
   * engine.
   */
  readonly presetId?: string;

  /**
   * Preferred color mode for a fresh user on this tenant. `system`
   * respects the OS setting. Existing per-user mode overrides win
   * once the user picks explicitly.
   */
  readonly mode?: ColorMode;
}
