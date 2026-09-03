/**
 * @file reporter.mjs
 * @module scripts/_lib/reporter
 * @description Task-outcome accumulator + summary printer.
 *
 *   Every script that operates on N items (repos, files, packages, ...)
 *   feeds each outcome to a `Reporter`. At the end, `report.print()`
 *   renders:
 *
 *     - Per-outcome table (pass / warn / fail / skip counts).
 *     - Wall-clock duration.
 *     - Failures listed inline for triage.
 *
 *   The reporter's exit signal (`report.exitCode`) is 0 on success,
 *   1 if any failure occurred. Scripts call `process.exit(report.exitCode)`
 *   at the very end.
 *
 * ## Usage
 *
 * ```javascript
 * import { Reporter } from "./_lib/reporter.mjs";
 *
 * const report = new Reporter("dev-frontend");
 * for (const repo of repos) {
 *   try {
 *     await work(repo);
 *     report.pass(repo);
 *   } catch (err) {
 *     report.fail(repo, err);
 *   }
 * }
 * report.print();
 * process.exit(report.exitCode);
 * ```
 *
 * ## Outcomes
 *
 *   pass  — worked correctly.
 *   warn  — worked but with a caveat (e.g. non-fatal skipped step).
 *   fail  — errored; captures the message for post-run summary.
 *   skip  — intentionally not run (rules-out, filter, etc.).
 */
import { styleText } from "node:util";

import { log } from "./log.mjs";

const NO_COLOR = Boolean(process.env.NO_COLOR);

/**
 * @param {Parameters<typeof styleText>[0]} tag
 * @param {string} text
 */
function paint(tag, text) {
  return NO_COLOR ? text : styleText(tag, text);
}

/**
 * @typedef {"pass" | "warn" | "fail" | "skip"} Outcome
 */

/**
 * @typedef {object} Entry
 * @property {string}  name     Human-readable subject of the outcome.
 * @property {Outcome} outcome
 * @property {string?} detail   Failure/warning detail; undefined for pass/skip.
 * @property {number}  duration Wall-clock ms this entry took.
 */

/**
 * Accumulates task outcomes across a script's run + renders a final summary.
 */
export class Reporter {
  /** @param {string} name  Short label for the script (used in the header). */
  constructor(name) {
    /** @type {string} */
    this.name = name;
    /** @type {Entry[]} */
    this.entries = [];
    /** @type {number} */
    this.startedAt = Date.now();
    /** @type {WeakMap<object, number>} */
    this._timers = new WeakMap();
  }

  /**
   * Start a per-entry timer (call `end(handle)` to record elapsed).
   * @returns {{ start: number }} handle to pass to `end()`.
   */
  begin() {
    return { start: Date.now() };
  }

  /**
   * Record a pass outcome.
   * @param {string} name
   * @param {{ start: number }?} [handle]  Timer handle from `.begin()`.
   */
  pass(name, handle) {
    this.entries.push({
      name,
      outcome: "pass",
      detail: null,
      duration: handle ? Date.now() - handle.start : 0,
    });
  }

  /**
   * Record a warning outcome (non-fatal, still counts as success).
   * @param {string} name
   * @param {string} detail
   * @param {{ start: number }?} [handle]
   */
  warn(name, detail, handle) {
    this.entries.push({
      name,
      outcome: "warn",
      detail,
      duration: handle ? Date.now() - handle.start : 0,
    });
  }

  /**
   * Record a failure outcome. `error` is stringified (its `.message` or
   * full `String(error)` otherwise).
   *
   * @param {string} name
   * @param {unknown} error
   * @param {{ start: number }?} [handle]
   */
  fail(name, error, handle) {
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    this.entries.push({
      name,
      outcome: "fail",
      detail,
      duration: handle ? Date.now() - handle.start : 0,
    });
  }

  /**
   * Record an intentional skip.
   * @param {string} name
   * @param {string} reason
   */
  skip(name, reason) {
    this.entries.push({ name, outcome: "skip", detail: reason, duration: 0 });
  }

  /** Count of a specific outcome. */
  count(outcome) {
    return this.entries.filter((e) => e.outcome === outcome).length;
  }

  /** Whether any entry has outcome `fail`. */
  get hasFailures() {
    return this.count("fail") > 0;
  }

  /** Suggested process exit code (0 if clean, 1 if any failure). */
  get exitCode() {
    return this.hasFailures ? 1 : 0;
  }

  /**
   * Print the summary to stdout. Called once at the very end of a script.
   */
  print() {
    const pass = this.count("pass");
    const warn = this.count("warn");
    const fail = this.count("fail");
    const skip = this.count("skip");
    const total = this.entries.length;
    const elapsed = ((Date.now() - this.startedAt) / 1000).toFixed(1);

    process.stdout.write("\n");
    process.stdout.write(
      paint(["bold"], `── ${this.name} — summary `) +
        paint(["dim"], "─".repeat(Math.max(0, 74 - this.name.length))) +
        "\n",
    );

    // The counts row.
    const parts = [
      paint(["green"], `${pass} pass`),
      paint(["yellow"], `${warn} warn`),
      paint(["red"], `${fail} fail`),
      paint(["dim"], `${skip} skip`),
      paint(["dim"], `— ${total} total`),
      paint(["dim"], `${elapsed}s`),
    ];
    process.stdout.write("  " + parts.join("  ") + "\n");

    // Any failures — enumerate for triage.
    if (fail > 0) {
      process.stdout.write("\n" + paint(["red", "bold"], "Failures:") + "\n");
      for (const entry of this.entries) {
        if (entry.outcome === "fail") {
          process.stdout.write(
            `  ${paint(["red"], "✗")} ${entry.name}\n    ${paint(["dim"], entry.detail ?? "")}\n`,
          );
        }
      }
    }

    // Warnings — enumerate too, they still deserve visibility.
    if (warn > 0) {
      process.stdout.write("\n" + paint(["yellow", "bold"], "Warnings:") + "\n");
      for (const entry of this.entries) {
        if (entry.outcome === "warn") {
          process.stdout.write(
            `  ${paint(["yellow"], "!")} ${entry.name}\n    ${paint(["dim"], entry.detail ?? "")}\n`,
          );
        }
      }
    }
  }

  /**
   * Serialize the run to a JSON structure — useful for CI + audit trails.
   *
   * @returns {{
   *   name: string,
   *   startedAt: string,
   *   durationMs: number,
   *   totals: { pass: number, warn: number, fail: number, skip: number, total: number },
   *   entries: Entry[],
   * }}
   */
  toJSON() {
    return {
      name: this.name,
      startedAt: new Date(this.startedAt).toISOString(),
      durationMs: Date.now() - this.startedAt,
      totals: {
        pass: this.count("pass"),
        warn: this.count("warn"),
        fail: this.count("fail"),
        skip: this.count("skip"),
        total: this.entries.length,
      },
      entries: this.entries,
    };
  }
}
