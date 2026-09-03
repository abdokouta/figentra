/**
 * @file index.mjs
 * @module scripts/_lib
 * @description Barrel export for every module under `scripts/_lib/`.
 *   Scripts import the whole toolkit through this one path:
 *
 *   ```javascript
 *   import { log, Reporter, parseArgs, sh, shOk, httpJson,
 *            HttpError, pool, poolOk, GitlabClient } from
 *     "./_lib/index.mjs";
 *   ```
 *
 *   Secrets are NOT re-exported. Every `.mjs` script that needs a
 *   secret is invoked under `doppler run --scope . --
 *   ./scripts/remap-secrets.sh node scripts/foo.mjs` and reads
 *   canonical Layer 1 names directly off `process.env` per
 *   ADR-0085 §Rule 6. See `scripts/README.md` §"Secrets".
 *
 * ## Layered
 *
 *   log         — no deps.
 *   reporter    — depends on log.
 *   cli         — depends on log (indirectly via help output).
 *   shell       — depends on log.
 *   http        — depends on log.
 *   concurrency — no external deps.
 *   gitlab      — depends on http + log.
 *   fs-walk     — depends on log.
 *   paths       — no deps.
 *   env-naming  — no deps.
 */
export { log } from "./log.mjs";
export { Reporter } from "./reporter.mjs";
export { parseArgs } from "./cli.mjs";
export { sh, shOk } from "./shell.mjs";
export { httpFetch, httpJson, HttpError } from "./http.mjs";
export { pool, poolOk } from "./concurrency.mjs";
export { GitlabClient } from "./gitlab.mjs";
export { walkGitRepos } from "./fs-walk.mjs";
export { WORKSPACE_REPOS, reposByKind, reposByPaths } from "./repos.mjs";
