/**
 * @file package-catalogs-options.interface.ts
 * @module @stackra/i18n/vite/interfaces
 * @description Options that toggle + configure per-package catalog
 *   discovery inside {@link i18nPlugin}.
 *
 *   Every `@stackra/*` package that ships user-facing strings authors
 *   `<pkg>/src/core/i18n/en.json` + `ar.json` per
 *   [`frontend-localization.md`](../../../../../../.kiro/steering/frontend-localization.md).
 *   Enabling this option lets the vite plugin walk every such file at
 *   build time and merge the discoveries into
 *   `virtual:i18n/translations` — no per-package DI loader class
 *   required.
 *
 *   Full design lives at
 *   `.kiro/specs/i18n-vite-plugin-per-package-discovery/design.md`.
 */

/**
 * Configuration for the plugin's per-package catalog auto-discovery.
 *
 * Pass this on `I18nPluginOptions.packageCatalogs` to enable the
 * walk. Omit (or pass `false`) to fall back to the pre-change plugin
 * behaviour that only walks the app-level `translationsDir`.
 */
export interface IPackageCatalogsOptions {
  /**
   * Path to walk. Resolved relative to Vite's `config.root`.
   * Absolute paths are accepted verbatim.
   *
   * From a typical `apps/<name>/` layout the workspace root is
   * reached with `"../.."` — the default.
   *
   * @default "../.."
   */
  readonly root?: string;

  /**
   * Glob (relative to `root`) matching the parent directory of the
   * per-package catalog files. Every direct child of a matching
   * directory whose filename ends with `fileExtension` is loaded.
   *
   * The tail `src/core/i18n` is fixed by the steering doc; only the
   * front (`packages/frontend/*`) varies for consumers with a
   * non-standard package root.
   *
   * @default "packages/frontend/*\/src/core/i18n"
   */
  readonly glob?: string;

  /**
   * How discovered catalogs map into the virtual module.
   *
   * - `"package-name"` (default) — every catalog nests under its
   *   package's directory slug so `rbac/src/core/i18n/en.json`
   *   surfaces as `translations.en.rbac.*`. Matches the workspace
   *   convention codified by `frontend-localization.md`.
   * - `"flat"` — every catalog shallow-merges into the locale root
   *   with last-package-wins on collisions. Reserved for the edge
   *   case where every catalog uses disjoint top-level keys AND
   *   the consumer wants un-prefixed access. Not recommended.
   *
   * @default "package-name"
   */
  readonly namespaceStrategy?: "package-name" | "flat";

  /**
   * Per-package namespace overrides. Maps the plugin's derived
   * directory slug (e.g. `auth-ui`) to the namespace the package's
   * runtime `t()` call sites actually reference (e.g. `auth`).
   *
   * Only applies when `namespaceStrategy === "package-name"`. A
   * package that isn't listed keeps its directory slug as the
   * namespace.
   *
   * ## The auth-ui case
   *
   * `@stackra/auth-ui` ships its catalog at
   * `auth-ui/src/core/i18n/en.json`, but every internal `t(...)`
   * call uses the shorter `auth.*` prefix (`t("auth.login.title")`
   * — 340+ call sites across the package). Rather than churn every
   * consumer of the catalog OR rename the package, consumers
   * declare `namespaceMap: { "auth-ui": "auth" }` when registering
   * the plugin and the discovered `auth-ui` catalog surfaces under
   * `translations.<locale>.auth.*` — matching what the code
   * expects.
   *
   * ## When to use vs. rename
   *
   * Prefer renaming call sites when the divergence is a mistake.
   * Use `namespaceMap` when the mismatch is deliberate — a package
   * whose distribution name AND directory slug are longer than its
   * conceptual namespace.
   *
   * @example
   * ```typescript
   * i18nPlugin({
   *   translationsDir: "./src/i18n",
   *   packageCatalogs: {
   *     root: "./node_modules",
   *     glob: "@stackra/*\/src/core/i18n",
   *     namespaceMap: { "auth-ui": "auth" },
   *   },
   * });
   * ```
   *
   * @default {} (no overrides)
   */
  readonly namespaceMap?: Readonly<Record<string, string>>;
}
