#!/usr/bin/env node
/**
 * scripts/clean.mjs
 *
 * Full-tree "nuke every regenerable artifact" script. Invoked by:
 *
 *     pnpm clean         # do it
 *     pnpm clean:dry     # list what would be removed, delete nothing
 *
 * NOTE: predates the shared `scripts/_lib/` standard (see
 *   `scripts/README.md`).  New scripts import log/reporter/cli/... from
 *   `./_lib/index.mjs` — this one uses its own ad-hoc `console.log`
 *   surface.  Full retrofit tracked as follow-up; the behaviour here is
 *   stable + relied on by `pnpm clean` in CI.
 * @see scripts/_lib/index.mjs
 *
 * WHY THIS EXISTS
 * ---------------
 *
 * The Laravel + Composer stack layers cache dirs everywhere — vendor,
 * .phpstan-cache, .rector-cache, .phpunit.cache, .pest-cache, Laravel's
 * per-app bootstrap/storage caches, plus the Turbo + pnpm layer on top.
 * The per-workspace ``clean`` scripts (when present) only cover a
 * subset. This root script is the heavy hammer that walks the entire
 * repository once and removes every artifact any tool in the stack
 * regenerates on demand:
 *
 *   * Node / Turborepo — node_modules, .turbo, .cache, .next, .nuxt,
 *     .svelte-kit, .astro, .vite, .vitest-cache, .parcel-cache, .output,
 *     .rollup.cache, .webpack, .vercel, .nyc_output, dist, build,
 *     coverage, playwright-report, test-results, *.tsbuildinfo
 *   * Python           — .venv, venv, env, ENV, __pycache__,
 *                        .pytest_cache, .ruff_cache, .mypy_cache,
 *                        .pyright-cache, .tox, .nox, .eggs, *.egg-info,
 *                        .ipynb_checkpoints, htmlcov, .coverage,
 *                        coverage.xml, *.py[co], *$py.class
 *   * PHP              — vendor, .phpstan-cache, .rector-cache,
 *                        .phpunit.cache, .pest-cache,
 *                        .phpunit.result.cache, .php-cs-fixer.cache,
 *                        infection-log.txt, infection.log
 *   * Rust             — target (Cargo build cache)
 *   * JVM              — .gradle, out
 *   * IaC              — .terraform (providers), .lycheecache
 *   * OS               — .DS_Store, Thumbs.db
 *
 * After running this, a fresh setup is:
 *
 *     pnpm install     # reinstalls node_modules + auto-runs `uv sync`
 *
 * SAFETY
 * ------
 *
 * The script:
 *   * Refuses to descend into ``.git/`` so history is never touched.
 *   * Skips any directory that matches a reap target (``.turbo``
 *     inside ``node_modules`` still gets reaped because
 *     ``node_modules`` is reaped whole first — we never descend into
 *     it once matched).
 *   * Uses ``fs.rm({ recursive: true, force: true })`` which is
 *     idempotent and never asks for confirmation. Combine with
 *     ``--dry-run`` first when in doubt.
 *   * Never touches secrets (``.env``, ``.env.*``) or terraform state
 *     (``*.tfstate*``) — those are user data, not caches.
 *
 * Flags:
 *   ``--dry-run``  Only list what would be removed. Nothing is deleted.
 *   ``--verbose``  Print every path considered (even those skipped).
 *
 * Exit codes:
 *   0 — every reap succeeded (or dry-run finished).
 *   1 — one or more reaps failed. The script continues past failures
 *       so partial cleans still make progress; the non-zero exit
 *       surfaces the failure to CI or a Makefile.
 *
 * Related:
 *   * scripts/generate-workspace-shims.py — per-workspace clean shim.
 *   * .gitignore — the authoritative list of "transient" artifacts;
 *     the sets below MUST stay a subset (never reap tracked files).
 *   * package.json — wires this script into ``pnpm clean``.
 */

