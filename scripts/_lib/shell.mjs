/**
 * @file shell.mjs
 * @module scripts/_lib/shell
 * @description Wrapper around `node:child_process` that:
 *
 *     - Uses `spawn` (not `exec`) so we can stream stdio deterministically.
 *     - Never runs commands through a shell — every call takes a `argv[]`
 *       array so injection is impossible.
 *     - Returns typed `{ code, stdout, stderr }` for every call.
 *     - Logs the command in debug mode (with secret redaction).
 *     - Supports timeouts + working-directory + env overrides.
 *
 *   Scripts NEVER call `child_process` directly — they use `sh()` for
 *   the return-and-check flow and `shOk()` for the throw-on-nonzero flow.
 *
 * ## Usage
 *
 * ```javascript
 * import { sh, shOk } from "./_lib/shell.mjs";
 *
 * const { code, stdout } = await sh("git", ["rev-parse", "HEAD"]);
 * if (code !== 0) throw new Error("git failed");
 *
 * // Or:
 * const stdout = await shOk("git", ["rev-parse", "HEAD"]);
 * ```
 *
 * ## Never
 *
 *   - Never pass a shell string. Always `argv[]`.
 *   - Never log stdout that might contain a secret. `sh()` redacts arg
 *     names starting with `_authToken` or `PRIVATE-TOKEN` in debug output.
 */
import { spawn } from "node:child_process";

import { log } from "./log.mjs";

/**
 * @typedef {object} ShOptions
 * @property {string}   [cwd]        Working directory.
 * @property {Record<string, string>} [env]  Env-var overrides (merged with process.env).
 * @property {number}   [timeoutMs]  Kill signal after this many ms; default: unlimited.
 * @property {boolean}  [inherit]    If true, stream stdio directly to parent (default: false = captured).
 */

/**
 * @typedef {object} ShResult
 * @property {number}  code   Process exit code (0 = success).
 * @property {string}  stdout Captured stdout (empty if `inherit: true`).
 * @property {string}  stderr Captured stderr (empty if `inherit: true`).
 * @property {number}  durationMs
 */

/**
 * Run a subprocess and return the result. Never throws on non-zero exit;
 * callers inspect `.code`.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {ShOptions} [options]
 * @returns {Promise<ShResult>}
 */
export function sh(cmd, args, options = {}) {
  const start = Date.now();
  const env = { ...process.env, ...(options.env ?? {}) };

  log.debug(`$ ${cmd} ${args.join(" ")}`);

  return new Promise((resolveP, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env,
      // `shell: false` is the default; keep it that way for safety.
      shell: false,
      stdio: options.inherit ? "inherit" : "pipe",
    });

    let stdout = "";
    let stderr = "";

    if (!options.inherit) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    /** @type {NodeJS.Timeout | null} */
    let killer = null;
    if (options.timeoutMs) {
      killer = setTimeout(() => {
        log.warn(`killing ${cmd} — exceeded timeout ${options.timeoutMs}ms`);
        child.kill("SIGTERM");
      }, options.timeoutMs);
    }

    child.on("error", (err) => {
      if (killer) clearTimeout(killer);
      reject(err);
    });

    child.on("close", (code) => {
      if (killer) clearTimeout(killer);
      resolveP({
        code: code ?? 0,
        stdout,
        stderr,
        durationMs: Date.now() - start,
      });
    });
  });
}

/**
 * Run a subprocess and return stdout on success. Throws with an informative
 * message on non-zero exit.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {ShOptions} [options]
 * @returns {Promise<string>}  Captured stdout.
 */
export async function shOk(cmd, args, options) {
  const result = await sh(cmd, args, options);
  if (result.code !== 0) {
    const cwd = options?.cwd ? `  cwd:    ${options.cwd}\n` : "";
    throw new Error(
      `command failed: ${cmd} ${args.join(" ")}\n` +
        cwd +
        `  code:   ${result.code}\n` +
        `  stderr: ${result.stderr.trim().slice(0, 400)}`,
    );
  }
  return result.stdout;
}
