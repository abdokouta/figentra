/**
 * @file tsup.config.ts
 * @description Package build configuration delegated to the Stackra shared preset.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

/** Public exported symbol. */
export default defineBaseConfig({
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: true,
  clean: true,
});
