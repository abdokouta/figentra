/**
 * @file base.ts
 * @module @stackra/testing/preset
 * @description Canonical base Vitest preset for every workspace
 *   package/service/worker/app. Ships as the default export of the
 *   `@stackra/testing/preset` subpath.
 *
 *   Design goals:
 *
 *   - **SWC owns transform** — Vitest 4's default OXC transformer
 *     strips `emitDecoratorMetadata` output, which every NestJS +
 *     `@stackra/container` consumer depends on. SWC (via
 *     `unplugin-swc`) preserves it. `oxc: false` + `esbuild: false`
 *     tell Vitest to disable both native transformers so SWC is the
 *     sole pipeline entry.
 *
 *   - **tsconfig-paths** — every workspace package declares
 *     `paths: { "@/*": ["./src/*"] }` (per `tsconfig.json`
 *     convention); tests need the same alias resolution.
 *
 *   - **Coverage via V8** — Node's built-in coverage. `@vitest/
 *     coverage-v8` is an optional peer; consumers who don't run
 *     coverage never install it.
 *
 *   - **Node env by default** — every non-UI package tests against
 *     Node. The `/preset/react` subpath swaps `environment: 'jsdom'`
 *     for consumers that render components.
 *
 * @example
 * ```ts
 * import preset from "@stackra/testing/preset";
 * import { defineConfig, mergeConfig } from "vitest/config";
 *
 * export default mergeConfig(
 *   preset,
 *   defineConfig({
 *     test: { setupFiles: ["./__tests__/vitest.setup.ts"] },
 *   }),
 * );
 * ```
 */

import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Default base preset. Consumers `import preset from
 * "@stackra/testing/preset"` and `mergeConfig(preset, ...)`.
 */
const base = defineConfig({
  plugins: [
    // ── vite-tsconfig-paths ───────────────────────────────────────
    //
    // Reads `tsconfig.json`'s `compilerOptions.paths` and rewrites
    // matching imports at test time. Every workspace package
    // declares `paths: { "@/*": ["./src/*"] }`, so tests can write
    // `import { Foo } from "@/services/foo.service"` and the
    // resolver walks the local `src/` folder.
    tsconfigPaths(),

    // ── unplugin-swc ─────────────────────────────────────────────
    //
    // SWC's ES module transform preserves decorator metadata. The
    // `type: "es6"` option keeps the emit as native ESM (matching
    // every workspace package's `"type": "module"` field).
    //
    // Cast to `never` because unplugin-swc's return type is a
    // `PluginOption` from Vite v5's type surface, which drifts from
    // Vitest 4's re-export of Vite's plugin shape. Runtime behaviour
    // is identical.
    swc.vite({ module: { type: "es6" } }) as never,
  ],

  // ── Transformer discipline ──────────────────────────────────────
  //
  // Vitest 4 ships OXC as the default transformer. OXC strips the
  // decorator-metadata emit every NestJS + @stackra/container
  // consumer depends on. Disable both native transformers so SWC
  // (registered above via `unplugin-swc`) owns the emit path
  // exclusively.
  oxc: false,
  esbuild: false,

  test: {
    // Global `describe` / `it` / `expect` — matches Jest's implicit
    // globals + every workspace test file's expectations.
    globals: true,

    // Node runtime by default. React consumers merge `/preset/react`
    // which sets `environment: "jsdom"` on top.
    environment: "node",

    // Never fail a package that legitimately ships zero tests
    // (config packages, barrel-only packages).
    passWithNoTests: true,

    // Include pattern — every workspace package puts tests either
    // under `__tests__/**` (top-level suite folder) or beside the
    // source (`src/**/*.test.ts`). Both are supported.
    include: [
      "__tests__/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
    ],
    // Never scan build artefacts.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/.wrangler/**",
      "**/coverage/**",
    ],

    // Per-test-file timeout — 10 s. Nest bootstraps + PGlite fixtures
    // routinely hit ~2 s; 10 s leaves headroom without hiding runaway
    // tests.
    testTimeout: 10_000,
    // Hook timeout matches — beforeAll/afterAll may run migrations.
    hookTimeout: 10_000,

    coverage: {
      // V8 (Node built-in) — no compile-step overhead.
      provider: "v8",
      // Text + HTML + LCOV — humans read text, browsers read HTML,
      // CI uploads LCOV to Codecov / GitLab coverage widgets.
      reporter: ["text", "html", "lcov"],
      // Only measure package-owned source. `.ts` (and `.tsx` for the
      // React consumers).
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/index.ts",
        "src/**/*.interface.ts",
        "src/**/*.type.ts",
      ],
    },
  },
});

export default base;
