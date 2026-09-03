/**
 * @file vitest.config.e2e.ts
 * @module @figentra/approval/test
 * @description End-to-end Vitest config for the approval service.
 *   Same preset as `vitest.config.ts` (Nest + Fastify + supertest);
 *   the only delta is the include pattern (only `__tests__/e2e/**`).
 */

import preset from "@stackra/testing/preset/nest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      include: ["__tests__/e2e/**/*.e2e.test.ts"],
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
