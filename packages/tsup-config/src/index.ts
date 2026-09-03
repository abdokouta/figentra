/**
 * @file index.ts
 * @module @stackra/tsup-config
 *
 * @description
 * Shared tsup config helper for every workspace package.
 *
 * Each package's local `tsup.config.ts` calls `defineBaseConfig(entries, {...})`.
 * The base config auto-externalises anything in `dependencies` and
 * `peerDependencies`; anything imported optionally at runtime (lazy `require`
 * / `await import`) must be listed in the `external` override.
 *
 * ## Example
 * ```ts
 * import { defineBaseConfig } from "@stackra/tsup-config";
 *
 * export default defineBaseConfig({
 *   index: "src/index.ts",
 *   react: "src/react/index.ts",
 * });
 * ```
 */

import { defineConfig, type Options } from "tsup";

/** Map of entry names to source paths, array of entries, or single entry string. */
export type Entries = Record<string, string> | string[] | string;

/**
 * Build a tsup config with the workspace's canonical defaults.
 *
 * @param entry - Entry map, entry array, or config object containing entry.
 * @param overrides - Any tsup Options to merge on top.
 * @returns tsup config compatible with `export default`.
 */
export function defineBaseConfig(
  entry: Entries | (Partial<Options> & { entry?: Entries }),
  overrides: Partial<Options> = {},
) {
  let resolvedEntry: Options["entry"];
  let mergedOverrides = overrides;

  if (Array.isArray(entry)) {
    resolvedEntry = entry;
  } else if (typeof entry === "string") {
    resolvedEntry = [entry];
  } else if (entry && typeof entry === "object" && "entry" in entry && entry.entry !== undefined) {
    resolvedEntry = entry.entry as Options["entry"];
    mergedOverrides = { ...entry, ...overrides };
  } else {
    resolvedEntry = entry as Record<string, string>;
  }

  // Capture any package-level esbuild/swc overrides so we can compose
  // instead of clobbering.
  const userEsbuildOptions = mergedOverrides.esbuildOptions;
  const userSwc = mergedOverrides.swc;

  return defineConfig({
    entry: resolvedEntry,
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    // ── Code splitting: mandatory for DI class-identity ─────────────
    //
    // `@stackra/container` identifies providers by class-object
    // identity — `moduleRef.providers.get(token)` is a Map lookup
    // where `token` is the class reference itself, not its name.
    //
    // With splitting disabled, tsup builds each entry (`.`, `./react`,
    // `./native`, `./testing`) independently. Any class imported by
    // two entries gets emitted as TWO separate class objects — one
    // per bundle. The module (in `./`) registers class-A; the
    // provider (in `./react`) injects class-B. The container's
    // `Map.get(class-B)` misses because it was stored under `class-A`.
    // Consumers see `Error: Provider 'X' not found in any module` at
    // render time even though the module clearly provides X.
    //
    // Splitting emits shared chunks (chunk-*.mjs) that every entry
    // imports from — the class is compiled once, all bundles share
    // one identity, and DI resolves correctly across subpath
    // boundaries. Vite / esbuild's tree-shaking still eliminates
    // unused exports at the consumer side.
    //
    // Splitting only applies to ESM output — CJS format is inherently
    // non-splittable. Node consumers importing multiple subpaths from
    // a CJS build still hit the identity split, so CJS consumers
    // should stick to a single entry per DI graph (typical for Node
    // tests — vitest runs against ESM by default anyway).
    splitting: true,
    treeshake: true,
    target: "es2022",
    tsconfig: "./tsconfig.json",
    // Preserve class names — the DI container uses `Class.name` for
    // the error message shown when a provider lookup fails (identity
    // still matches by reference; the name is diagnostic).
    keepNames: true,
    ...overrides,
    // ── JSX automatic runtime ────────────────────────────────────────────
    //
    // Every React-shipping package MUST emit the automatic JSX runtime
    // (`import { jsx as _jsx } from 'react/jsx-runtime'`) so authors do
    // not need `import * as React from 'react'` just to satisfy a
    // classic `React.createElement(...)` transform.
    //
    // Two layers pipeline JSX in this repo — both need to know:
    //
    // 1. **swc** (via `unplugin-swc` / `@swc/core`) runs FIRST when
    //    `emitDecoratorMetadata` is on (which the shared base tsconfig
    //    enables for NestJS-compatible DI). swc rewrites JSX BEFORE
    //    esbuild sees the code and defaults to the classic runtime —
    //    so we must set `swc.jsc.transform.react.runtime = 'automatic'`
    //    or the JSX comes out as `React.createElement(...)` with no
    //    `React` symbol imported, causing a runtime `ReferenceError:
    //    React is not defined`.
    //
    // 2. **esbuild** runs after swc for the final bundle. Setting
    //    `options.jsx = 'automatic'` is redundant for packages that
    //    go through swc, but keeps the setting correct for any file
    //    that ever bypasses swc.
    //
    // The base tsconfig already declares `"jsx": "react-jsx"`, but
    // neither swc (with `swcrc: false`) nor esbuild traverses the
    // tsconfig `extends` chain for the JSX field, so the intent has
    // to be repeated here.
    //
    // We cast the swc object because tsup's `SwcPluginConfig` types
    // `logger` as required, and TypeScript can't infer that a partial
    // spread will get filled by tsup's own defaults at build time.
    swc: {
      ...userSwc,
      jsc: {
        ...userSwc?.jsc,
        transform: {
          ...userSwc?.jsc?.transform,
          react: {
            ...userSwc?.jsc?.transform?.react,
            runtime: "automatic",
          },
        },
      },
    } as Options["swc"],
    esbuildOptions(options, context) {
      options.jsx = "automatic";
      if (userEsbuildOptions) userEsbuildOptions(options, context);
    },
  });
}
