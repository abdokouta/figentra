import { defineConfig } from "tsup";
import { basePreset } from "@nesvel/tsup-config";

/**
 * Build configuration for @pixielity/mapped-types
 *
 Uses the base preset which:
 * - Outputs both ESM and CJS formats
 * - Generates TypeScript declarations
 * - Includes source maps
 * - Tree-shaking enabled
 */
export default defineConfig({
  ...basePreset,
  bundle: true, // Bundle to avoid missing module errors
});
