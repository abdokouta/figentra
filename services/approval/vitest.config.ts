/**
 * @file vitest.config.ts
 * @module @figentra/approval/test
 * @description Unit + integration Vitest config for the approval
 *   NestJS service. Merges the workspace's canonical Nest preset
 *   (`@stackra/testing/preset/nest`) with service-specific include
 *   patterns.
 *
 *   Every Nest concern (SWC transform w/ decorator metadata,
 *   `pool: "forks"` for DI isolation, 30 s test timeout, auto-load
 *   of `@stackra/testing/setup`) lives in the preset — see
 *   `packages/testing/src/preset/nest.ts`. Overrides here stay
 *   minimal by design.
 */

import preset from "@stackra/testing/preset/nest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      include: [
        "__tests__/unit/**/*.test.ts",
        "__tests__/integration/**/*.test.ts",
      ],
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
