/**
 * @file vitest.config.ts
 * @description Vitest configuration for the Cloudflare Worker.
 */

import { defineConfig } from "vitest/config";

/** Public exported symbol. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    passWithNoTests: true,
  },
});
