/**
 * @file vitest.config.ts
 * @description Vitest configuration for the {{SLUG}} Worker.
 *   Merges the workspace's Cloudflare Workers preset (vitest-pool-workers)
 *   with any worker-specific overrides.
 */

import preset from "@stackra/testing/preset/worker";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
