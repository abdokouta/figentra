/**
 * @file infrastructure/scripts/_lib/module-registry.mjs
 * @description Module-registry loader and resolver for the Figentra
 *   infrastructure capability modules system.
 *
 *   Reads every `module.yaml` under `infrastructure/modules/` into a keyed
 *   registry, validates each against the module schema, and exposes helpers
 *   for resolving a deployable's `modules[]` entries against the registry.
 *
 *   Consumed by:
 *   - `collect-cloud-yaml.mjs` — validates deployable modules at catalog time.
 *   - `validate-modules.mjs`  — standalone registry + deployable validation.
 *   - `generate-compose.mjs`  — resolves compose fragments per deployable.
 *
 * @security No secrets are read or emitted. Module manifests are declarative
 *   contracts; secret values live in Doppler at runtime.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

/** Repository root. */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Infrastructure modules registry folder. */
const MODULES_DIR = join(REPO_ROOT, "infrastructure", "modules");

/** Module manifest filename — every module folder must contain this. */
const MODULE_MANIFEST = "module.yaml";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read + parse a YAML document. Returns `null` when the file doesn't exist.
 *
 * @param {string} path - Absolute path to the YAML file.
 * @returns {object | null} Parsed YAML document.
 */
function readYaml(path) {
  if (!existsSync(path)) return null;
  return parseYaml(readFileSync(path, "utf8"));
}

/**
 * Tests whether `version` satisfies the semver range `range`.
 *
 * Supports `^MAJOR.MINOR.PATCH` (caret — same major), `~MAJOR.MINOR.PATCH`
 * (tilde — same major.minor), and exact `MAJOR.MINOR.PATCH`. Does NOT pull
 * in the full `semver` npm package — the module registry uses a restricted
 * subset of semver ranges that a minimal parser covers.
 *
 * @param {string} version - Exact semver version (e.g. "1.2.3").
 * @param {string} range   - Semver range constraint (e.g. "^1.0.0").
 * @returns {boolean} True when the version satisfies the range.
 */
export function satisfiesSemver(version, range) {
  const [vMajor, vMinor, vPatch] = version.split(".").map(Number);

  // Exact match.
  if (/^\d+\.\d+\.\d+$/.test(range)) {
    return version === range;
  }

  // Caret range — same major, greater-or-equal minor.patch.
  const caretMatch = range.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
  if (caretMatch) {
    const [, rMajor, rMinor, rPatch] = caretMatch.map(Number);
    if (vMajor !== rMajor) return false;
    if (vMinor > rMinor) return true;
    if (vMinor === rMinor && vPatch >= rPatch) return true;
    return false;
  }

  // Tilde range — same major.minor, greater-or-equal patch.
  const tildeMatch = range.match(/^~(\d+)\.(\d+)\.(\d+)$/);
  if (tildeMatch) {
    const [, rMajor, rMinor, rPatch] = tildeMatch.map(Number);
    return vMajor === rMajor && vMinor === rMinor && vPatch >= rPatch;
  }

  // Fallback — unsupported range shape. Warn but don't block.
  console.warn(`⚠ module-registry: unsupported semver range "${range}"; treating as satisfied.`);
  return true;
}

// ---------------------------------------------------------------------------
// Registry loader
// ---------------------------------------------------------------------------

/**
 * Load every module in the registry into a `Map<string, ModuleManifest>`.
 *
 * Validates that every module folder contains a `module.yaml` with at least
 * a `name` field matching its folder name. Callers may apply additional
 * schema validation via the returned map.
 *
 * @returns {{ registry: Map<string, object>, errors: string[] }}
 *   `registry` — keyed by module name; `errors` — per-module load errors.
 */
export function loadRegistry() {
  /** @type {Map<string, object>} */
  const registry = new Map();
  /** @type {string[]} */
  const errors = [];

  if (!existsSync(MODULES_DIR)) {
    errors.push(`modules directory does not exist: ${MODULES_DIR}`);
    return { registry, errors };
  }

  // Walk every child directory that is NOT `schema/`.
  const entries = readdirSync(MODULES_DIR)
    .filter((name) => name !== "schema" && name !== "README.md" && name !== ".DS_Store")
    .filter((name) => statSync(join(MODULES_DIR, name)).isDirectory())
    .sort();

  for (const folderName of entries) {
    const manifestPath = join(MODULES_DIR, folderName, MODULE_MANIFEST);
    const manifest = readYaml(manifestPath);

    if (!manifest) {
      errors.push(`${folderName}: missing ${MODULE_MANIFEST}`);
      continue;
    }

    // Name must match folder.
    if (manifest.name !== folderName) {
      errors.push(`${folderName}: module.yaml name "${manifest.name}" does not match folder name`);
      continue;
    }

    // Mandatory fields (belt-and-suspenders — schema validation covers this
    // too, but catching it here gives a friendlier error path).
    if (!manifest.version) {
      errors.push(`${folderName}: missing version`);
      continue;
    }
    if (!manifest.kind) {
      errors.push(`${folderName}: missing kind`);
      continue;
    }

    registry.set(folderName, manifest);
  }

  return { registry, errors };
}

