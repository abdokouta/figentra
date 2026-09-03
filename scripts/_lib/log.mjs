/**
 * @file log.mjs
 * @module scripts/_lib/log
 * @description Colored, timestamped logger for every script under `scripts/`.
 *
 *   Wraps `node:util.styleText` (Node 20+) so scripts never hardcode ANSI
 *   escapes. Five levels — `debug`, `info`, `warn`, `error`, `success`.
 *   Verbosity gate driven by `LOG_LEVEL` env var + optional runtime setter
 *   (`log.setLevel('debug')`).
 *
 *   Every log line ships with a level tag + monotonic HH:MM:SS timestamp
 *   so long-running scripts have a trace developers can search.
 *
 * ## Usage
 *
 * ```javascript
 * import { log } from "./_lib/log.mjs";
 *
 * log.info("starting job");
 * log.success("job complete");
 * log.warn("skipped 3 items");
 * log.error("job failed", err);
 * log.debug("intermediate value", { count: 42 });
 * log.setLevel("debug"); // reveal debug lines
 * ```
 *
 * ## Levels
 *
 *   debug   → grey    (hidden unless LOG_LEVEL=debug OR --verbose)
 *   info    → cyan
 *   success → green
 *   warn    → yellow
 *   error   → red     (always printed to stderr)
 *
 * ## Env
 *
 *   LOG_LEVEL — `debug|info|warn|error` (default: `info`).
 *   NO_COLOR  — set to any value → strip colors (respect industry convention).
 */
import { styleText } from "node:util";

const LEVELS = /** @type {const} */ (["debug", "info", "warn", "error", "success"]);
/** @typedef {(typeof LEVELS)[number]} LogLevel */

/** Numeric weight for filtering — lower = quieter. */
const WEIGHT = { debug: 0, info: 1, success: 1, warn: 2, error: 3 };

/** @type {LogLevel} */
let currentLevel = /** @type {LogLevel} */ (
  process.env.LOG_LEVEL && LEVELS.includes(/** @type {LogLevel} */ (process.env.LOG_LEVEL))
    ? process.env.LOG_LEVEL
    : "info"
);

const NO_COLOR = Boolean(process.env.NO_COLOR);

// Where non-diagnostic output (info / success / debug / section) lands.
// `log.setStdout(process.stderr)` redirects the whole informational
// surface off stdout — used by scripts that emit machine-readable JSON
// on stdout and want their operator-visible progress lines to stay on
// stderr (so `node script --dry-run | jq` pipes cleanly).
/** @type {NodeJS.WritableStream} */
let stdoutStream = process.stdout;

/**
 * Style text unless `NO_COLOR` is set — respects the industry
 * `no_color.org` convention so CI logs stay plain.
 *
 * @param {Parameters<typeof styleText>[0]} tag
 * @param {string} text
 * @returns {string}
 */
function paint(tag, text) {
  return NO_COLOR ? text : styleText(tag, text);
}

/** Returns a monotonic HH:MM:SS timestamp for the CURRENT wall clock. */
function ts() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Emit one log line — internal.
 *
 * @param {LogLevel} level
 * @param {string} tag       Pre-styled level tag (`"info "`, `"error"`, ...).
 * @param {Parameters<typeof styleText>[0]} color
 * @param {string} message
 * @param {unknown[]} extras
 */
function emit(level, tag, color, message, extras) {
  if (WEIGHT[level] < WEIGHT[currentLevel]) return;
  const line = `${paint(["dim"], ts())} ${paint(color, tag)} ${message}`;
  // Unix convention — diagnostics (warn/error) go to stderr; the
  // "successful output" of a script stays on stdout. This lets
  // scripts with a machine-readable `--json` mode pipe cleanly to
  // `jq` without gating individual log calls per mode.
  const stream = level === "error" || level === "warn" ? process.stderr : stdoutStream;
  stream.write(line + "\n");
  for (const extra of extras) {
    // Pretty-print objects; leave strings alone.
    const rendered =
      typeof extra === "string" ? extra : JSON.stringify(extra, replacerRedactSecrets, 2);
    stream.write(paint(["dim"], `    ${rendered.split("\n").join("\n    ")}\n`));
  }
}

/**
 * JSON.stringify replacer that redacts secret-looking values so logging
 * an entire config object doesn't accidentally leak a token.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {unknown}
 */
function replacerRedactSecrets(key, value) {
  if (typeof value !== "string") return value;
  const upper = key.toUpperCase();
  if (
    upper.includes("TOKEN") ||
    upper.includes("SECRET") ||
    upper.includes("PASSWORD") ||
    upper.includes("KEY") ||
    upper.includes("API_KEY") ||
    /^glpat-|^ghp_|^gho_|^ghs_/i.test(value)
  ) {
    // Keep the first + last 3 chars to aid debugging; redact the middle.
    if (value.length < 12) return "<redacted>";
    return `${value.slice(0, 4)}…${value.slice(-3)} <redacted>`;
  }
  return value;
}

/**
 * The logger façade — every script imports this.
 */
export const log = {
  /**
   * Change the runtime log level (also respects `LOG_LEVEL` env at start).
   *
   * @param {LogLevel} level
   */
  setLevel(level) {
    if (!LEVELS.includes(level)) throw new Error(`invalid log level: ${level}`);
    currentLevel = level;
  },
  /** Current runtime level. */
  get level() {
    return currentLevel;
  },
  /** @param {string} message @param {...unknown} extras */
  debug: (message, ...extras) => emit("debug", "debug", ["gray"], message, extras),
  /** @param {string} message @param {...unknown} extras */
  info: (message, ...extras) => emit("info", "info ", ["cyan"], message, extras),
  /** @param {string} message @param {...unknown} extras */
  success: (message, ...extras) => emit("success", "ok   ", ["green"], message, extras),
  /** @param {string} message @param {...unknown} extras */
  warn: (message, ...extras) => emit("warn", "warn ", ["yellow"], message, extras),
  /** @param {string} message @param {...unknown} extras */
  error: (message, ...extras) => emit("error", "error", ["red"], message, extras),
  /** Section divider for readable long output. */
  section: (title) =>
    stdoutStream.write(
      "\n" +
        paint(["bold", "cyan"], `── ${title} ${"─".repeat(Math.max(0, 74 - title.length))}`) +
        "\n",
    ),
  /**
   * Redirect the informational output stream. Callers pass
   * `process.stderr` when their script emits machine-readable output
   * on stdout (`--json`, JSON preview from `--dry-run`) — every
   * subsequent `log.info` / `log.success` / `log.debug` / `log.section`
   * lands on the redirected stream. `log.warn` + `log.error` still go
   * to `process.stderr` unconditionally (Unix diagnostic convention).
   *
   * @param {NodeJS.WritableStream} stream
   */
  setStdout(stream) {
    stdoutStream = stream;
  },
};
