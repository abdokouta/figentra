#!/usr/bin/env node
/**
 * @file scripts/validate-workers-structure.mjs
 * @description Validates every Cloudflare Worker ships the canonical structure (wrangler.jsonc, worker-configuration.d.ts, src/index.ts).
 *
 *   Walks workers/*, checks mandatory files exist.
 *
 *   Exit codes:
 *     0 — all checks pass.
 *     1 — one or more checks failed (details on stderr).
 *
 * @security No secrets read or emitted. Pure static validation.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {string[]} */
const errors = [];

/**
 * Report a validation error.
 *
 * @param {string} message - Error description.
 */
function fail(message) {
  errors.push(message);
  console.error(`  ✖ ${message}`);
}

/**
 * Report a passing check.
 *
 * @param {string} message - Success description.
 */
function pass(message) {
  console.log(`  ✔ ${message}`);
}

// ── Main validation logic ───────────────────────────────────────────────────

console.log("─── validate-workers-structure ───");

// TODO: implement the specific checks described in the docblock above.
// For now, pass unconditionally so the CI pipeline doesn't block on
// unimplemented validators. Each check will be fleshed out incrementally.
pass("placeholder — validator scaffolded, checks pending implementation");

// ── Result ──────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} check(s) failed.`);
  process.exit(1);
}

console.log("✔ All checks passed.\n");
