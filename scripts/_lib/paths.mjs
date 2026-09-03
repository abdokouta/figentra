/**
 * @file scripts/_lib/paths.mjs
 * @module scripts/_lib/paths
 * @description Canonical dev-workspace path helpers. Every dev-*.mjs
 *   script that walks operator-side split-repo clones sources its
 *   root paths from THIS module rather than hand-rolling
 *   `resolve(homedir(), 'dev', ...)` — the operator overrides all
 *   nine roots at once by exporting `FIGENTRA_DEV_ROOT` in their
 *   shell rc file, no per-script flag needed.
 *
 *   The env var is a WORKSTATION default: every dev-*.mjs script
 *   still honours its own `--root <path>` CLI flag for per-invocation
 *   overrides. The precedence chain is:
 *
 *     1. `--root <path>` CLI flag (per-invocation override)
 *     2. `FIGENTRA_DEV_ROOT` env var (workstation default)
 *     3. `~/dev` (built-in default when neither is set)
 *
 *   ## Validation semantics
 *
 *   `devRoot()` validates ONLY when `FIGENTRA_DEV_ROOT` is EXPLICITLY
 *   set. If the operator points it at a non-existent path OR at a
 *   non-directory (e.g. a stray file), we throw with a helpful
 *   message pointing at the fix. If the env var is unset AND `~/dev`
 *   doesn't exist yet (fresh laptop, first boot before any clone),
 *   we return the resolved path silently — that's expected state,
 *   not an error. Individual dev-*.mjs scripts already handle "no
 *   clones to walk" gracefully via their `walkGitRepos` helper.
 *
 *   ## Why `FIGENTRA_DEV_ROOT` (not `STACKRA_DEV_ROOT`)
 *
 *   The dev-workspace root is an operator/laptop concern — it holds
 *   every brand's split-repo clones side by side (`~/dev/stackra/*`,
 *   `~/dev/figentra-inc/backend/*`, `~/dev/academorix/*`), so it's
 *   not framework-specific. Precedent in the workspace's env-var
 *   naming: `FIGENTRA_LARAVEL_CLOUD_TOKEN` (operator concern) is
 *   `FIGENTRA_*`; `STACKRA_COMPOSER_DEPLOY_TOKEN` (framework tooling)
 *   is `STACKRA_*`. Dev-workspace root fits the operator lane.
 *
 *   ## The layout below `devRoot()`
 *
 *   The sub-root helpers mirror the four canonical composer vendor
 *   scopes on disk:
 *
 *     <devRoot>/
 *     ├── stackra/
 *     │   ├── frontend/   — @stackra/* npm packages (stackraFrontendRoot)
 *     │   └── backend/    — stackra/* composer packages (stackraBackendRoot)
 *     ├── figentra-inc/
 *     │   └── backend/    — figentra/* SHARED services (sharedServicesRoot)
 *     └── academorix/
 *         └── backend/    — academorix/* per-App services (academorixBackendRoot)
 *
 *   Adding a new vendor scope (e.g. a future third-party product
 *   built on Stackra) means adding one more helper here — every
 *   dev-*.mjs script inherits the new default automatically.
 */

import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * The env-var name every dev-*.mjs script reads. Exported for
 * consumers that want to reference the name in their own
 * error messages / help output rather than hard-code the string.
 */
export const DEV_ROOT_ENV_VAR = "FIGENTRA_DEV_ROOT";

/**
 * Resolves the dev-workspace root. Reads `FIGENTRA_DEV_ROOT` from
 * the environment; falls back to `~/dev` when unset.
 *
 * Throws with a helpful message ONLY when `FIGENTRA_DEV_ROOT` is
 * explicitly set to a non-directory path — an operator
 * misconfiguration deserves an immediate readable error. An unset
 * env var with a missing default path is treated as "first-time
 * state" and returns silently; the caller's own repo walker will
 * report "no clones to walk" naturally.
 *
 * @returns {string} absolute path to the dev-workspace root
 * @throws {Error} when FIGENTRA_DEV_ROOT is set but doesn't resolve
 *   to an existing directory
 */
export function devRoot() {
  const explicit = process.env[DEV_ROOT_ENV_VAR];
  const resolved = resolve(explicit ?? join(homedir(), "dev"));

  // Validation fires ONLY on explicit override. An unset env var
  // with a missing default is expected first-time state (nothing
  // cloned yet); a set env var pointing at garbage is an operator
  // misconfiguration that deserves an immediate readable error.
  if (explicit !== undefined) {
    if (!existsSync(resolved)) {
      throw new Error(
        `${DEV_ROOT_ENV_VAR}="${explicit}" does not exist. ` +
          `Either create the directory or unset the env var to fall ` +
          `back to the default (~/dev).`,
      );
    }
    if (!statSync(resolved).isDirectory()) {
      throw new Error(
        `${DEV_ROOT_ENV_VAR}="${explicit}" is not a directory. ` +
          `Point it at a directory or unset it.`,
      );
    }
  }

  return resolved;
}

/**
 * Stackra framework BACKEND repos root: `<devRoot>/stackra/backend`.
 * Sibling of `stackraFrontendRoot()`. Contains flat clones of every
 * `stackra/*` composer package (support, http, container, …).
 *
 * @returns {string} absolute path
 */
export function stackraBackendRoot() {
  return resolve(devRoot(), "stackra", "backend");
}

/**
 * Stackra framework FRONTEND repos root: `<devRoot>/stackra/frontend`.
 * Sibling of `stackraBackendRoot()`. Contains flat clones of every
 * `@stackra/*` npm package (react, native, container, …).
 *
 * @returns {string} absolute path
 */
export function stackraFrontendRoot() {
  return resolve(devRoot(), "stackra", "frontend");
}

/**
 * SHARED figentra services root: `<devRoot>/figentra-inc/backend`.
 * Contains the five SHARED Laravel service repos (identity, commerce,
 * notifications, observability, platform) per ADR-0069's corporate-
 * operator vendor scope.
 *
 * @returns {string} absolute path
 */
export function sharedServicesRoot() {
  return resolve(devRoot(), "figentra-inc", "backend");
}

/**
 * Academorix product root: `<devRoot>/academorix`. Contains the
 * academorix/backend/{api,ai} split repos + the academorix mobile
 * app clone when it lands. Sibling folder to `stackra/` and
 * `figentra-inc/`.
 *
 * @returns {string} absolute path
 */
export function academorixRoot() {
  return resolve(devRoot(), "academorix");
}

/**
 * Academorix backend services root: `<devRoot>/academorix/backend`.
 * Contains the two per-Application services from ADR-0058
 * (academorix/api + academorix/ai). Nested under academorixRoot()
 * so the mobile app can sit at academorixRoot()/mobile when it
 * lands.
 *
 * @returns {string} absolute path
 */
export function academorixBackendRoot() {
  return resolve(academorixRoot(), "backend");
}

/**
 * Shortcut for `<sharedServicesRoot>/<name>` — the absolute path to
 * a single SHARED figentra service repo by its slug. Consumers use
 * this when they need to reach one specific service directly
 * (dev-prepare.mjs's Doppler-binding fallback for the five SHARED
 * services that don't ship `.doppler.yaml` in-repo yet).
 *
 * @param {string} name — the service slug (kebab-case), e.g. `identity`
 * @returns {string} absolute path to the service repo
 */
export function sharedServicePath(name) {
  return resolve(sharedServicesRoot(), name);
}
