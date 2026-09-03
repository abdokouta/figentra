/**
 * @file repos.mjs
 * @module scripts/_lib/repos
 * @description Canonical inventory of every GitLab repo in the
 *   workspace's fan-out surface. Every fan-out script (sync-branches,
 *   rollout-sentry-release, rollout-agents-md, rollout-env-naming-ci,
 *   ...) reads from ONE source of truth here so adding a new repo is a
 *   single-line edit.
 *
 * ## Kinds
 *
 *   - `workspace`         — the workspace repo itself
 *                           (figentra-inc/workspace).
 *   - `backend-service`   — a Laravel Octane microservice
 *                           (figentra-inc/backend/* AND
 *                           academorix/backend/*).
 *   - `frontend-spa`      — a single-app Vite / Next.js repo
 *                           (figentra-inc/landing-page).
 *   - `frontend-monorepo` — a Turborepo monorepo with N web deployables
 *                           at apps/* (academorix/frontend — hosts
 *                           apps/dashboard + apps/landing).
 *   - `mobile-app`        — a React Native / Expo monorepo
 *                           (academorix/mobile — hosts apps/family +
 *                           apps/coach).
 *
 * ## Cross-references
 *
 *   - `.kiro/steering/env-naming.md` §"Per-deployable Doppler projects"
 *   - `scripts/rollout-*.mjs` — every fan-out consumer.
 *   - `.kiro/plans/2026-08-08-*` — the roll-out plans this list
 *     supports.
 */

/**
 * @typedef {"workspace" | "backend-service" | "frontend-spa" | "frontend-monorepo" | "mobile-app"} RepoKind
 */

/**
 * @typedef {object} WorkspaceRepo
 * @property {string}   path         GitLab path with namespace (`figentra-inc/backend/identity`).
 * @property {number}   id           GitLab project ID.
 * @property {string}   group        Top-level GitLab group (`figentra-inc` or `academorix`).
 * @property {RepoKind} kind         What runs inside this repo.
 * @property {string}   [note]       Optional per-repo caveat for fan-out scripts.
 */

/**
 * The full workspace repo inventory.
 * Ordered by kind then alphabetically within kind.
 *
 * @type {WorkspaceRepo[]}
 */
export const WORKSPACE_REPOS = [
  // ── workspace ────────────────────────────────────────────────────
  {
    path: "figentra-inc/workspace",
    id: 85079251,
    group: "figentra-inc",
    kind: "workspace",
  },

  // ── backend-service (7) ──────────────────────────────────────────
  {
    path: "figentra-inc/backend/identity",
    id: 85071726,
    group: "figentra-inc",
    kind: "backend-service",
  },
  {
    path: "figentra-inc/backend/commerce",
    id: 85071723,
    group: "figentra-inc",
    kind: "backend-service",
  },
  {
    path: "figentra-inc/backend/notifications",
    id: 85071729,
    group: "figentra-inc",
    kind: "backend-service",
  },
  {
    path: "figentra-inc/backend/observability",
    id: 85071730,
    group: "figentra-inc",
    kind: "backend-service",
  },
  {
    path: "figentra-inc/backend/platform",
    id: 85071732,
    group: "figentra-inc",
    kind: "backend-service",
  },
  {
    path: "academorix/backend/api",
    id: 85083796,
    group: "academorix",
    kind: "backend-service",
  },
  {
    path: "academorix/backend/ai",
    id: 85078390,
    group: "academorix",
    kind: "backend-service",
  },

  // ── frontend-spa (1) ─────────────────────────────────────────────
  {
    path: "figentra-inc/landing-page",
    id: 85067822,
    group: "figentra-inc",
    kind: "frontend-spa",
  },

  // ── frontend-monorepo (1) ────────────────────────────────────────
  // Hosts apps/dashboard (Vite SPA — dashboard.academorix.com) +
  // apps/landing (Vite SPA — academorix.com). Split repos
  // academorix/dashboard + academorix/landing retired 2026-08-10
  // per .kiro/plans/2026-08-10-frontend-monorepo-consolidation.md.
  {
    path: "academorix/frontend",
    id: 85094155,
    group: "academorix",
    kind: "frontend-monorepo",
  },

  // ── mobile-app ───────────────────────────────────────────────────
  // Deploys via EAS on tag push; no CI include shape today.
  // Excluded from CI-include rollouts pending a mobile pipeline
  // landing. INCLUDED in git-hygiene fan-outs (audit-repos,
  // sync-branches, prune-stale-branches) as of 2026-08-24.
  {
    path: "academorix/mobile",
    id: 84787506,
    group: "academorix",
    kind: "mobile-app",
    note: "EAS-managed; skip CI-include rollouts",
  },
];

/**
 * Return every repo whose `kind` is in the given list.
 *
 * @param {RepoKind[]} kinds
 * @returns {WorkspaceRepo[]}
 */
export function reposByKind(...kinds) {
  const set = new Set(kinds);
  return WORKSPACE_REPOS.filter((r) => set.has(r.kind));
}

/**
 * Return every repo matching a `--only` comma-separated path filter.
 * Empty / undefined filter returns every repo.
 *
 * @param {string} filter  e.g. `"figentra-inc/backend/identity,academorix/dashboard"`
 * @returns {WorkspaceRepo[]}
 */
export function reposByPaths(filter) {
  if (!filter) return WORKSPACE_REPOS;
  const set = new Set(
    filter
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
  );
  return WORKSPACE_REPOS.filter((r) => set.has(r.path));
}
