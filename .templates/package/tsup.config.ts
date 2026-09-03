/**
 * @file tsup.config.ts
 * @description tsup build configuration for the {{SLUG}} package.
 *   Uses the workspace's shared `defineBaseConfig` from `@stackra/tsup-config`.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig({
  index: "src/core/index.ts",
});
