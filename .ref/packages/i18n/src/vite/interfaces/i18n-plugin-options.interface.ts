/**
 * @file i18n-plugin-options.interface.ts
 * @module @stackra/i18n/vite/interfaces
 * @description Public options interface for {@link i18nPlugin}.
 *
 *   Covers the app-level `translationsDir` walk that has always
 *   existed plus the per-package catalog auto-discovery landed by
 *   the `.kiro/specs/i18n-vite-plugin-per-package-discovery/` spec.
 */

import type { IPackageCatalogsOptions } from "./package-catalogs-options.interface";

/**
 * Options for the i18n Vite plugin.
 */
export interface I18nPluginOptions {
  /**
   * Path to the app's translations directory (relative to Vite's
   * `config.root`). The plugin walks
   * `<translationsDir>/<locale>/<namespace>.json` and exposes the
   * discoveries under `virtual:i18n/translations`.
   */
  translationsDir: string;

  /**
   * File extension the plugin scans for.
   *
   * @default ".json"
   */
  fileExtension?: string;

  /**
   * Enable auto-discovery of per-package translation catalogs
   * across the workspace (26 `@stackra/*` packages ship
   * `src/core/i18n/{en,ar}.json` today; discovering them
   * eliminates the need for a per-package DI loader class).
   *
   * Pass `false` (or omit) to disable and fall back to the
   * pre-change plugin behaviour — only `translationsDir` walks.
   *
   * See
   * `.kiro/specs/i18n-vite-plugin-per-package-discovery/design.md`
   * for the full mechanism.
   *
   * @default false
   */
  packageCatalogs?: false | IPackageCatalogsOptions;
}
