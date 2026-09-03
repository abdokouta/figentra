/**
 * @file i18n-plugin.ts
 * @module @stackra/i18n/vite
 * @description Vite plugin that auto-discovers translation files and
 *   exposes them as a virtual module. Provides HMR for translation
 *   changes.
 *
 *   ## Virtual module
 *
 *   - `virtual:i18n/translations` — exports
 *     `{ translations, supportedLocales }`.
 *
 *   ## Discovery layers
 *
 *   Two layers merged into one virtual payload:
 *
 *   1. **Per-package catalogs** (opt-in via `packageCatalogs`) — walks
 *      `<workspace>/packages/frontend/*\/src/core/i18n/<locale>.json`
 *      and keys each catalog under the package's directory slug
 *      (`rbac/src/core/i18n/en.json` → `translations.en.rbac.*`).
 *      Every `@stackra/*` package that ships a catalog reaches the
 *      runtime through this walk — no per-package DI loader class
 *      required. See
 *      `.kiro/specs/i18n-vite-plugin-per-package-discovery/design.md`.
 *   2. **App-level catalogs** (always) — walks
 *      `<config.root>/<translationsDir>/<locale>/<namespace>.json` and
 *      overlays on top of the package layer. App keys ALWAYS win on
 *      the (locale, namespace) tuple.
 *
 *   ## Usage
 *
 *   ```typescript
 *   // vite.config.ts
 *   import { i18nPlugin } from "@stackra/i18n/vite";
 *
 *   export default defineConfig({
 *     plugins: [
 *       i18nPlugin({
 *         translationsDir: "./src/i18n",
 *         packageCatalogs: {
 *           root: "../..",                                   // default
 *           glob: "packages/frontend/*\/src/core/i18n",       // default
 *           namespaceStrategy: "package-name",                // default
 *         },
 *       }),
 *     ],
 *   });
 *   ```
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "path";

import type { I18nPluginOptions, IPackageCatalogsOptions } from "./interfaces";
import type {
  HmrContext,
  ModuleNode,
  Plugin,
  ResolvedConfig,
  ViteDevServer,
} from "vite";

// ============================================================================
// Constants
// ============================================================================

const VIRTUAL_MODULE_ID = "virtual:i18n/translations";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_MODULE_ID;

/** Default file extension the plugin scans for. */
const DEFAULT_FILE_EXTENSION = ".json";

/** Default workspace-root path relative to a typical `apps/<name>/`. */
const DEFAULT_PACKAGE_CATALOG_ROOT = "../..";

/** Default glob targeting every workspace frontend package's core catalog. */
const DEFAULT_PACKAGE_CATALOG_GLOB = "packages/frontend/*/src/core/i18n";

/** Default namespace strategy — key by the package directory slug. */
const DEFAULT_NAMESPACE_STRATEGY = "package-name" as const;

/**
 * Default per-package namespace override map — empty. Consumers
 * pass their own map via `packageCatalogs.namespaceMap`.
 */
const DEFAULT_NAMESPACE_MAP: Readonly<Record<string, string>> = Object.freeze(
  {},
);

// ============================================================================
// Internal types
// ============================================================================

/**
 * A per-locale catalog map — locale code keyed to a namespace tree
 * whose values are the raw JSON payload of the catalog file.
 *
 * Kept internal — consumers see the flatter public shape typed by
 * `client.d.ts`.
 */
type CatalogsByLocale = Record<string, Record<string, Record<string, unknown>>>;

/**
 * The tuple `collectPackageCatalogs` returns — the merged catalog tree
 * plus every catalog directory the walk touched. The dev-server hooks
 * consume the directories for watcher registration + HMR invalidation.
 */
interface IPackageCatalogsResult {
  readonly catalogs: CatalogsByLocale;
  readonly locales: readonly string[];
  readonly discoveredRoots: readonly string[];
}

/**
 * Minimal shape of Rollup's `load` hook `this` — we only need
 * `warn(message)`. Typing against Rollup's full `PluginContext` would
 * force a `rollup` type dependency for a single side effect.
 */
interface ILoadHookContext {
  readonly warn?: (message: string) => void;
}

// ============================================================================
// FS + walk helpers
// ============================================================================

/**
 * Resolve `packageCatalogs.root` against Vite's `config.root`.
 *
 * Absolute paths pass through untouched; relative paths are joined
 * with the Vite root.
 */
function resolveCatalogRoot(viteRoot: string, catalogRoot: string): string {
  return isAbsolute(catalogRoot) ? catalogRoot : resolve(viteRoot, catalogRoot);
}

