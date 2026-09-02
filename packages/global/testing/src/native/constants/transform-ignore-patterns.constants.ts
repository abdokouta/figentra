/**
 * @file transform-ignore-patterns.constants.ts
 * @module @stackra/testing/native
 * @description Canonical `transformIgnorePatterns` regex for the RN
 *   Jest preset.
 *
 *   Two forms of the same rule are baked in:
 *
 *   1. **The `node_modules/` regex whitelists** RN + Expo + HeroUI
 *      Native peers so Babel transforms their ESM source (they don't
 *      ship pre-compiled ESM+CJS the way `@stackra/*` does).
 *
 *   2. **Every workspace `@stackra/*` package** resolves via pnpm's
 *      workspace symlink to `packages/frontend/*\/dist/*.js` — NOT to
 *      a `node_modules/` path. The default Jest ignore ONLY ignores
 *      `node_modules/`, so without an explicit exclusion Jest tries
 *      to Babel-transform the (already-compiled) dist output and
 *      fails on new-syntax constructs like `static { ... }` blocks
 *      that `@react-native/babel-preset` doesn't handle. The
 *      `packages/.*\/dist/` entry below tells Jest to skip Babel
 *      for every workspace package's already-emitted output.
 */

/**
 * Names of every third-party package Babel MUST transform. Extend
 * via `createJestConfig({ extraTransformableModules: ["my-pkg"] })`
 * when a consumer pulls in a fresh ESM-only RN dep.
 */
export const RN_TRANSFORMABLE_MODULES: readonly string[] = [
  "@?react-native",
  "@react-navigation",
  "@react-native-community",
  "@react-native-async-storage",
  "heroui-native(-pro)?",
  "expo(nent)?",
  "@expo",
  "@unimodules",
  "react-native-mmkv",
  "react-native-safe-area-context",
  "react-native-gesture-handler",
  "react-native-reanimated",
  "react-native-screens",
  "react-native-svg",
  "react-native-config",
];

/**
 * Build a `transformIgnorePatterns` array. Given the workspace's
 * pnpm `.pnpm/` symlink layout + the workspace `dist/` compiled
 * output, every RN Jest config lands on the same two entries.
 *
 * @param extra - Extra module basenames to whitelist for
 *   Babel-transform (matches inside the `node_modules/(...)/` regex).
 * @returns A `transformIgnorePatterns` array ready to pass to Jest.
 */
export function buildTransformIgnorePatterns(
  extra: readonly string[] = [],
): readonly string[] {
  const modules = [...RN_TRANSFORMABLE_MODULES, ...extra].join("|");
  return [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:jest-)?(${modules}))`,
    // Skip every workspace `@stackra/*` package's compiled dist —
    // it's already valid runtime JS from tsup; Babel doesn't need
    // to re-process it.
    "packages/.*/dist/",
  ];
}
