/**
 * @file resolve-dev-host-config.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description Family shapes for the `resolveDevHostConfig(...)`
 *   util — options, slice, result. Grouped per code-standards.md
 *   §"Composite family grouping" because each shape exists only
 *   in service of the same util.
 */

import type { IReadDevHttpsResult } from "./read-dev-https.interface";

// ════════════════════════════════════════════════════════════════════════════
// Options
// ════════════════════════════════════════════════════════════════════════════

/**
 * Options accepted by {@link resolveDevHostConfig}.
 */
export interface IResolveDevHostConfigOptions {
  /**
   * The dev server port — pinned via `strictPort: true` so the
   * dev server refuses to fall back when the port is busy.
   * Bookmarked URLs stay stable across restarts.
   */
  readonly port: number;

  /**
   * Filesystem path to the directory containing the mkcert
   * keypair. Passed straight to `readDevHttps(...)`. When the
   * directory doesn't exist OR contains no mkcert pair, the
   * resolved config falls back to plain HTTP.
   */
  readonly certsDir: string;

  /**
   * Hostnames Vite's dev + preview servers accept requests from.
   * Vite 8 requires an explicit allowlist for non-`localhost`
   * hostnames (DNS-rebinding protection).
   *
   * Wildcard subdomains via a leading dot: `".academorix.app"`
   * matches every `*.academorix.app` (including future tenant
   * slugs) without editing the config.
   *
   * @example
   * ```typescript
   * ["localhost", "127.0.0.1", "academorix.app", ".academorix.app"]
   * ```
   */
  readonly allowedHosts: readonly string[];

  /**
   * Preview server port. Convention: dev port minus 1000
   * (5173 → 4173, 5174 → 4174) so both dev + preview servers
   * run side by side without collision.
   *
   * @default port - 1000
   */
  readonly previewPort?: number;

  /**
   * Forwarded to `readDevHttps(...)`. Set to `false` when a
   * bootstrap script legitimately stages an empty `certsDir`
   * before the first mkcert run.
   *
   * @default true
   */
  readonly warnOnMissingCerts?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Slice
// ════════════════════════════════════════════════════════════════════════════

/**
 * The slice of a Vite `server` / `preview` config
 * {@link resolveDevHostConfig} owns.
 *
 * Two identical shapes come out of the util — one for `server`
 * (dev), one for `preview`. Consumers spread each into the
 * matching Vite config block. Consumers can layer app-specific
 * fields (extra middleware, custom headers, warmup patterns, ...)
 * on top of the spread — this slice only covers the fields
 * common to every Stackra app.
 */
export interface IResolveDevHostConfigSlice {
  /**
   * Bind address. Fixed to `"0.0.0.0"` so every hostname pointing
   * at the local machine reaches the same server (essential for
   * `academorix.app` multi-host dev).
   */
  readonly host: string;

  /** Port the server binds — dev port or preview port. */
  readonly port: number;

  /**
   * Refuse to fall back when the port is busy. Bookmarked URLs
   * stay stable; ambiguous port drift never happens.
   */
  readonly strictPort: boolean;

  /**
   * Hostnames Vite accepts requests from. Verbatim copy of
   * {@link IResolveDevHostConfigOptions.allowedHosts} —
   * materialised as a mutable array so Vite's own
   * `ServerOptions.allowedHosts: string[]` signature accepts it
   * without a cast at the call site.
   */
  readonly allowedHosts: string[];

  /**
   * HTTPS keypair — present when `readDevHttps` found a mkcert
   * pair in `certsDir`. Omitted when it didn't → server falls
   * back to plain HTTP.
   */
  readonly https?: IReadDevHttpsResult;
}

// ════════════════════════════════════════════════════════════════════════════
// Result
// ════════════════════════════════════════════════════════════════════════════

/**
 * Return shape of {@link resolveDevHostConfig} — one slice for
 * dev, one for preview. Consumers spread each into the matching
 * Vite config block.
 *
 * @example
 * ```typescript
 * const host = resolveDevHostConfig({ ... });
 *
 * export default defineConfig({
 *   server:  { ...viteConfig.server, ...host.server },
 *   preview: host.preview,
 * });
 * ```
 */
export interface IResolveDevHostConfigResult {
  /** Slice for `server:` (dev). */
  readonly server: IResolveDevHostConfigSlice;

  /** Slice for `preview:` (`vite preview`). */
  readonly preview: IResolveDevHostConfigSlice;
}
