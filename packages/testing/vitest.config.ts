/**
 * @file vitest.config.ts
 * @module @stackra/testing
 * @description Self-test config for `@stackra/testing`.
 *
 *   Historically this file was a no-op stub because the package
 *   shipped zero tests (TEST-002 in the frontend-final-production-
 *   review). It now runs the package's own `__tests__/` suite —
 *   the `Assertable` bookkeeper, `createAssertableProxy` forwarder,
 *   `CallAssertion` DSL, and the `freezeTime` / `travelTo` /
 *   `restoreTime` helpers.
 *
 *   The config is intentionally self-contained (does NOT merge the
 *   preset from `./src/preset/index.ts`) because that preset is the
 *   thing under test — importing it would drag its resolve/plugins
 *   graph into the harness that's supposed to verify it. Instead we
 *   set the same knobs the preset does, minus SWC (self-tests need
 *   no decorator metadata).
 */

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
