/**
 * @file vitest.config.ts
 * @description Vitest configuration for the {{SLUG}} service.
 *   Merges the workspace's canonical NestJS preset (SWC, decorator metadata,
 *   tsconfig-paths) with any service-specific overrides.
 */

import preset from "@stackra/testing/preset/nest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
