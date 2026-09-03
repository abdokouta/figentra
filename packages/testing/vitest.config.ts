/**
 * @file vitest.config.ts
 * @module @stackra/testing/test
 * @description Vitest config for @stackra/testing itself — dogfoods
 *   the base preset the package ships. Uses the LOCAL source (not the
 *   built `dist/`) so tests can run before the first build.
 */

import path from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    // SWC transforms decorators + emits metadata. Every workspace consumer
    // relies on it; we dogfood it here so our own smoke tests use the
    // same transform pipeline.
    swc.vite({ module: { type: "es6" } }) as never,
  ],
  // Vitest 4's default OXC transformer strips decorator metadata; disable
  // it (and esbuild) so SWC owns the emit path exclusively.
  oxc: false,
  esbuild: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/index.ts"],
    },
  },
});
