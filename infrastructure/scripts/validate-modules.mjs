#!/usr/bin/env node
/**
 * @file infrastructure/scripts/validate-modules.mjs
 * @description Validates the infrastructure capability-module registry and
 *   every deployable's `modules[]` array against the registry.
 *
 *   Two validation passes run in sequence:
 *
 *   1. **Registry pass** — every `infrastructure/modules/<name>/module.yaml`
 *      is loaded + checked for mandatory fields, naming conventions, folder
 *      parity, and runtime-target file existence.
 *
 *   2. **Deployable pass** — every `cloud.yaml` (from the root manifest's
 *      `paths:` set) that declares `modules[]` is resolved against the
 *      registry. Semver constraints, config-schema compliance, and
 *      cross-module `consumes`/`provides` dependencies are enforced.
 *
 *   Exit codes:
 *     0 — all checks pass.
 *     1 — one or more validation errors (printed to stderr).
 *
 * @security No secrets are read or emitted. This is a pure static validator.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { loadRegistry, resolveModules, capabilitiesToModules, MODULES_DIR, REPO_ROOT } from "./_lib/module-registry.mjs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Allowed categories — must match module.v1.json's enum. */
const VALID_CATEGORIES = new Set([
  "messaging", "realtime", "storage", "search", "third-party",
  "background", "ai", "observability", "networking", "auth", "cloudflare",
]);

/** Allowed maturity levels — must match module.v1.json's enum. */
const VALID_MATURITIES = new Set([
  "planned", "alpha", "beta", "stable", "deprecated",
]);

/** Allowed runtime-target keys. */
const VALID_TARGETS = new Set(["terraform", "docker", "wrangler"]);

// ---------------------------------------------------------------------------
// Registry validation
// ---------------------------------------------------------------------------

/**
 * Deep-validates every module in the registry beyond what loadRegistry()
 * already checks (naming + existence). Verifies category, maturity,
 * runtime-target file existence, provides/consumes shape, and env_vars.
 *
 * @param {Map<string, object>} registry - The loaded registry.
 * @returns {string[]} Validation errors.
 */
