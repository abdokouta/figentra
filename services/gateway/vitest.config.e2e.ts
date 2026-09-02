/** @file vitest.config.e2e.ts @description Gateway end-to-end test configuration. */
import { defineConfig } from "vitest/config";

/** Vitest configuration for authenticated Gateway E2E tests. */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./__tests__/vitest.setup.ts"],
    include: ["__tests__/e2e/**/*.test.ts"],
    testTimeout: 30000,
  },
});
