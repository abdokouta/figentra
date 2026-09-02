/**
 * @file vitest.config.ts
 * @description Unit-test configuration for the observability platform package.
 */
import { defineConfig } from "vitest/config";

/**
 * Defines the isolated package test suite.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
