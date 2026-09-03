/**
 * @file vitest.config.ts
 * @module @figentra/landing-page/test
 * @description Vitest configuration for the landing-page SPA. Merges
 *   the workspace's canonical React preset
 *   (`@stackra/testing/preset/react`) with app-specific include
 *   patterns.
 *
 *   Every runtime concern (jsdom, testing-library setup, jest-dom
 *   matchers, coverage-v8, SWC transform) lives in the preset —
 *   see `packages/testing/src/preset/react.ts`. Overrides here stay
 *   minimal by design.
 */

import path from "node:path";
import preset from "@stackra/testing/preset/react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      include: [
        "__tests__/unit/**/*.test.{ts,tsx}",
        "__tests__/integration/**/*.test.{ts,tsx}",
      ],
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
  }),
);