import { readdir, rm, stat } from "node:fs/promises";
import { resolve, join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Repository root. The script always operates from here regardless of the
// caller's cwd — running ``node scripts/clean.mjs`` from anywhere in the
// tree does the same thing.
// ---------------------------------------------------------------------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// CLI flags. Kept intentionally minimal — a clean script that grows
// options is a smell (each option is a new failure mode). Anyone
// wanting finer control can invoke ``rm -rf`` themselves.
// ---------------------------------------------------------------------------

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has("--dry-run") || ARGS.has("-n");
const VERBOSE = ARGS.has("--verbose") || ARGS.has("-v");

// ---------------------------------------------------------------------------
// Directory names to reap on sight. Matching is done by ``basename`` at
// ANY depth — every occurrence in the tree is removed. Once a directory
// matches, we do not descend into it (nothing inside matters, we're
// about to delete the whole thing).
//
// Keep this list a subset of what ``.gitignore`` marks as transient.
// If it isn't ignored, we don't own the right to delete it.
// ---------------------------------------------------------------------------

const REAP_DIRS = new Set([
  // --- Node / Turborepo ---------------------------------------------------
  "node_modules",
  ".turbo",
  ".cache",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".astro",
  ".vite",
  ".vitest-cache",
  ".parcel-cache",
  ".output",
  ".rollup.cache",
  ".webpack",
  ".vercel",
  ".nyc_output",

  // --- Build outputs (Node + Python + generic) ----------------------------
  //
  // ``dist`` and ``build`` are common enough to be safe here — no
  // workspace member in this monorepo uses either as a source folder
  // (verified via ``apps/*`` and ``packages/*`` listing on 2026-07-11
  // in the sibling academorix-ai monorepo; kept in step across the
  // three roots so ``pnpm clean`` behaves identically).
  "dist",
  "build",
  "coverage",
  "htmlcov",

  // --- E2E / test artifacts ----------------------------------------------
  "playwright-report",
  "test-results",

  // --- Python -------------------------------------------------------------
  ".venv",
  "venv",
  "env",
  "ENV",
  "__pycache__",
  ".pytest_cache",
  ".ruff_cache",
  ".mypy_cache",
  ".pyright-cache",
  ".tox",
  ".nox",
  ".eggs",
  ".ipynb_checkpoints",

  // --- PHP ---------------------------------------------------------------
  "vendor",
  ".phpstan-cache",
  ".rector-cache",
  ".phpunit.cache",
  ".pest-cache",

  // --- Rust --------------------------------------------------------------
  //
  // Cargo puts every crate's build output here. Not present in this
  // repo today but included for parity with the sibling monorepos.
  "target",

  // --- JVM / Gradle / Maven ----------------------------------------------
  ".gradle",
  "out",

  // --- IaC ---------------------------------------------------------------
  //
  // ``.terraform/`` holds downloaded providers/modules. ``terraform init``
  // repopulates it. We deliberately do NOT touch ``*.tfstate`` or
  // ``*.tfvars`` — those are user data.
  ".terraform",
]);

// ---------------------------------------------------------------------------
// File names to reap on sight. Same match-by-basename semantics as
// REAP_DIRS. Only files that are cheaply regenerable belong here.
// ---------------------------------------------------------------------------

const REAP_FILES = new Set([
  // --- Python coverage ----------------------------------------------------
  ".coverage",
  "coverage.xml",

  // --- PHP ---------------------------------------------------------------
  ".phpunit.result.cache",
  ".php-cs-fixer.cache",
  "infection-log.txt",
  "infection.log",

  // --- Docs link-check cache ---------------------------------------------
  ".lycheecache",

  // --- OS junk -----------------------------------------------------------
  ".DS_Store",
  "Thumbs.db",
]);

// ---------------------------------------------------------------------------
// Regex patterns for names that vary (extensions, suffixes). Applied
// after the exact-match sets fail. Kept small — glob-y matching invites
// accidents. Each pattern must anchor the whole basename.
// ---------------------------------------------------------------------------

const REAP_PATTERNS = [
  /^.*\.egg-info$/, // Python packaging metadata (dir or file)
  /^.*\.tsbuildinfo$/, // TypeScript incremental build info
  /^.*\.pyc$/, // Python bytecode
  /^.*\.pyo$/, // Optimized Python bytecode
  /^.*\$py\.class$/, // Jython class artifact (from .gitignore)
];

// ---------------------------------------------------------------------------
// Directories the walker must NEVER descend into. ``.git`` is the only
// truly load-bearing one — nuking anything under it corrupts history.
// The rest are matched as REAP_DIRS above, but we also list them here
// as a belt-and-braces guard in case someone edits the sets and misses
// the "don't descend once matched" rule.
// ---------------------------------------------------------------------------

const NEVER_DESCEND = new Set([".git", ...REAP_DIRS]);

// ---------------------------------------------------------------------------
// Book-keeping. Counters are printed at the end so a caller can tell
// at a glance whether the run actually found anything.
// ---------------------------------------------------------------------------

let removedCount = 0;
let failedCount = 0;
let bytesFreed = 0;

/**
 * Return true when the given basename matches any reap rule.
 *
 * @param {string} name  Bare filename or directory name (no path parts).
 * @param {boolean} isDir  True when the entry is a directory.
 * @returns {boolean}
 */
function shouldReap(name, isDir) {
  if (isDir && REAP_DIRS.has(name)) return true;
  if (!isDir && REAP_FILES.has(name)) return true;
  for (const pattern of REAP_PATTERNS) {
    if (pattern.test(name)) return true;
  }
  return false;
}

/**
 * Best-effort byte counter for a path. Failures don't block deletion —
 * this is purely to print a "freed N MB" summary. Directories are not
 * walked recursively (would double the IO for no functional gain).
 *
 * @param {string} path  Absolute path.
 * @returns {Promise<number>} Bytes, or 0 if the size can't be read.
 */
async function safeSize(path) {
  try {
    const s = await stat(path);
    return s.size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Remove one path with ``rm -rf`` semantics. Prints a line either way.
 *
 * @param {string} absPath  Absolute path to remove.
 * @param {string} label    Short tag for the log line ("dir" | "file").
 */
async function reap(absPath, label) {
  const rel = relative(REPO_ROOT, absPath) || ".";
  const size = await safeSize(absPath);

  if (DRY_RUN) {
    console.log(`  would remove ${label}: ${rel}`);
    removedCount += 1;
    bytesFreed += size;
    return;
  }

  try {
    await rm(absPath, { recursive: true, force: true });
    console.log(`  removed ${label}: ${rel}`);
    removedCount += 1;
    bytesFreed += size;
  } catch (err) {
    // Keep going — a partial clean is more useful than none. Log
    // enough context for the developer to fix the offender by hand.
    console.error(`  FAILED to remove ${rel}: ${err.message}`);
    failedCount += 1;
  }
}

/**
 * Walk ``dir`` breadth-first, reaping matches and descending into the
 * rest. Symlinks are NOT followed (avoids nuking things outside the
 * repo when someone links their global cache in).
 *
 * @param {string} dir  Absolute directory path.
 */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    // Directory disappeared mid-walk (e.g. we just reaped its parent).
    if (err.code === "ENOENT") return;
    console.error(`  cannot read ${relative(REPO_ROOT, dir) || "."}: ${err.message}`);
    return;
  }

  for (const entry of entries) {
    const name = entry.name;
    const abs = join(dir, name);

    // Symlinks are never followed. A ``ls -l`` on the repo occasionally
    // reveals someone's ``.venv -> /some/shared/path`` — we do not
    // want to recurse across that boundary.
    if (entry.isSymbolicLink()) {
      if (VERBOSE) console.log(`  skip symlink: ${relative(REPO_ROOT, abs)}`);
      continue;
    }

    const isDir = entry.isDirectory();

    if (shouldReap(name, isDir)) {
      await reap(abs, isDir ? "dir " : "file");
      continue;
    }

    if (isDir) {
      if (NEVER_DESCEND.has(name)) {
        // Includes ``.git`` and every REAP_DIRS entry as a safety net.
        if (VERBOSE) console.log(`  skip: ${relative(REPO_ROOT, abs)}`);
        continue;
      }
      await walk(abs);
    }
  }
}

/**
 * Format a byte count as a human-readable string (SI units, one decimal).
 *
 * @param {number} bytes
 * @returns {string}
 */
function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

// ---------------------------------------------------------------------------
// Entry point. Everything above is pure functions; the "do it" happens
// here so the module is trivially unit-testable if we ever want to.
// ---------------------------------------------------------------------------

console.log(
  `[clean] ${DRY_RUN ? "DRY RUN — nothing will be removed. " : ""}` + `Walking ${REPO_ROOT} ...`,
);

await walk(REPO_ROOT);

const verb = DRY_RUN ? "would remove" : "removed";
console.log(
  `\n[clean] ${verb} ${removedCount} path(s) (${humanBytes(bytesFreed)} of tracked size).`,
);
if (failedCount > 0) {
  console.error(`[clean] ${failedCount} path(s) FAILED to remove — see log above.`);
  process.exit(1);
}
if (!DRY_RUN && removedCount > 0) {
  console.log("[clean] Next: run `pnpm install` to reinstall dependencies.");
}
