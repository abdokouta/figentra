#!/usr/bin/env node
/**
 * @file scripts/validate-standards.mjs
 * @description Workspace-wide standards validation orchestrator.
 *
 *   Runs every structural check the workspace enforces: package catalogs,
 *   export maps, dependency policy, local package manifests, docblocks,
 *   worker structure, and messaging contracts.
 *
 *   Delegates to individual check scripts — this is the top-level aggregator
 *   wired as `pnpm run standards:check`.
 *
 * @security No secrets read or emitted.
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Checks to run in sequence. Each is a script path relative to repo root.
 * Order matters — foundational checks first, then per-package, then domain.
 */
const CHECKS = [
  "scripts/check-toolchain.mjs",
  "scripts/check-yaml.mjs",
  "scripts/check-package-catalogs.mjs",
  "scripts/check-export-maps.mjs",
  "scripts/check-dependency-policy.mjs",
  "scripts/check-local-packages.mjs",
  "scripts/check-docblocks.mjs",
];

let failed = 0;

for (const script of CHECKS) {
  const path = resolve(ROOT, script);
  if (!existsSync(path)) {
    console.warn(`⚠ skipping ${script} (not found)`);
    continue;
  }
  try {
    execFileSync("node", [path], { stdio: "inherit", cwd: ROOT });
    console.log(`✔ ${script}`);
  } catch {
    console.error(`✖ ${script} failed`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n✖ ${failed} standard(s) failed.`);
  process.exit(1);
}

console.log("\n✔ All workspace standards passed.");
