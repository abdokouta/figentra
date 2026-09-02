/**
 * @file tsup.config.ts
 * @description Multi-entry build configuration for the Figentra observability platform package.
 */
import { defineConfig } from "tsup";

/**
 * Builds all public observability subpath entrypoints with declarations.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    contracts: "src/contracts/index.ts",
    core: "src/core/index.ts",
    nest: "src/nest/index.ts",
    worker: "src/worker/index.ts",
    testing: "src/testing/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
});
