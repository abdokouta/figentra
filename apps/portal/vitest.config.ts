/**
 * @file vitest.config.ts
 * @description Vitest configuration for the Figentra web application.
 */

import { defineConfig } from "vitest/config";

/** Public exported symbol. */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["__tests__/unit/**/*.test.ts", "__tests__/unit/**/*.test.tsx", "__tests__/integration/**/*.test.tsx"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    passWithNoTests: true,
  },
});
