/** @file vitest.config.ts @description Unit/integration test configuration. */
import { defineConfig } from "vitest/config";

/** Vitest configuration for Gateway source and integration tests. */
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./__tests__/vitest.setup.ts"],
    include: ["__tests__/{unit,integration}/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});
