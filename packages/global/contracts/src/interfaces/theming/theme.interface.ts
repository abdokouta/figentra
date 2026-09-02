/**
 * @file theme.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description The canonical `ITheme` shape.
 *
 *   A theme is a 7-scalar authoring bag (`IThemeValues`) plus optional
 *   metadata (label, preview). The palette engine in
 *   `@stackra/theming/core/utils/palette` expands the values into the
 *   full design-token map (~30 CSS variables × light + dark) at
 *   runtime — the workspace never stores full CSS maps per preset.
 *
 *   The optional `tokens` field is an escape hatch for tenants /
 *   consumers who need the engine bypassed — either because they've
 *   authored full custom shadows / radii the engine doesn't cover, or
 *   because they ship a pre-computed token map from a design tool.
 *   When set, the engine is skipped and the map is applied verbatim.
 *
 *   No `Record<string, unknown>` on either surface. Every value is a
 *   typed CSS value string.
 */

import type { IDesignTokenMap } from "./design-token-map.interface";
import type { IThemeValues } from "./theme-values.interface";

/**
 * The canonical theme record. Every preset — built-in,
 * `forFeature`-contributed, tenant-hydrated — matches this shape.
 */
export interface ITheme {
  /**
   * Slug — the primary key. Matches the backend `themes.slug`
   * column. Follows the pattern `[a-z0-9-]+`.
   */
  readonly id: string;

  /** Human-readable label. Always populated. */
  readonly label: string;

  /**
   * Optional i18n key. When present, consumer code routes the label
   * through `I18N_MANAGER.t(labelKey, defaultValue: label)`.
   */
  readonly labelKey?: string;

  /** Optional longer description surfaced by pickers. */
  readonly description?: string;

  /**
   * Optional preview image URL. Consumed by the docs-style theme
   * preset picker (small thumbnail per preset).
   */
  readonly previewImage?: string;

  /**
   * Whether this is a built-in (system-shipped) theme, vs. a
   * user-created one. Admin UIs gate the "Delete" affordance on
   * this flag.
   */
  readonly isSystem?: boolean;

  /**
   * The 7-scalar authoring shape — REQUIRED. The palette engine
   * derives the full `IDesignTokenMap` from these values on
   * `setTheme` / `setMode`.
   */
  readonly values: IThemeValues;

  /**
   * Optional pre-computed token override. When set, applied
   * INSTEAD OF the engine output — every key in the map lands as
   * `document.documentElement.style.setProperty("--<key>", value)`
   * on web (or the RN StyleSheet equivalent on native).
   *
   * Paired by mode: `{ light: {...}, dark: {...} }`. Both modes
   * required when this field is set — partial maps drift when the
   * user toggles mode.
   *
   * Use ONLY for cases the engine cannot express:
   * - Bespoke shadow tokens or animation curves.
   * - Server-hydrated tenant themes carrying values the workspace's
   *   engine doesn't yet model.
   * - Wholesale replacement of HeroUI defaults with a bespoke
   *   design system.
   */
  readonly tokens?: {
    readonly light: IDesignTokenMap;
    readonly dark: IDesignTokenMap;
  };

  /** ISO-8601 creation timestamp from the server. */
  readonly createdAt?: string;

  /** ISO-8601 update timestamp from the server. */
  readonly updatedAt?: string;

  /**
   * Multi-tenancy discriminator. Null / undefined for single-tenant
   * apps.
   */
  readonly tenantId?: number | null;
}
