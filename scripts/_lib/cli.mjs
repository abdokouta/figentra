/**
 * @file cli.mjs
 * @module scripts/_lib/cli
 * @description Minimal, typed CLI argument parser for the `scripts/` toolkit.
 *
 *   Wraps `node:util.parseArgs` with:
 *     - Named flags (--verbose, --dry-run)
 *     - Value flags (--root=/path OR --root /path)
 *     - Positional args
 *     - Auto-generated `--help` output
 *     - Consistent `--verbose` handling that promotes `log.setLevel('debug')`
 *
 *   The parser is DELIBERATELY simple. Scripts that need richer CLI
 *   (subcommands, interactive prompts) reach for `@clack/prompts` or
 *   Symfony Console via `tools/cli`. This module handles the common
 *   case: 5-10 flags, straightforward types.
 *
 * ## Usage
 *
 * ```javascript
 * import { parseArgs } from "./_lib/cli.mjs";
 * import { log } from "./_lib/log.mjs";
 *
 * const args = parseArgs({
 *   name: "dev-frontend",
 *   description: "Bootstrap local @stackra/* dev workspace",
 *   flags: {
 *     root:    { type: "string",  default: stackraFrontendRoot(),        help: "Dev workspace path (FIGENTRA_DEV_ROOT-aware)" },
 *     https:   { type: "boolean", default: false, help: "Clone over HTTPS instead of SSH" },
 *     verbose: { type: "boolean", default: false, help: "Enable debug logging" },
 *     dryRun:  { type: "boolean", default: false, help: "Print plan; make no changes" },
 *   },
 * });
 *
 * if (args.verbose) log.setLevel("debug");
 * log.info(`root: ${args.root}`);
 * ```
 *
 * ## Auto-help
 *
 *   Passing `--help` prints a usage block derived from the schema + exits 0.
 *   Passing `--version` prints the version + exits 0 (if `version` provided).
 */
import { parseArgs as nodeParseArgs } from "node:util";

/**
 * @typedef {"string" | "boolean"} FlagType
 */

/**
 * @typedef {object} FlagSpec
 * @property {FlagType}   type      "string" | "boolean"
 * @property {any}       [default]  Default value if the flag is absent.
 * @property {string}    [help]     One-line description for --help.
 * @property {string}    [short]    Optional short alias (e.g. "v" for "--verbose").
 */

/**
 * @typedef {object} Schema
 * @property {string} name         Short name of the script (used in help).
 * @property {string} description  One-line description for --help.
 * @property {Object.<string, FlagSpec>} flags
 * @property {string} [version]    Version string; enables --version.
 * @property {string} [positional] Description of positional args (for --help only).
 */

/**
 * Parse process.argv against a schema. Camel-case keys map to
 * kebab-case flag names (`dryRun` → `--dry-run`).
 *
 * @template {Schema} T
 * @param {T} schema
 * @returns {Object.<string, any>}
 */
export function parseArgs(schema) {
  // ── Build the node:util spec from our schema ────────────────────
  /** @type {import("node:util").ParseArgsConfig["options"]} */
  const nodeOptions = {};

  const kebabToKey = /** @type {Record<string, string>} */ ({});

  for (const [key, spec] of Object.entries(schema.flags)) {
    const kebab = camelToKebab(key);
    kebabToKey[kebab] = key;
    nodeOptions[kebab] = {
      type: spec.type,
      ...(spec.short ? { short: spec.short } : {}),
      ...(spec.default !== undefined ? { default: spec.default } : {}),
    };
  }

  // Always accept --help + --version so scripts never have to declare them.
  nodeOptions.help = { type: "boolean", short: "h", default: false };
  if (schema.version) {
    nodeOptions.version = { type: "boolean", default: false };
  }

  // ── Parse ────────────────────────────────────────────────────────
  let parsed;
  try {
    parsed = nodeParseArgs({
      args: process.argv.slice(2),
      options: nodeOptions,
      allowPositionals: true,
      strict: true,
    });
  } catch (err) {
    // node:util throws on unknown flags — surface a helpful hint.
    process.stderr.write(`argument error: ${/** @type {Error} */ (err).message}\n\n`);
    printHelp(schema);
    process.exit(2);
  }

  // ── Print help / version + exit if asked ──────────────────────────
  if (parsed.values.help) {
    printHelp(schema);
    process.exit(0);
  }
  if (schema.version && parsed.values.version) {
    process.stdout.write(`${schema.name} ${schema.version}\n`);
    process.exit(0);
  }

  // ── Remap kebab-keys back to camelCase for JS consumption ──────
  /** @type {Record<string, unknown>} */
  const result = {};
  for (const [kebab, key] of Object.entries(kebabToKey)) {
    result[key] = parsed.values[kebab];
  }
  result._positionals = parsed.positionals;
  return result;
}

/**
 * @param {Schema} schema
 */
function printHelp(schema) {
  const out = process.stdout;
  out.write(`\n  ${schema.name}\n`);
  out.write(`  ${schema.description}\n\n`);

  out.write(`  Usage: scripts/${schema.name}.mjs [options]`);
  if (schema.positional) out.write(` ${schema.positional}`);
  out.write("\n\n");

  out.write("  Options:\n");
  for (const [key, spec] of Object.entries(schema.flags)) {
    const flag = `--${camelToKebab(key)}` + (spec.short ? `, -${spec.short}` : "");
    const type = spec.type === "boolean" ? "" : ` <${spec.type}>`;
    const dflt =
      spec.default !== undefined && spec.default !== false
        ? `  (default: ${JSON.stringify(spec.default)})`
        : "";
    out.write(`    ${(flag + type).padEnd(30)} ${spec.help ?? ""}${dflt}\n`);
  }
  out.write(`    ${"--help, -h".padEnd(30)} Show this help.\n`);
  if (schema.version) out.write(`    ${"--version".padEnd(30)} Print version.\n`);

  out.write(`\n  Env:\n`);
  out.write(`    LOG_LEVEL=debug|info|warn|error\n`);
  out.write(`    NO_COLOR=1                       Strip ANSI colors.\n`);
  out.write("\n");
}

/**
 * `camelCase` → `kebab-case`.
 * @param {string} s
 */
function camelToKebab(s) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
