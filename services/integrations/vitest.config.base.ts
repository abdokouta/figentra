/**
 * @file vitest.config.base.ts
 * @description Shared Vitest transform/path configuration for the service.
 */

import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/** Public exported symbol. */
export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite({ module: { type: "es6" } })],
  test: { globals: true, environment: "node", passWithNoTests: true },
});