/**
 * Expand a workspace-wide glob (only the `<parent>/*\/<tail>` shape)
 * against a base path.
 *
 * The plugin's public API accepts `<packages/frontend>/*\/<src/core/i18n>`.
 * Every other glob shape is rejected implicitly — we scan the parent
 * directory of the star and require the tail to exist under each
 * child. Full glob semantics would need a `glob` dep; the workspace
 * doesn't ship one for the vite subpath yet, and this narrow shape
 * covers 100 % of the workspace's actual usage.
 */
function expandCatalogGlob(root: string, glob: string): string[] {
  // Split on `*` — everything before is the parent directory to
  // enumerate, everything after (with a leading `/` trimmed) is the
  // tail path each child must contain.
  const starIndex = glob.indexOf("*");

  // No wildcard — treat as a single literal path under `root`.
  if (starIndex === -1) {
    const literal = resolve(root, glob);
    return existsSync(literal) ? [literal] : [];
  }

  const beforeStar = glob.slice(0, starIndex).replace(/\/$/, "");
  const afterStar = glob.slice(starIndex + 1).replace(/^\/+/, "");
  const parent = resolve(root, beforeStar);

  if (!existsSync(parent)) return [];

  // Enumerate children of the parent — every subdirectory is a
  // candidate package.
  const children = readdirSync(parent).filter((entry) => {
    try {
      return statSync(join(parent, entry)).isDirectory();
    } catch {
      return false;
    }
  });

  // For each candidate, require the tail path to exist. Skip
  // directories that don't ship an i18n catalog folder.
  const matches: string[] = [];
  for (const child of children) {
    const candidate = afterStar
      ? resolve(parent, child, afterStar)
      : resolve(parent, child);
    if (existsSync(candidate)) matches.push(candidate);
  }

  return matches;
}

/**
 * Derive the namespace slug from a matched catalog directory.
 *
 * For a canonical layout the matched path ends in
 * `<pkg>/src/core/i18n`, so the slug is the segment two dirs above
 * the match (`<pkg>`). We back up until we find the segment that
 * sits directly after the star position — that segment is the
 * package's directory name and matches the workspace convention.
 *
 * When the layout differs (e.g. a consumer passes a glob like
 * `libs/*\/i18n`), we fall back to the segment immediately above the
 * catalog dir. That covers every reasonable custom layout without
 * asking the consumer to spell the slug out separately.
 */
function deriveNamespaceSlug(matchedRoot: string, glob: string): string {
  const glue = sep === "\\" ? /[\\/]/ : /\//;
  const globParts = glob.split(glue).filter(Boolean);
  const starIndex = globParts.findIndex((part) => part === "*");
  const partsAfterStar =
    starIndex === -1 ? 0 : globParts.length - starIndex - 1;

  const segments = matchedRoot.split(sep);
  // Traverse up `partsAfterStar` segments from the end. That's the
  // segment the star matched (the package slug).
  const slugIndex = segments.length - 1 - partsAfterStar;

  return segments[slugIndex] ?? basename(dirname(matchedRoot));
}

/**
 * Load every `<locale>.<ext>` file directly under `catalogDir`.
 *
 * Returns a map keyed by locale code. Silently skips files whose
 * name doesn't end with `ext` — matches the pre-change plugin's
 * behaviour.
 */
