/**
 * @file resolve-app-meta.util.ts
 * @module @stackra/vite/core/utils
 * @description Discover an app's root directory + package version
 *   from a Vite config's `import.meta.url` — the boilerplate every
 *   workspace app's `vite.config.ts` was hand-rolling.
 *
 * ## The problem this solves
 *
 * Every workspace Vite config opens the same six lines:
 *
 * ```ts
 * import { readFileSync } from "node:fs";
 * import { fileURLToPath, URL } from "node:url";
 *
 * const resolvePath = (p: string): string =>
 *   fileURLToPath(new URL(p, import.meta.url));
 * const pkg = JSON.parse(readFileSync(resolvePath("./package.json"), "utf-8")) as {
 *   version?: string;
 * };
 * const version = pkg.version ?? "dev";
 * ```
 *
 * Six lines × N apps × two configs per app (vite + vitest) = drift.
 * One app's `pkg.version ?? "dev"` becomes another's
 * `pkg.version ?? "0.0.0"` becomes another's `pkg.version` (crash
 * on undefined). `resolveAppMeta` is that block, once.
 *
 * ## Why not `@stackra/support`
 *
 * `@stackra/support` ships to the browser bundle — it cannot touch
 * `node:fs` unconditionally. This helper is BUILD-TIME only
 * (consumed from `vite.config.ts`); `@stackra/vite` is the correct
 * home for build-time helpers that need Node core APIs.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, URL as NodeURL } from "node:url";

import type {
  IResolveAppMetaOptions,
  IResolveAppMetaResult,
} from "../interfaces/resolve-app-meta.interface";

/**
 * Walk upward from `startDir` until a directory containing a
 * `package.json` is found. Returns the discovered directory.
 * Throws when the walk reaches the filesystem root without
 * finding one — a config file that isn't inside a package is a
 * misconfiguration reviewers should surface, not paper over.
 */
function findPackageRoot(startDir: string): string {
  let current = startDir;
  // Bounded by the filesystem root — `dirname('/')` === `'/'`,
  // so the loop terminates whether or not a package.json exists.
  // Prevents an infinite loop on exotic filesystems where
  // `dirname` returns a different sentinel.
  let previous = "";
  while (current !== previous) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    previous = current;
    current = dirname(current);
  }
  throw new Error(
    `[@stackra/vite] resolveAppMeta: no package.json found by walking upward from "${startDir}". ` +
      `Pass \`rootRelative\` in the options to override the default walk-up.`,
  );
}

/**
 * Discover an app's root directory + package version from its
 * Vite config's `import.meta.url`.
 *
 * ## Usage
 *
 * ```ts
 * import { defineConfig, resolveAppMeta } from "@stackra/vite";
 *
 * const meta = resolveAppMeta({ configUrl: import.meta.url });
 *
 * export default defineConfig({
 *   define: {
 *     __APP_VERSION__: JSON.stringify(meta.version),
 *     __STACKRA_ROOT__: JSON.stringify(meta.root),
 *   },
 *   resolve: { alias: { "@": meta.resolvePath("./src") } },
 *   envDir: meta.resolvePath("./environments"),
 * });
 * ```
 *
 * ## Discovery contract
 *
 * 1. Convert `configUrl` (a `file://` URL) into a filesystem
 *    directory via `fileURLToPath` + `dirname`.
 * 2. When `rootRelative` is set, join it with the config's
 *    directory and treat the result as the app root — no
 *    walk-up. This is the escape hatch for configs that live in
 *    unusual locations (nested workspaces, test fixtures).
 * 3. Otherwise, walk upward from the config's directory until a
 *    directory containing `package.json` is found.
 * 4. Read + parse `package.json`. Missing / unreadable → treat
 *    as `{}` (a config that lives in a package without a
 *    package.json is a misconfiguration, but we fail soft so
 *    `pnpm build` still surfaces the underlying issue).
 * 5. Return the app root + parsed manifest + resolver helper.
 *
 * @param options - See {@link IResolveAppMetaOptions}.
 * @returns The app-root path, name, version, parsed package.json,
 *   and a `resolvePath(rel)` helper relative to the app root.
 */
export function resolveAppMeta(
  options: IResolveAppMetaOptions,
): IResolveAppMetaResult {
  const { configUrl, rootRelative, versionOverride } = options;

  // `import.meta.url` is a `file://<path>` URL — convert to an
  // absolute path then take its directory. `dirname` is more
  // reliable than `new URL("./", configUrl)` on Windows where
  // paths with drive letters can round-trip incorrectly.
  const configDir = dirname(fileURLToPath(new NodeURL(configUrl)));

  // Escape hatch: caller pins the app root explicitly. Used for
  // test harnesses + configs that live in unusual locations.
  const root =
    rootRelative !== undefined
      ? resolve(configDir, rootRelative)
      : findPackageRoot(configDir);

  // Read + parse package.json. Fail soft — the walk-up already
  // confirmed the file exists, but a follow-on `readFile` could
  // still race with a `git clean` on the same directory.
  const packageJsonPath = join(root, "package.json");
  let packageJson: Record<string, unknown> = {};
  if (existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(
        readFileSync(packageJsonPath, "utf-8"),
      ) as Record<string, unknown>;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `[@stackra/vite] resolveAppMeta: failed to parse "${packageJsonPath}" — ` +
          `treating as empty. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const version =
    versionOverride ??
    (typeof packageJson.version === "string" ? packageJson.version : "dev");
  const name =
    typeof packageJson.name === "string" ? packageJson.name : "unknown";

  return {
    root,
    name,
    version,
    packageJson,
    resolvePath: (relative: string): string => resolve(root, relative),
  };
}
