/**
 * @file vitest.config.e2e.ts
 * @description E2E Vitest boundary for the NestJS service.
 */

import { mergeConfig, defineConfig } from "vitest/config";
import base from "./vitest.config.base.ts";

/** Public exported symbol. */
export default mergeConfig(base, defineConfig({
  test: {
    include: ["__tests__/e2e/**/*.e2e.test.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
  },
}));