function loadCatalogFiles(
  catalogDir: string,
  ext: string,
  onWarn?: (message: string) => void,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  if (!existsSync(catalogDir)) return out;

  let entries: string[];
  try {
    entries = readdirSync(catalogDir);
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (!entry.endsWith(ext)) continue;

    const filepath = join(catalogDir, entry);
    try {
      if (!statSync(filepath).isFile()) continue;
    } catch {
      continue;
    }

    const locale = basename(entry, ext);
    try {
      const content = readFileSync(filepath, "utf-8");
      out[locale] = JSON.parse(content) as Record<string, unknown>;
    } catch (err) {
      // Fail-soft: skip corrupt or unreadable JSON files but keep
      // walking so a single bad file doesn't break the whole
      // discovery.
      onWarn?.(
        `[stackra-i18n] failed to parse catalog file ${filepath}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return out;
}

// ============================================================================
// Package-catalog collector
// ============================================================================

/**
 * Walk every `<root>/<glob>/<locale>.<ext>` file and merge into a
 * `CatalogsByLocale` tree.
 *
 * Returns:
 * - `catalogs` — the merged tree (namespace/locale/keys),
 * - `locales` — deduplicated locale codes seen across every package,
 * - `discoveredRoots` — every catalog dir touched (fed into the
 *   watcher + HMR matcher).
 */
function collectPackageCatalogs(
  viteRoot: string,
  options: IPackageCatalogsOptions | false | undefined,
  ext: string,
  onWarn?: (message: string) => void,
): IPackageCatalogsResult {
  // Feature is opt-in — skip everything when omitted / disabled.
  if (!options) {
    return { catalogs: {}, locales: [], discoveredRoots: [] };
  }

  const root = resolveCatalogRoot(
    viteRoot,
    options.root ?? DEFAULT_PACKAGE_CATALOG_ROOT,
  );
  const glob = options.glob ?? DEFAULT_PACKAGE_CATALOG_GLOB;
  const strategy = options.namespaceStrategy ?? DEFAULT_NAMESPACE_STRATEGY;
  const namespaceMap = options.namespaceMap ?? DEFAULT_NAMESPACE_MAP;

  // Missing / non-existent root is a legitimate case (a consumer app
  // running outside the monorepo). Emit zero packages instead of
  // throwing so the plugin degrades gracefully.
  if (!existsSync(root)) {
    return { catalogs: {}, locales: [], discoveredRoots: [] };
  }

  const matchedRoots = expandCatalogGlob(root, glob);
  const catalogs: CatalogsByLocale = {};
  const localesSeen = new Set<string>();

  for (const matchedRoot of matchedRoots) {
    const byLocale = loadCatalogFiles(matchedRoot, ext, onWarn);
    const rawSlug = deriveNamespaceSlug(matchedRoot, glob);
    // Consumer-supplied override wins over the derived slug when
    // present. Only the package-name strategy uses the namespace
    // layer — flat merges into the locale root directly, so an
    // override there would be a silent no-op. Warn (once per
    // mismatched slug) when consumers combine both to catch the
    // misconfiguration in dev.
    const slug = namespaceMap[rawSlug] ?? rawSlug;
    if (strategy === "flat" && slug !== rawSlug) {
      onWarn?.(
        `[stackra-i18n] namespaceMap["${rawSlug}"] is set but ` +
          `namespaceStrategy is "flat"; the override has no effect ` +
          `(flat strategy shallow-merges every catalog into the ` +
          `locale root with no namespace layer).`,
      );
    }

    for (const [locale, payload] of Object.entries(byLocale)) {
      localesSeen.add(locale);
      catalogs[locale] ??= {};

      if (strategy === "flat") {
        // Shallow-merge into the locale root — last package wins on
        // any top-level-key collision. Documented as footgun-adjacent.
        Object.assign(catalogs[locale], payload);
      } else {
        // Package-name strategy — namespace under the (possibly
        // overridden) package slug.
        catalogs[locale][slug] = payload;
      }
    }
  }

  return {
    catalogs,
    locales: Array.from(localesSeen),
    discoveredRoots: matchedRoots,
  };
}

// ============================================================================
// App-level `translationsDir` collector — preserved from the pre-change plugin
// ============================================================================

/**
 * Walk `<translationsDir>/<locale>/<namespace>.<ext>` and produce
 * the same `(catalogs, locales)` shape as the package walk.
 *
 * Returns empty maps when the dir doesn't exist — matches the
 * pre-change fallback that emitted
 * `translations = {}; supportedLocales = []`.
 */
function collectAppCatalogs(
  translationsDir: string,
  ext: string,
): { catalogs: CatalogsByLocale; locales: readonly string[] } {
  if (!existsSync(translationsDir)) {
    return { catalogs: {}, locales: [] };
  }

  const locales = readdirSync(translationsDir).filter((entry) => {
    try {
      return statSync(join(translationsDir, entry)).isDirectory();
    } catch {
      return false;
    }
  });

  const catalogs: CatalogsByLocale = {};
  for (const locale of locales) {
    catalogs[locale] = {};
    const localeDir = join(translationsDir, locale);

    const files = readdirSync(localeDir).filter((f) => f.endsWith(ext));
    for (const file of files) {
      const namespace = basename(file, ext);
      try {
        const content = readFileSync(join(localeDir, file), "utf-8");
        catalogs[locale][namespace] = JSON.parse(content) as Record<
          string,
          unknown
        >;
      } catch {
        // Fail-soft: preserve the pre-change plugin's tolerance for
        // partially-populated dirs.
      }
    }
  }

  return { catalogs, locales };
}

// ============================================================================
// Merge helpers
// ============================================================================

/**
 * Overlay `overlay` on top of `base` with the (locale, namespace)
 * shallow-merge semantics documented in the requirements doc
 * (R4.1 + R4.2).
 *
 * Same-namespace, same-locale: `Object.assign(base[locale][ns],
 * overlay[locale][ns])`. New namespaces + new locales are just
 * copied over.
 */
function overlayCatalogs(
  base: CatalogsByLocale,
  overlay: CatalogsByLocale,
): CatalogsByLocale {
  const out: CatalogsByLocale = {};

  for (const [locale, namespaces] of Object.entries(base)) {
    out[locale] = { ...namespaces };
  }

  for (const [locale, namespaces] of Object.entries(overlay)) {
    out[locale] ??= {};
    for (const [ns, payload] of Object.entries(namespaces)) {
      // Shallow merge — one level deep. Deeper merges are a future
      // enhancement gated on consumer feedback.
      out[locale][ns] = { ...(out[locale][ns] ?? {}), ...payload };
    }
  }

  return out;
}

/**
 * Union of two locale lists, preserving first-seen order.
 *
 * `supportedLocales` in the emitted virtual module must be the
 * union across both layers (R4.3) so a package-only locale still
 * surfaces to consumers even if the app doesn't ship a catalog for
 * it yet.
 */
function unionLocales(a: readonly string[], b: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const locale of [...a, ...b]) {
    if (seen.has(locale)) continue;
    seen.add(locale);
    out.push(locale);
  }
  return out;
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Vite plugin that auto-discovers translation files and exposes them
 * as `virtual:i18n/translations` for zero-config i18n loading.
 *
 * @param options - Plugin configuration. See {@link I18nPluginOptions}.
 * @returns Vite plugin object.
 */
export function i18nPlugin(options: I18nPluginOptions): Plugin {
  const ext = options.fileExtension ?? DEFAULT_FILE_EXTENSION;
  let viteRoot = "";
  // Track the last set of discovered package-catalog roots so
  // `handleHotUpdate` can match changes coming from any of them,
  // and `configureServer` can seed watchers with the same list.
  let lastPackageRoots: readonly string[] = [];

  return {
    name: "stackra-i18n",
    // `enforce: pre` — the plugin resolves the virtual module ahead
    // of user code so consumer imports of `virtual:i18n/translations`
    // never race with the emit.
    enforce: "pre",

    configResolved(config: ResolvedConfig): void {
      viteRoot = config.root;
    },

    resolveId(id: string): string | null {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    load(this: ILoadHookContext | undefined, id: string): string | null {
      if (id !== RESOLVED_VIRTUAL_ID) return null;

      // Layer 1: package catalogs (opt-in).
      const packageResult = collectPackageCatalogs(
        viteRoot,
        options.packageCatalogs,
        ext,
        (msg) => this?.warn?.(msg),
      );

      // Cache the discovered roots so the watcher + HMR matcher pick
      // them up on the next dev-server tick.
      lastPackageRoots = packageResult.discoveredRoots;

      // Layer 2: app-level `translationsDir`.
      const translationsDir = resolve(viteRoot, options.translationsDir);
      const appResult = collectAppCatalogs(translationsDir, ext);

      // Merge — app wins.
      const translationsObj = overlayCatalogs(
        packageResult.catalogs,
        appResult.catalogs,
      );

      // Locale union, package layer first (matches discovery order).
      const supportedLocales = unionLocales(
        packageResult.locales,
        appResult.locales,
      );

      return [
        `export const translations = ${JSON.stringify(translationsObj)};`,
        `export const supportedLocales = ${JSON.stringify(supportedLocales)};`,
      ].join("\n");
    },

    configureServer(server: ViteDevServer): void {
      // Vite watches its `config.root` by default. Per-package
      // catalog roots frequently live OUTSIDE the app's root (they
      // live under `<workspace>/packages/frontend/**`), so we
      // explicitly seed the watcher with every discovered root plus
      // the app translations dir. Adding a non-existent path is a
      // no-op in chokidar; adding an already-watched one is
      // idempotent — either way the walker fires when a catalog
      // file changes.
      const translationsDir = resolve(viteRoot, options.translationsDir);
      if (existsSync(translationsDir)) {
        server.watcher.add(translationsDir);
      }
      for (const root of lastPackageRoots) {
        server.watcher.add(root);
      }
      // Also add the package-catalogs `root` itself — new packages
      // that ADD a catalog directory (rather than modifying an
      // existing one) surface via the parent watcher.
      if (options.packageCatalogs) {
        const catalogRoot = resolveCatalogRoot(
          viteRoot,
          options.packageCatalogs.root ?? DEFAULT_PACKAGE_CATALOG_ROOT,
        );
        if (existsSync(catalogRoot)) server.watcher.add(catalogRoot);
      }
    },

    handleHotUpdate(ctx: HmrContext): ModuleNode[] | undefined {
      const translationsDir = resolve(viteRoot, options.translationsDir);

      // Match the changed file against the app-level translationsDir
      // AND every discovered package-catalog root. Any match
      // invalidates the virtual module.
      const inAppDir = ctx.file.startsWith(translationsDir);
      const inPackageDir = lastPackageRoots.some((root) =>
        ctx.file.startsWith(root),
      );

      if (!inAppDir && !inPackageDir) return undefined;

      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
      if (mod) {
        ctx.server.moduleGraph.invalidateModule(mod);
        return [mod];
      }
      return undefined;
    },
  };
}
