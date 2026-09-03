/**
 * @file define-config.util.ts
 * @module @stackra/vite/core/utils
 * @description `defineConfig(options)` — the workspace's thin,
 *   type-safe wrapper over Vite's own `defineConfig` that resolves
 *   the workspace's `IPluginMap` envelope into Vite's native
 *   `plugins: Plugin[]` array.
 *
 *   ## Contract
 *
 *   1. Start from {@link DEFAULT_VITE_CONFIG} — the workspace baseline
 *      (ES2022 target + empty plugin map).
 *   2. Deep-merge the consumer-supplied `options` on top (via
 *      {@link deepMerge}). Consumer values ALWAYS win on conflict.
 *   3. Resolve the merged `plugins: IPluginMap` into the flat
 *      `Plugin[]` shape Vite's `UserConfig` expects (via
 *      {@link resolvePlugins}).
 *   4. Hand the resolved config to Vite's own `defineConfig` so
 *      consumers still get the exact `UserConfig` type at the call
 *      site.
 *
 *   ## Why the wrapper
 *
 *   The workspace's `IPluginMap` envelope
 *   (`{ enabled, factory, options }` per plugin key) enables:
 *
 *   - Env-driven feature toggles — a consumer overrides
 *     `plugins.pwa.enabled = false` in a preview build without
 *     rebuilding the plugin factory.
 *   - Consistent typed access — every workspace app authors its
 *     plugin map with the same envelope shape, so reviewers can
 *     tell at a glance which plugins are enabled per app.
 *   - Deep-merge safety — the map keys are plain strings; two
 *     halves of the app (e.g. base config + preview overrides)
 *     merge cleanly without accidental array concatenation.
 *
 *   Vite's raw `plugins: PluginOption[]` shape can't do any of that
 *   because it's an unnamed list — no key means no override target.
 */

import { defineConfig as viteDefineConfig, type UserConfig } from "vite";

import { DEFAULT_VITE_CONFIG } from "../constants/default-vite-config.constant";
import type { IViteConfigOptions } from "../interfaces/vite-config-options.interface";
import { deepMerge } from "./deep-merge.util";
import { resolvePlugins } from "./resolve-plugins.util";

/**
 * Type-safe Vite config helper.
 *
 * @param options - Consumer-supplied `IViteConfigOptions`. Every
 *   field optional — omitted fields inherit from
 *   {@link DEFAULT_VITE_CONFIG}.
 * @returns Vite's own `UserConfig` shape, ready to `export default`
 *   from an app's `vite.config.ts`.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/vite';
 * import react from '@vitejs/plugin-react';
 *
 * export default defineConfig({
 *   plugins: {
 *     react: { enabled: true, factory: react, options: {} },
 *   },
 *   server: { port: 3000 },
 * });
 * ```
 */
export async function defineConfig(
  options: IViteConfigOptions = {},
): Promise<UserConfig> {
  // Deep-merge the consumer's options on top of the workspace
  // baseline. `deepMerge` treats `plugins` as a plain object so the
  // consumer's map extends the (currently empty) default map — the
  // `plugins.<key>.enabled = false` override case works out of the
  // box.
  const merged = deepMerge(DEFAULT_VITE_CONFIG as IViteConfigOptions, options);

  // Resolve the merged `IPluginMap` into Vite's flat `Plugin[]`
  // shape. `resolvePlugins` is async because plugin factories may
  // return a `Promise<Plugin>` (Vite supports both shapes). We
  // propagate the promise up through this function's own return
  // type — Vite's `defineConfig(...)` accepts a `Promise<UserConfig>`
  // at the call site, so an app's `export default defineConfig({...})`
  // still works without a top-level `await`.
  const resolvedPlugins = await resolvePlugins(merged.plugins ?? {});

  // Hand the resolved config to Vite's own `defineConfig` so the
  // caller inherits Vite's full type contract. Strip the workspace
  // `IPluginMap` off the merged shape before passing to Vite — the
  // resolved `Plugin[]` array replaces it.
  const { plugins: _map, ...rest } = merged;
  return viteDefineConfig({
    ...(rest as UserConfig),
    plugins: resolvedPlugins,
  });
}
