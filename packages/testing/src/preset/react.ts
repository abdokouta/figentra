/**
 * @file react.ts
 * @module @stackra/testing/preset/react
 * @description React + jsdom Vitest preset. Extends the base preset
 *   with:
 *
 *   - `environment: "jsdom"` — browser-shaped DOM for component tests.
 *   - `setupFiles: ["@stackra/testing/react/setup"]` — registers
 *     `@testing-library/jest-dom` matchers + `afterEach` cleanup.
 *   - `resolve.conditions: ["browser"]` — pulls the browser build
 *     of any peer that ships a dual `node` / `browser` export.
 *
 * @example
 * ```ts
 * import preset from "@stackra/testing/preset/react";
 * import { defineConfig, mergeConfig } from "vitest/config";
 *
 * export default mergeConfig(
 *   preset,
 *   defineConfig({
 *     test: { include: ["__tests__/**\/*.test.tsx"] },
 *   }),
 * );
 * ```
 */

import { defineConfig, mergeConfig } from "vitest/config";

import base from "./base";

const react = mergeConfig(
  base,
  defineConfig({
    resolve: {
      // Every peer that ships `exports: { browser: ..., node: ... }`
      // resolves to its browser build inside jsdom.
      conditions: ["browser"],
    },
    test: {
      environment: "jsdom",
      // Component tests need jest-dom matchers + RTL cleanup.
      setupFiles: ["@stackra/testing/react/setup"],
      // Include `.tsx` — component tests carry the JSX extension.
      include: ["__tests__/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
      // Enable CSS module handling so styled components resolve.
      css: {
        modules: {
          classNameStrategy: "non-scoped",
        },
      },
    },
  }),
);

export default react;
