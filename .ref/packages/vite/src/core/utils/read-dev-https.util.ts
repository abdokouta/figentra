/**
 * @file read-dev-https.util.ts
 * @module @stackra/vite/core/utils
 * @description Discover a mkcert-produced HTTPS keypair inside a
 *   local `./certs/` directory and hand back the buffers Vite's
 *   dev + preview servers expect on their `https` field.
 *
 *   ## The problem this solves
 *
 *   Vite's dev + preview servers accept an
 *   `https: { key: Buffer, cert: Buffer }` shape. Populating that
 *   from disk is a 5-line dance: `existsSync` guard + `readdirSync`
 *   + filter for `-key.pem` + filter for `.pem` (not the key) +
 *   `readFileSync` of both. Every app that wants local HTTPS on a
 *   `.app` hostname (HSTS-preloaded — Chrome refuses HTTP) had to
 *   hand-roll the same dance. This util is that dance, exported
 *   once from `@stackra/vite`.
 *
 *   ## Why mkcert, not vite-plugin-basic-ssl
 *
 *   `vite-plugin-basic-ssl` generates a self-signed cert at boot.
 *   Chrome refuses self-signed certs on HSTS-preloaded TLDs
 *   (`.app`, `.dev`, `.gle`, `.foo`, `.zip`) — the "proceed
 *   anyway" bypass is hidden by design. mkcert installs a
 *   locally-trusted CA into the OS keychain → real green padlock,
 *   works with HSTS.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  IReadDevHttpsOptions,
  IReadDevHttpsResult,
} from "../interfaces/read-dev-https.interface";

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Discover a mkcert-produced HTTPS keypair inside `certsDir` and
 * return the key + cert buffers Vite's dev/preview servers expect.
 *
 * ## Discovery convention
 *
 * mkcert emits two files per cert:
 * - `<primary-name>+<san-count>.pem` — the certificate.
 * - `<primary-name>+<san-count>-key.pem` — the private key.
 *
 * This util finds the FIRST pair in `certsDir` matching that
 * pattern — no hard-coded filenames, so the config keeps working
 * when the SAN list changes (e.g. adding a new tenant subdomain
 * bumps the `+N` counter).
 *
 * ## Return contract
 *
 * - `certsDir` doesn't exist → `undefined` (no-op fallback).
 * - `certsDir` exists but contains no matching pair → `undefined`
 *   (with a `console.warn` unless `warnOnMissing: false`).
 * - Both files present → `{ key: Buffer, cert: Buffer }`.
 *
 * The `undefined` return is the intended "plain HTTP" signal —
 * consumers spread the result conditionally into their Vite
 * config so the server falls back to HTTP when certs aren't
 * present:
 *
 * ```typescript
 * const devHttps = readDevHttps({ certsDir: "./certs" });
 *
 * export default defineConfig({
 *   server: { ..., ...(devHttps ? { https: devHttps } : {}) },
 * });
 * ```
 *
 * ## Fail-soft behaviour
 *
 * `existsSync` + `readdirSync` inside a `try/catch` — a broken
 * `certsDir` (permissions, symlink loop, exotic filesystem)
 * gracefully returns `undefined` instead of crashing config
 * load. The `warnOnMissing` flag re-elevates the "certs present
 * but malformed" case into a `console.warn` so a typo in the
 * mkcert command doesn't disappear silently.
 *
 * @param options - `{ certsDir, warnOnMissing? }`. See
 *   {@link IReadDevHttpsOptions}.
 * @returns `{ key, cert }` when a valid mkcert pair is found;
 *   `undefined` otherwise.
 *
 * @example
 * ```typescript
 * import { fileURLToPath, URL } from "node:url";
 * import { defineConfig, readDevHttps } from "@stackra/vite";
 *
 * const resolvePath = (p: string): string =>
 *   fileURLToPath(new URL(p, import.meta.url));
 *
 * const devHttps = readDevHttps({ certsDir: resolvePath("./certs") });
 *
 * export default defineConfig({
 *   server: {
 *     host: "0.0.0.0",
 *     port: 5173,
 *     ...(devHttps ? { https: devHttps } : {}),
 *   },
 * });
 * ```
 */
export function readDevHttps(
  options: IReadDevHttpsOptions,
): IReadDevHttpsResult | undefined {
  const { certsDir, warnOnMissing = true } = options;

  // Guard: no directory → plain HTTP fallback. Not a warning
  // because this is the expected default for new workstations
  // that haven't run `mkcert` yet.
  if (!existsSync(certsDir)) return undefined;

  // Guard: directory exists but cannot be read (permissions,
  // symlink loop, exotic filesystem). Fail-soft to `undefined`
  // — starting the server on plain HTTP is a better UX than
  // a hard crash at config load. Do NOT warn: we don't know
  // whether the user intended to install certs here.
  let entries: readonly string[];
  try {
    entries = readdirSync(certsDir);
  } catch {
    return undefined;
  }

  // mkcert filename convention: `<name>+<n>.pem` (cert) +
  // `<name>+<n>-key.pem` (key). Match the pair by suffix so
  // adding SANs (`<name>+5.pem` → `<name>+6.pem` when a new
  // subdomain lands) doesn't require reconfiguration.
  const keyFile = entries.find((f) => f.endsWith("-key.pem"));
  const certFile = entries.find(
    (f) => f.endsWith(".pem") && !f.endsWith("-key.pem"),
  );

  // Certs directory exists but the pair is malformed (missing
  // cert, missing key, typo'd filenames). Warn once — this is
  // typically a mkcert command that didn't finish (Ctrl-C
  // during generation, or the wrong argv). Consumers who
  // legitimately want no certs at this path should pass
  // `warnOnMissing: false`.
  if (!keyFile || !certFile) {
    if (warnOnMissing) {
      // Not an `@stackra/logger` call — config-time code runs
      // before the container boots, so we cannot depend on the
      // DI logger. `console.warn` is the standard-library
      // signal every Vite plugin ships with.
      // eslint-disable-next-line no-console
      console.warn(
        `[@stackra/vite] readDevHttps: certs directory "${certsDir}" ` +
          `exists but no mkcert pair was found. Expected \`*.pem\` + ` +
          `\`*-key.pem\`. Falling back to HTTP.`,
      );
    }
    return undefined;
  }

  // Both files present → hydrate. `readFileSync` on a mkcert
  // cert is O(kB); the cost is invisible in practice.
  return {
    key: readFileSync(join(certsDir, keyFile)),
    cert: readFileSync(join(certsDir, certFile)),
  };
}
