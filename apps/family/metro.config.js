// =============================================================================
// Metro — @figentra/family  (Expo Router · pnpm workspace)
// =============================================================================
//
// The default Expo Metro config, patched for a pnpm MONOREPO. pnpm does NOT
// hoist a flat node_modules; each package keeps a symlinked tree and shared
// deps live at the workspace root. Metro must therefore:
//
//   1. WATCH the workspace root so changes in shared/local packages rebuild.
//   2. RESOLVE from BOTH this app's node_modules AND the workspace root's, in
//      that order (app-local wins).
//   3. DISABLE hierarchical lookup — pnpm's non-flat layout breaks Metro's
//      default walk-up-the-tree resolution; the explicit nodeModulesPaths above
//      are authoritative instead.
//
// No secrets, no env reads here — build-time public config is injected by EAS
// via EXPO_PUBLIC_* (see eas.json) and read through expo-constants at runtime.
// =============================================================================

const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch the whole workspace (shared packages + local sources).
config.watchFolders = [workspaceRoot];

// 2. Resolve app-local node_modules first, then the hoisted workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. pnpm's symlinked, non-hoisted layout — force the explicit paths above.
config.resolver.disableHierarchicalLookup = true;

module.exports = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./src/styles/global.css",
  dtsFile: "./src/uniwind.d.ts",
});
