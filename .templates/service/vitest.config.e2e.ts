/**
 * @file vitest.config.e2e.ts
 * @description E2E test configuration. Boots the full NestJS app + Fastify
 *   against a test database (PGlite) and runs HTTP-level assertions.
 */

import preset from "@stackra/testing/preset/nest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      include: ["__tests__/e2e/**/*.{test,spec}.ts"],
      testTimeout: 30_000,
      hookTimeout: 30_000,
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
