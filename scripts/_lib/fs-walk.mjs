/**
 * @file fs-walk.mjs
 * @module scripts/_lib/fs-walk
 * @description Recursive git-repo discovery. Given a root directory,
 *   walks depth-first up to `maxDepth` and returns every clone
 *   (subdirectory that carries a `.git` entry) as
 *   `{ subpath, absPath }` where `subpath` is the relative path from
 *   `root` (e.g. `mobile`, `backend/api`).
 *
 *   Stops descending once a `.git` is found — the contents of a clone
 *   are never scanned. Missing roots return `[]` with a warning;
 *   unreadable subdirectories skip silently.
 *
 *   Uses `readdirSync` + `statSync` — cross-platform on Windows,
 *   Linux, macOS (no shell-outs). Symlinks are followed once via
 *   `statSync` (which follows) rather than `lstatSync` (which
 *   doesn't); a self-referential symlink loop is broken by
 *   `maxDepth`.
 *
 * ## Usage
 *
 * ```javascript
 * import { walkGitRepos } from "./_lib/fs-walk.mjs";
 *
 * const repos = walkGitRepos("/Users/x/dev/academorix", { maxDepth: 3 });
 * // [
 * //   { subpath: "backend/ai",  absPath: "/Users/x/dev/academorix/backend/ai" },
 * //   { subpath: "backend/api", absPath: "/Users/x/dev/academorix/backend/api" },
 * //   { subpath: "mobile",      absPath: "/Users/x/dev/academorix/mobile" },
 * // ]
 * ```
 *
 * ## Depth semantics
 *
 *   `maxDepth: 1` — root's immediate children only (same as an
 *   `ls` of the root). Legacy behaviour.
 *   `maxDepth: 3` — walks up to 3 levels down. Sufficient for the
 *   workspace's deepest layout (`academorix/backend/api` is 2 levels
 *   from the `academorix/` root).
 *   Directories with a `.git` inside are recorded then NOT descended
 *   into — the `maxDepth` cap only applies to non-repo subdirectories.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { log } from "./log.mjs";

/**
 * @typedef {object} GitRepo
 * @property {string} subpath  Path relative to walk root (e.g. `mobile`
 *                             or `backend/api`). Always POSIX-style
 *                             (`/`-separated), even on Windows — the
 *                             `subpath` is a semantic identifier, not
 *                             a filesystem path. Use `absPath` when
 *                             passing to git / fs APIs.
 * @property {string} absPath  Absolute path, native separator.
 */

/**
 * @typedef {object} WalkOptions
 * @property {number} [maxDepth=3]
 *   How many levels below `root` to descend. `1` = root's immediate
 *   children only. Descent stops at every `.git` boundary regardless.
 */

/**
 * Walk `root` for git repos.
 *
 * @param {string} root
 * @param {WalkOptions} [options]
 * @returns {GitRepo[]}  Sorted alphabetically by `subpath`.
 */
export function walkGitRepos(root, options = {}) {
  const maxDepth = options.maxDepth ?? 3;

  if (!existsSync(root)) {
    log.warn(`root missing: ${root} (skipped — run dev-*.mjs first)`);
    return [];
  }

  /** @type {GitRepo[]} */
  const repos = [];

  /**
   * @param {string} dir       Absolute directory to inspect.
   * @param {string} subpath   Relative subpath from root ("" at root itself).
   * @param {number} depth     Current depth (root itself is 0).
   */
  function descend(dir, subpath, depth) {
    if (depth > maxDepth) return;

    /** @type {string[]} */
    let entries;
    try {
      entries = readdirSync(dir);
    } catch (err) {
      log.debug(`skip ${dir}: ${/** @type {Error} */ (err).message}`);
      return;
    }

    for (const name of entries) {
      // Skip hidden dirs (.git, .DS_Store, .venv, etc.) — the walker
      // is looking for user-owned repos, never platform garbage.
      if (name.startsWith(".")) continue;

      const childAbs = resolve(dir, name);
      // subpath uses POSIX-style separators for stable semantic ids;
      // absPath uses native separators (via `resolve`) for fs / git.
      const childSub = subpath ? `${subpath}/${name}` : name;

      /** @type {import("node:fs").Stats} */
      let stat;
      try {
        stat = statSync(childAbs);
      } catch (err) {
        log.debug(`skip ${childAbs}: ${/** @type {Error} */ (err).message}`);
        continue;
      }
      if (!stat.isDirectory()) continue;

      // This directory IS a git repo — record + stop descending.
      // Guard against a bare `.git` file (worktrees / submodules use
      // that shape); accept both file + directory.
      if (existsSync(resolve(childAbs, ".git"))) {
        repos.push({ subpath: childSub, absPath: childAbs });
        continue;
      }

      // Not a repo — recurse into the subgroup.
      descend(childAbs, childSub, depth + 1);
    }
  }

  descend(root, "", 1);
  repos.sort((a, b) => a.subpath.localeCompare(b.subpath));
  return repos;
}
