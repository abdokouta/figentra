/**
 * @file index.ts
 * @module @stackra/testing/native
 * @description Public API for the workspace-wide React Native
 *   Jest preset — `createJestConfig(...)` + the transform-ignore
 *   pattern helpers + the interfaces. The `setup` entry point
 *   at `@stackra/testing/native/setup` ships side-effect-only
 *   Jest setup script (mocks + reflect-metadata + RNTL matcher
 *   registration).
 *
 *   Usage:
 *
 *   ```js
 *   // jest.config.js
 *   const { createJestConfig } = require("@stackra/testing/native");
 *   module.exports = createJestConfig({ rootDir: __dirname });
 *   ```
 *
 *   Closes `.kiro/backlog-frontend-2026-07-27.md` §5.3.
 */

export { createJestConfig } from "./utils/create-jest-config.util";
export {
  RN_TRANSFORMABLE_MODULES,
  buildTransformIgnorePatterns,
} from "./constants/transform-ignore-patterns.constants";
export type { ICreateJestConfigOptions } from "./interfaces/jest-config-options.interface";
