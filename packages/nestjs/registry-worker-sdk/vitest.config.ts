/**
 * @file vitest.config.ts
 * @description Vitest configuration for @figentra/registry package.
 *
 * Uses the monorepo SWC preset (via mergeConfig) so that NestJS decorator metadata
 * (design:paramtypes) is emitted correctly for DI container tests.
 */

import { mergeConfig } from "vitest/config";
import preset from "@stackra/testing/preset";

export default mergeConfig(preset, {
  test: {
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.spec.ts"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
