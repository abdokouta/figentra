/**
 * @file index.ts
 * @module @stackra/vite
 * @description Public API for `@stackra/vite` — the neutral
 *   Vite-config orchestrator. Ships a typed `defineConfig(...)`
 *   helper and the `{ enabled, factory, options }` plugin-map
 *   envelope. Consumers bring their own plugin factories.
 *
 *   Also ships two dev-server helpers that every Stackra app
 *   composes:
 *   - {@link readDevHttps} — discover a mkcert HTTPS keypair
 *     under `./certs/` (required for `.app` HSTS-preloaded dev).
 *   - {@link resolveDevHostConfig} — the standard multi-host
 *     dev + preview slice (host / port / strictPort / allowedHosts
 *     / https) as one call.
 */

// ════════════════════════════════════════════════════════════════════════════
// Utils — primary API
// ════════════════════════════════════════════════════════════════════════════
export {
  deepMerge,
  defineConfig,
  readDevHttps,
  resolveAppMeta,
  resolveDevHostConfig,
  resolvePlugins,
} from "./utils";

// ════════════════════════════════════════════════════════════════════════════
// Interfaces (package-owned)
// ════════════════════════════════════════════════════════════════════════════
export type {
  IPluginEntry,
  IPluginMap,
  IReadDevHttpsOptions,
  IReadDevHttpsResult,
  IResolveAppMetaOptions,
  IResolveAppMetaResult,
  IResolveDevHostConfigOptions,
  IResolveDevHostConfigResult,
  IResolveDevHostConfigSlice,
  IViteConfigOptions,
} from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════
export { DEFAULT_VITE_CONFIG } from "./constants";

// ════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════
export { ViteConfigError, PluginResolutionError } from "./errors";
