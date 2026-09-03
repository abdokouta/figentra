/**
 * @file resolve-app-meta.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description Options + return shape for `resolveAppMeta` — the
 *   utility that discovers an app's root directory + package
 *   version from its Vite config's `import.meta.url`.
 */

/**
 * Options accepted by `resolveAppMeta`.
 */
export interface IResolveAppMetaOptions {
  /**
   * The calling Vite config's `import.meta.url`. Used to derive
   * both the filesystem location of the config file AND to walk
   * upward looking for the nearest `package.json`.
   */
  readonly configUrl: string;

  /**
   * When set, forces the app root to `<configDir>/<rootRelative>`
   * — bypasses the automatic package.json walk-up. Useful when
   * the config file lives in an unusual location (test fixtures,
   * migration harnesses) OR when the walk-up would land on a
   * parent workspace package.json by mistake.
   *
   * @default undefined (walk up until a package.json is found)
   */
  readonly rootRelative?: string;

  /**
   * When set, force the app version to this value instead of
   * reading `package.json`. Only used by tests or by consumers
   * building a nested config that shouldn't shadow the parent's
   * version.
   */
  readonly versionOverride?: string;
}

/**
 * Result returned by `resolveAppMeta`.
 */
export interface IResolveAppMetaResult {
  /** Absolute filesystem path to the app's root directory
   *  (the directory containing `package.json`). */
  readonly root: string;

  /** The `name` field from the app's `package.json`, or
   *  `"unknown"` when missing. */
  readonly name: string;

  /** The `version` field from the app's `package.json`, or
   *  `"dev"` when missing (or when `versionOverride` was set). */
  readonly version: string;

  /** The parsed `package.json` as an untyped record — consumers
   *  who need typed fields cast at the call site. */
  readonly packageJson: Record<string, unknown>;

  /**
   * Resolve a path relative to the app root. Prefer this over
   * hand-rolling `fileURLToPath(new URL(...))` — the helper
   * canonicalises across POSIX + Windows layouts.
   *
   * @example
   * ```ts
   * const meta = resolveAppMeta({ configUrl: import.meta.url });
   * const src = meta.resolvePath("./src");        // /abs/path/to/src
   * const certs = meta.resolvePath("./certs");    // /abs/path/to/certs
   * ```
   */
  readonly resolvePath: (relative: string) => string;
}
