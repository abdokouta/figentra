/**
 * @file jest-config-options.interface.ts
 * @module @stackra/testing/native
 * @description Options accepted by `createJestConfig(...)`.
 */

/**
 * Options for `createJestConfig(...)`.
 *
 * Every workspace RN app + template extends this shape; consumers
 * override only the fields they need to tweak per-app.
 */
export interface ICreateJestConfigOptions {
  /**
   * Absolute path to the consumer app's root directory. Every Jest
   * config needs this to resolve `<rootDir>` correctly. Typically
   * `__dirname` in the consumer's `jest.config.js`.
   */
  readonly rootDir: string;

  /**
   * Extra module basenames to whitelist for Babel-transform
   * (matches inside the `node_modules/(...)/` regex). Use when a
   * consumer pulls in a fresh ESM-only RN dep that isn't in
   * `RN_TRANSFORMABLE_MODULES`.
   *
   * @default []
   */
  readonly extraTransformableModules?: readonly string[];

  /**
   * Additional `setupFilesAfterEnv` paths appended AFTER
   * `@stackra/testing/native/setup`. Typically used to bootstrap
   * app-specific DI containers (`TestAppModule`), register per-app
   * mocks, or extend `expect` further.
   *
   * @default []
   */
  readonly additionalSetupFiles?: readonly string[];

  /**
   * Extra `moduleNameMapper` entries appended AFTER the workspace
   * defaults (`@/*` and `@app/*`).
   *
   * @default {}
   */
  readonly extraModuleNameMapper?: Readonly<Record<string, string>>;

  /**
   * Extra `testPathIgnorePatterns` appended AFTER the workspace
   * defaults (node_modules, e2e, ios, android, coverage).
   *
   * @default []
   */
  readonly extraTestPathIgnorePatterns?: readonly string[];
}
