/**
 * @file vitest.config.ts
 * @description Vitest configuration for the {{SLUG}} package.
 */

import preset from "@stackra/testing/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {},
  }),
);
