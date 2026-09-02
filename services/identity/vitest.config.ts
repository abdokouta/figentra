/**
 * @file vitest.config.ts
 * @description Unit/integration Vitest configuration for the NestJS service.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.base.ts";

/** Public exported symbol. */
export default mergeConfig(base, defineConfig({
  test: {
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
  },
}));