function validateRegistryDeep(registry) {
  /** @type {string[]} */
  const errors = [];

  for (const [name, manifest] of registry) {
    const prefix = `module "${name}"`;
    const moduleDir = join(MODULES_DIR, name);

    // Category.
    if (!VALID_CATEGORIES.has(manifest.category)) {
      errors.push(`${prefix}: invalid category "${manifest.category}"`);
    }

    // Maturity.
    if (!VALID_MATURITIES.has(manifest.maturity)) {
      errors.push(`${prefix}: invalid maturity "${manifest.maturity}"`);
    }

    // Kind.
    if (manifest.kind !== "infrastructure-module") {
      errors.push(`${prefix}: kind must be "infrastructure-module", got "${manifest.kind}"`);
    }

    // Description minimum length.
    if (!manifest.description || manifest.description.length < 20) {
      errors.push(`${prefix}: description must be at least 20 characters`);
    }

    // Runtime targets — keys must be the valid set; file must exist when
    // the value is a string (non-null).
    if (manifest.runtime_targets && typeof manifest.runtime_targets === "object") {
      for (const [target, filePath] of Object.entries(manifest.runtime_targets)) {
        if (!VALID_TARGETS.has(target)) {
          errors.push(`${prefix}: unknown runtime_target "${target}"`);
        }
        if (typeof filePath === "string") {
          const absPath = join(moduleDir, filePath);
          if (!existsSync(absPath)) {
            errors.push(`${prefix}: runtime_target.${target} references "${filePath}" which does not exist`);
          }
        }
      }
    } else {
      errors.push(`${prefix}: missing or invalid runtime_targets`);
    }

    // Provides — must be an array of strings.
    if (!Array.isArray(manifest.provides)) {
      errors.push(`${prefix}: provides must be an array`);
    }

    // Schema — must be an object.
    if (!manifest.schema || typeof manifest.schema !== "object") {
      errors.push(`${prefix}: schema must be a JSON Schema object`);
    }

    // Env vars — must be an array.
    if (!Array.isArray(manifest.env_vars)) {
      errors.push(`${prefix}: env_vars must be an array`);
    } else {
      for (const envVar of manifest.env_vars) {
        if (!envVar.name) errors.push(`${prefix}: env_var missing name`);
        if (!envVar.description) errors.push(`${prefix}: env_var "${envVar.name}" missing description`);
        if (!envVar.source) errors.push(`${prefix}: env_var "${envVar.name}" missing source`);
      }
    }

    // README — must exist alongside module.yaml.
    if (!existsSync(join(moduleDir, "README.md"))) {
      errors.push(`${prefix}: missing README.md`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Deployable validation
// ---------------------------------------------------------------------------

/**
 * Walks every enrolled deployable and validates its `modules[]` block
 * against the loaded registry.
 *
 * @param {Map<string, object>} registry - The loaded module registry.
 * @returns {string[]} Validation errors.
 */
function validateDeployables(registry) {
  /** @type {string[]} */
  const errors = [];

  // Read the root manifest to discover enrolled paths.
  const rootManifestPath = join(REPO_ROOT, "cloud.yaml");
  if (!existsSync(rootManifestPath)) {
    errors.push("root cloud.yaml not found — cannot validate deployable modules");
    return errors;
  }

  const root = parseYaml(readFileSync(rootManifestPath, "utf8"));
  const pathPatterns = root?.paths ?? [];

  // Resolve every enrolled local path.
  for (const pattern of pathPatterns) {
    const normalized = pattern.replace(/^\.\//, "").replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);

    // Handle simple `<dir>/*` glob.
    if (segments.length === 2 && segments[1] === "*") {
      const parentDir = join(REPO_ROOT, segments[0]);
      if (!existsSync(parentDir)) continue;
      for (const entry of readdirSync(parentDir).sort()) {
        const candidatePath = join(parentDir, entry);
        if (!statSync(candidatePath).isDirectory()) continue;
        validateOneDeployable(join(candidatePath, "cloud.yaml"), registry, errors);
      }
    } else {
      // Literal path.
      validateOneDeployable(join(REPO_ROOT, normalized, "cloud.yaml"), registry, errors);
    }
  }

  return errors;
}

/**
 * Validates a single deployable's `modules[]` + legacy `capabilities:`.
 *
 * @param {string} manifestPath - Absolute path to the deployable's cloud.yaml.
 * @param {Map<string, object>} registry - The loaded module registry.
 * @param {string[]} errors - Mutable error accumulator.
 */
function validateOneDeployable(manifestPath, registry, errors) {
  if (!existsSync(manifestPath)) return; // Non-enrolled directory.

  const manifest = parseYaml(readFileSync(manifestPath, "utf8"));
  if (!manifest || !manifest.slug) return; // Unparseable or non-deployable.

  const slug = manifest.slug;

  // Validate modules[] if present.
  if (Array.isArray(manifest.modules) && manifest.modules.length > 0) {
    const { errors: resolveErrors } = resolveModules(manifest.modules, registry, slug);
    errors.push(...resolveErrors);
  }

  // Warn (not error) on legacy capabilities block.
  if (manifest.capabilities && typeof manifest.capabilities === "object") {
    const hasAnyTrueFlag = Object.values(manifest.capabilities).some((v) => v === true);
    if (hasAnyTrueFlag) {
      // Don't fail — but emit a warning that the compat shim triggered.
      console.warn(`⚠ ${slug}: still using legacy capabilities: {} block — migrate to modules: []`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("─── Module registry validation ───────────────────────────────");

// Pass 1 — registry.
const { registry, errors: loadErrors } = loadRegistry();
const deepErrors = validateRegistryDeep(registry);
const registryErrors = [...loadErrors, ...deepErrors];

if (registryErrors.length > 0) {
  console.error(`\n✖ Registry validation failed (${registryErrors.length} error(s)):`);
  for (const error of registryErrors) console.error(`  - ${error}`);
} else {
  console.log(`✔ Registry: ${registry.size} module(s) validated.`);
}

// Pass 2 — deployables.
const deployableErrors = validateDeployables(registry);

if (deployableErrors.length > 0) {
  console.error(`\n✖ Deployable validation failed (${deployableErrors.length} error(s)):`);
  for (const error of deployableErrors) console.error(`  - ${error}`);
} else {
  console.log("✔ Deployables: all modules[] entries resolve against registry.");
}

// Exit.
const totalErrors = registryErrors.length + deployableErrors.length;
if (totalErrors > 0) {
  console.error(`\n✖ ${totalErrors} total error(s). Fix before commit.`);
  process.exit(1);
}

console.log("\n✔ All module checks passed.");
