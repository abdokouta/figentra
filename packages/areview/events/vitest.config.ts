/**
 * @file vitest.config.ts
 * @description Shared Vitest configuration for the package.
 */

import { mergeConfig } from "vitest/config";
import { defineConfig } from "@stackra/testing/preset";

/** Public exported symbol. */
export default mergeConfig(defineConfig(), {
  test: {
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.spec.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
