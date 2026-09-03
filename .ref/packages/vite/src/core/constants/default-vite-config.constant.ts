/**
 * @file default-vite-config.constant.ts
 * @module @stackra/vite/core/constants
 * @description Baseline `IViteConfigOptions` defaults every
 *   `defineConfig(...)` call merges its consumer-supplied options
 *   over.
 *
 *   Kept intentionally minimal — only two keys currently:
 *
 *   - `build.target`: `"es2022"` — matches the workspace-wide TS
 *     `target` codified in `@stackra/typescript-config/base`.
 *   - `plugins`: `{}` — empty plugin map; consumers bring their own
 *     factories via `IPluginMap`.
 *
 *   Consumers extend these defaults by passing their own
 *   `IViteConfigOptions`; the `deepMerge` in `defineConfig` layers
 *   consumer values ON TOP OF this constant so a caller who omits
 *   any field inherits the workspace baseline. Every field is
 *   optional in `IViteConfigOptions` so no consumer is forced to
 *   restate the defaults.
 */

import type { IViteConfigOptions } from "../interfaces/vite-config-options.interface";

/**
 * Workspace-baseline Vite config.
 *
 * `Readonly<IViteConfigOptions>` at the type level so the constant
 * is stable — every consumer of `defineConfig` inherits from the
 * same immutable baseline.
 */
export const DEFAULT_VITE_CONFIG: Readonly<IViteConfigOptions> = {
  // Matches the ES target codified by `@stackra/typescript-config/base`.
  // Consumers building for older runtimes override via their own
  // `build.target` in the second argument to `defineConfig`.
  build: {
    target: "es2022",
  },
  // Empty plugin map — consumers author their own; the map resolver
  // walks it via `resolvePlugins`.
  plugins: {},
};
