/**
 * @file read-dev-https.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description Family shapes for the `readDevHttps(...)` util —
 *   options + result. Grouped in one file per code-standards.md
 *   §"Composite family grouping" because both interfaces exist
 *   only in service of the same util.
 */

// ════════════════════════════════════════════════════════════════════════════
// Options
// ════════════════════════════════════════════════════════════════════════════

/**
 * Options accepted by {@link readDevHttps}.
 */
export interface IReadDevHttpsOptions {
  /**
   * Absolute or relative filesystem path to the directory
   * containing the mkcert-produced keypair (typically `./certs/`).
   *
   * Consumers usually pass an absolute path resolved via
   * `fileURLToPath(new URL("./certs", import.meta.url))` so the
   * lookup is independent of the process CWD.
   */
  readonly certsDir: string;

  /**
   * When `true` (default) and the directory exists but no mkcert
   * pair is found, emit a `console.warn` naming the directory.
   * Catches "I typed `mkcert x` instead of `mkcert academorix.app`"
   * silently.
   *
   * Set to `false` when the caller legitimately expects an empty
   * `certsDir` (e.g. a bootstrap script staging the folder before
   * the first `mkcert` run).
   *
   * @default true
   */
  readonly warnOnMissing?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Result
// ════════════════════════════════════════════════════════════════════════════

/**
 * Return shape of {@link readDevHttps} — the exact
 * `{ key: Buffer, cert: Buffer }` shape Vite's dev + preview
 * servers accept on their `https` field.
 */
export interface IReadDevHttpsResult {
  /** The mkcert-produced private key (raw PEM bytes). */
  readonly key: Buffer;

  /** The mkcert-produced certificate (raw PEM bytes). */
  readonly cert: Buffer;
}
