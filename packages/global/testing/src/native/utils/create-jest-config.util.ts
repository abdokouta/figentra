/**
 * @file create-jest-config.util.ts
 * @module @stackra/testing/native
 * @description Factory that returns the workspace-canonical Jest
 *   config for a React Native package or app.
 *
 *   Wraps three concerns beyond the RN default preset:
 *
 *   1. **pnpm `.pnpm/` layout** — the default RN `transformIgnorePatterns`
 *      only whitelists `node_modules/@react-native/*`; pnpm keeps every
 *      package under `node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>`
 *      which the default regex misses. `buildTransformIgnorePatterns`
 *      extends the pattern so pnpm-installed RN + React Navigation +
 *      HeroUI Native + Expo modules still get Babel-transformed.
 *
 *   2. **DI decorator metadata** — `@stackra/container`'s decorators
 *      need `emitDecoratorMetadata: true` (set in the consumer's
 *      `tsconfig.json`). Babel picks that up via
 *      `@react-native/babel-preset` when `useDefineForClassFields`
 *      is off.
 *
 *   3. **RN-Testing-Library extended matchers** — RNTL v12.4+ ships
 *      built-in Jest matchers (`toBeVisible`, `toHaveTextContent`,
 *      `toHaveProp`, ...) that auto-register on any import from
 *      `@testing-library/react-native`. `@stackra/testing/native/setup`
 *      registers them + every workspace-canonical mock.
 *
 *   Usage:
 *
 *   ```js
 *   // jest.config.js
 *   const { createJestConfig } = require("@stackra/testing/native");
 *
 *   module.exports = createJestConfig({
 *     rootDir: __dirname,
 *     additionalSetupFiles: ["<rootDir>/jest.di.setup.ts"],
 *   });
 *   ```
 *
 *   Closes `.kiro/backlog-frontend-2026-07-27.md` §5.3.
 */

import { buildTransformIgnorePatterns } from "../constants/transform-ignore-patterns.constants";

import type { ICreateJestConfigOptions } from "../interfaces/jest-config-options.interface";

/**
 * Absolute path to `@stackra/testing/native/setup`. Consumers pass
 * this through `setupFilesAfterEnv` verbatim; `require.resolve`
 * would fail inside the returned config because Jest evaluates
 * `setupFilesAfterEnv` entries lazily against its own resolver.
 *
 * The build emits `dist/native.setup.js` (per the tsup entry) and
 * we point at that emitted asset directly. Consumers who haven't
 * built `@stackra/testing` yet will see a resolver error at Jest
 * boot time; run `pnpm --filter @stackra/testing build` first.
 */
const SETUP_MODULE_PATH = "@stackra/testing/native/setup";

/**
 * Build the workspace-canonical Jest config for a React Native
 * consumer. Every field defaults to the workspace's recommended
 * shape; overrides go through `ICreateJestConfigOptions`.
 *
 * @param options - Consumer-specific overrides.
 * @returns A Jest config object ready to `module.exports =` from
 *   `jest.config.js`.
 */
export function createJestConfig(
  options: ICreateJestConfigOptions,
): Record<string, unknown> {
  const {
    rootDir,
    extraTransformableModules = [],
    additionalSetupFiles = [],
    extraModuleNameMapper = {},
    extraTestPathIgnorePatterns = [],
  } = options;

  return {
    preset: "@react-native/jest-preset",
    rootDir,

    // Path aliases must match `babel.config.js` + `tsconfig.json`.
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
      "^@app/(.*)$": "<rootDir>/src/$1",
      ...extraModuleNameMapper,
    },

    // Extended for the pnpm layout + workspace `dist/` skip.
    transformIgnorePatterns: buildTransformIgnorePatterns(
      extraTransformableModules,
    ),

    // Test file patterns — matches both the app's __tests__ and any
    // colocated `*.spec.(ts|tsx)` next to source.
    testMatch: [
      "<rootDir>/__tests__/**/*.test.(ts|tsx)",
      "<rootDir>/src/**/*.spec.(ts|tsx)",
    ],

    // Exclude Detox E2E, native platform dirs, and coverage output.
    testPathIgnorePatterns: [
      "<rootDir>/node_modules/",
      "<rootDir>/e2e/",
      "<rootDir>/ios/",
      "<rootDir>/android/",
      "<rootDir>/coverage/",
      ...extraTestPathIgnorePatterns,
    ],

    // Workspace-shared setup FIRST, then any app-specific setup.
    // The workspace setup registers reflect-metadata, RNTL matchers,
    // and the canonical mock set; additional setup files layer
    // DI bootstrap / per-app mocks on top.
    setupFilesAfterEnv: [SETUP_MODULE_PATH, ...additionalSetupFiles],

    collectCoverageFrom: [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.tsx",
      "!src/**/index.ts",
      "!src/testing/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
  };
}
