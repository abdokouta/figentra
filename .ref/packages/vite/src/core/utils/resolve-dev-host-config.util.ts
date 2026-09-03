/**
 * @file resolve-dev-host-config.util.ts
 * @module @stackra/vite/core/utils
 * @description Compose the standard Stackra "multi-host dev
 *   server" contract — HTTPS auto-detection, port pinning,
 *   wildcard host allowlist — into ONE call. Consumers spread
 *   the result into their Vite `server` + `preview` blocks
 *   without repeating the same 12-line boilerplate in every app.
 */

import type {
  IResolveDevHostConfigOptions,
  IResolveDevHostConfigResult,
  IResolveDevHostConfigSlice,
} from "../interfaces/resolve-dev-host-config.interface";
import { readDevHttps } from "./read-dev-https.util";

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Resolve the standard Stackra multi-host dev server config.
 *
 * Returns two matching slices — one for `server`, one for
 * `preview` — carrying:
 *
 * - `host: "0.0.0.0"` — bind every interface so requests from
 *   `academorix.app`, `admin.academorix.app`, `acme.academorix.app`,
 *   ..., all reach the same server.
 * - `port` — the pinned dev port (`server`) or preview port
 *   (`preview`). Convention: preview = dev - 1000.
 * - `strictPort: true` — refuse to fall back when the port is
 *   busy. Keeps bookmarked URLs stable across restarts.
 * - `allowedHosts` — verbatim copy of the caller's list. Vite 8
 *   requires an explicit allowlist for non-`localhost` hostnames
 *   (DNS-rebinding protection). Leading `.` = wildcard subdomain.
 * - `https` — auto-populated by {@link readDevHttps} when a
 *   mkcert pair is present in `certsDir`. Omitted when it isn't,
 *   so the server falls back to plain HTTP.
 *
 * ## Preview-port convention
 *
 * By default preview port = dev port - 1000 (`5173` → `4173`,
 * `5174` → `4174`). Override via `previewPort` when a specific
 * value is required (e.g. matching a legacy CI script).
 *
 * ## Consumer spread pattern
 *
 * The util produces the STANDARD shape — consumers spread it +
 * override individual fields as needed:
 *
 * ```typescript
 * const host = resolveDevHostConfig({ ... });
 *
 * export default defineConfig({
 *   server: {
 *     ...viteConfig.server,     // app-specific server middleware
 *     ...host.server,           // + Stackra dev-host contract
 *   },
 *   preview: host.preview,
 * });
 * ```
 *
 * @param options - See {@link IResolveDevHostConfigOptions}.
 * @returns `{ server, preview }` — spread each into the matching
 *   Vite config block.
 *
 * @example
 * ```typescript
 * import { fileURLToPath, URL } from "node:url";
 * import { defineConfig, resolveDevHostConfig } from "@stackra/vite";
 *
 * const resolvePath = (p: string): string =>
 *   fileURLToPath(new URL(p, import.meta.url));
 *
 * const host = resolveDevHostConfig({
 *   port: 5173,
 *   certsDir: resolvePath("./certs"),
 *   allowedHosts: ["localhost", "127.0.0.1", "academorix.app", ".academorix.app"],
 * });
 *
 * export default defineConfig({
 *   server:  host.server,
 *   preview: host.preview,
 * });
 * ```
 */
export function resolveDevHostConfig(
  options: IResolveDevHostConfigOptions,
): IResolveDevHostConfigResult {
  const {
    port,
    certsDir,
    allowedHosts,
    previewPort = port - 1000,
    warnOnMissingCerts = true,
  } = options;

  // Discover HTTPS certs. `undefined` → plain HTTP fallback.
  // Reads the cert files eagerly at config-load time — Vite
  // consumes them synchronously downstream, and the file sizes
  // are O(kB), so the cost is invisible.
  const devHttps = readDevHttps({
    certsDir,
    warnOnMissing: warnOnMissingCerts,
  });

  // Materialise a mutable allowedHosts array so Vite's own
  // `ServerOptions.allowedHosts: string[]` signature accepts it
  // without a cast at the call site. The `readonly` on the
  // options side stays for API correctness (mutating the input
  // has no meaning); we spread into a fresh array here.
  const materializedHosts: string[] = [...allowedHosts];

  // Shared fields — dev + preview accept identical values for
  // every field except `port`. Keeping them in one object
  // guarantees no drift; the caller cannot accidentally allow
  // one hostname on dev and forget it on preview.
  const commonSlice: Omit<IResolveDevHostConfigSlice, "port"> = {
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: materializedHosts,
    ...(devHttps ? { https: devHttps } : {}),
  };

  return {
    server: { ...commonSlice, port },
    preview: { ...commonSlice, port: previewPort },
  };
}
