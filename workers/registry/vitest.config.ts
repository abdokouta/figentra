/**
 * @file vitest.config.ts
 * @description Vitest configuration for the Cloudflare Worker.
 */

import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/** Public exported symbol. */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    passWithNoTests: true,
  },
});