// ---------------------------------------------------------------------------
// Deployable resolver
// ---------------------------------------------------------------------------

/**
 * Resolve and validate a deployable's `modules[]` against the loaded
 * registry. Returns an array of resolved module tuples (each containing
 * the registry manifest + the deployable's config) and an array of
 * validation errors.
 *
 * @param {object[]} modulesArray - The deployable's `modules` array from
 *   its `cloud.yaml`.
 * @param {Map<string, object>} registry - The loaded module registry.
 * @param {string} deployableSlug - Slug for error attribution.
 * @returns {{ resolved: object[], errors: string[] }}
 */
export function resolveModules(modulesArray, registry, deployableSlug) {
  /** @type {object[]} */
  const resolved = [];
  /** @type {string[]} */
  const errors = [];

  if (!Array.isArray(modulesArray)) {
    errors.push(`${deployableSlug}: modules must be an array`);
    return { resolved, errors };
  }

  for (const entry of modulesArray) {
    // --- Validate structure ------------------------------------------------
    if (!entry.use || typeof entry.use !== "string") {
      errors.push(`${deployableSlug}: module entry missing "use" field`);
      continue;
    }
    if (!entry.version || typeof entry.version !== "string") {
      errors.push(`${deployableSlug}: module "${entry.use}" missing "version" field`);
      continue;
    }

    // --- Resolve against registry ------------------------------------------
    const manifest = registry.get(entry.use);
    if (!manifest) {
      errors.push(`${deployableSlug}: module "${entry.use}" not found in registry`);
      continue;
    }

    // --- Semver check ------------------------------------------------------
    if (!satisfiesSemver(manifest.version, entry.version)) {
      errors.push(
        `${deployableSlug}: module "${entry.use}" version ${manifest.version} ` +
          `does not satisfy range "${entry.version}"`
      );
      continue;
    }

    // --- Deprecation warning -----------------------------------------------
    if (manifest.maturity === "deprecated") {
      console.warn(`⚠ ${deployableSlug}: module "${entry.use}" is deprecated — plan migration.`);
    }

    resolved.push({
      use: entry.use,
      version: entry.version,
      config: entry.config ?? {},
      manifest,
    });
  }

  // --- Cross-module dependency validation ----------------------------------
  // Every `consumes` token across all resolved modules must be satisfied by
  // a `provides` token from another resolved module in the same deployable.
  const allProvides = new Set(resolved.flatMap((r) => r.manifest.provides ?? []));
  for (const r of resolved) {
    for (const token of r.manifest.consumes ?? []) {
      if (!allProvides.has(token)) {
        errors.push(
          `${deployableSlug}: module "${r.use}" consumes "${token}" but no ` +
            `other module in this deployable provides it`
        );
      }
    }
  }

  return { resolved, errors };
}

// ---------------------------------------------------------------------------
// Legacy capabilities → modules[] compat shim
// ---------------------------------------------------------------------------

/**
 * Converts the legacy `capabilities: { needs_X: true }` block into an
 * ephemeral `modules[]` array so the rest of the pipeline stays uniform.
 *
 * Every mapped entry carries `_deprecated: true` so downstream code can
 * emit warnings and the migration gate can track progress.
 *
 * @param {object} capabilities - The deployable's `capabilities` block.
 * @param {string} deployableSlug - Slug for warning attribution.
 * @returns {object[]} Ephemeral modules array.
 */
export function capabilitiesToModules(capabilities, deployableSlug) {
  if (!capabilities || typeof capabilities !== "object") return [];

  /**
   * Maps legacy boolean flag names to module identifiers. Every entry
   * in this map is a 1:1 replacement — the module's default config is
   * used (no per-deployable config was possible in the boolean model).
   */
  const FLAG_TO_MODULE = {
    needs_d1: "cloudflare-d1",
    needs_kv: "cloudflare-kv",
    needs_queue: "cloudflare-queue",
    needs_r2: "cloudflare-r2",
    needs_durable_object: "cloudflare-durable-object",
    needs_hyperdrive: "cloudflare-hyperdrive",
    needs_supabase: "supabase-postgres",
    needs_firebase: "firebase-fcm",
    needs_nats: "nats-jetstream",
    needs_redis: "redis-cache",
  };

  /** @type {object[]} */
  const modules = [];

  for (const [flag, moduleName] of Object.entries(FLAG_TO_MODULE)) {
    if (capabilities[flag] === true) {
      console.warn(
        `⚠ ${deployableSlug}: capabilities.${flag} is deprecated — ` +
          `migrate to modules: [{ use: "${moduleName}", version: "^1.0.0" }]`
      );
      modules.push({
        use: moduleName,
        version: "^1.0.0",
        config: {},
        _deprecated: true,
      });
    }
  }

  return modules;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { MODULES_DIR, REPO_ROOT };
