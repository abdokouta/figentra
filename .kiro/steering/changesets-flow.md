---
inclusion: fileMatch
fileMatchPattern: "{**/.changeset/*,**/.gitlab-ci.yml,**/package.json,**/CHANGELOG.md}"
authored_by: kiro
authored_at: 2026-08-14
source: prompt://enterprise-changesets-cicd-pilot
reviewed_by: null
reviewed_at: null
---

# 🦋 Changesets flow — versioning + publish contract

Rules for how every `@stackra/*` publishable metapackage frontend repo
(`stackra/frontend/framework`, `stackra/frontend/identity`,
`stackra/frontend/tenancy`, `stackra/frontend/notifications`,
`stackra/frontend/platform`, `stackra/frontend/ai`) bumps versions, writes
release notes, and publishes to `npmjs.org`. Establishes the enterprise pattern
the workspace was designed for + closes the gaps that let manual bumps drift the
trail.

Piloted first in `stackra/frontend/identity` (2026-08-14); propagates to every
other metapackage repo after the pilot validates.

## Precedence

1. This file wins over any generic "how do I publish" guidance.
2. When this file and a repo-local `.changeset/README.md` disagree, this file
   wins.
3. Cross-references:
   - [`commit-conventions.md`](commit-conventions.md) — commit-shape rules for
     the commits that carry changesets.
   - [`package-json-conventions.md`](package-json-conventions.md) — root
     `package.json` shape (this doc's Rule 3 anchors the required scripts).
   - [`package-conventions.md`](package-conventions.md) — sub-package
     conventions each `src/*/package.json` follows.
   - [`frontend-packages.md`](../../.ref/steering/frontend-packages.md) — the package doctrine every
     `@stackra/*` publishable satisfies.

## The three artefacts every publishable metapackage repo ships

1. **`.changeset/` folder** — pending changesets + config + README.
2. **`.gitlab-ci.yml`** — the enterprise pipeline (5 stages).
3. **Root `package.json`** with the full script contract + `@changesets/cli`
   devDep + `packageManager` pin.

Missing any of the three ⇒ the repo can't participate in the enterprise flow.

## Rule 1 — Every user-visible change carries a changeset

Any MR that modifies source under `src/*/src/` MUST land a `.changeset/*.md`
file describing the change. The author-facing wizard is `pnpm changeset` at repo
root; the wizard walks:

1. Which nested packages are affected? (multi-select)
2. What bump does each need? (patch / minor / major)
3. One-line summary that becomes the `CHANGELOG.md` entry.

The wizard writes `.changeset/<random-slug>.md`. Commit alongside the code
change.

**Enforcement.** CI's `📦 changeset-verify` job on every MR runs
`pnpm changeset status --since=origin/<target-branch>` and fails when the diff
shows source changes without a matching changeset. Reviewers reject MRs where
the job fails.

**Exemptions.** Changes to `.kiro/`, `docs/`, `README.md`, workspace-root
config, tests-only changes, and CI-only changes MAY skip the changeset — the
`changeset-verify` job's `--since` diff already excludes those paths because
they don't sit under `src/*/src/`.

## Rule 2 — Version bumps happen ONLY via `changesets version`

The workspace has zero tolerance for hand-bumping `package.json` versions. Every
version bump flows through:

1. Author-side: `pnpm changeset` writes the intent.
2. Merged to `main`.
3. CI's `🚀 open-version-mr` job (main-only) consumes every pending changeset:
   - Runs `pnpm changeset:version` (which invokes
     `changeset version && npm install --lockfile-only`).
   - Bumps every affected `package.json` per semver rules.
   - Appends `CHANGELOG.md` entries.
   - Deletes the consumed changesets.
   - Opens a `changeset/version-packages` branch MR titled "🎉 Version
     Packages".
4. Reviewer merges the Version Packages MR.
5. Repo maintainer cuts a tag `v<X>.<Y>.<Z>` matching the metapackage's own
   release version (the highest sub-package bump in the batch, or a chosen
   coordination version).
6. Tag push fires the `🎉 publish` + `📝 release` pipeline stages.

**Hand-bumped versions in `package.json` are review-blocking.** Even in
emergency catch-up scenarios, the correct pattern is:

- Author the missing changesets against a feature branch.
- Merge normally; let CI open the version MR.
- If a hand-bump already landed, author a follow-up commit that AMENDS the
  affected `CHANGELOG.md` with the missing entry (this doc's Rule 5 catch-up
  path).

## Rule 3 — Root `package.json` scripts (canonical set)

Every metapackage repo's root `package.json` MUST expose these scripts verbatim
(except comments — those are documentation only):

```jsonc
{
  "packageManager": "pnpm@11.20.0",
  "scripts": {
    "// ─── quality gates ───": "runs on every MR + on main",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\" \".changeset/*.md\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\" \".changeset/*.md\"",
    "lint": "pnpm -r --parallel run lint",
    "lint:fix": "pnpm -r --parallel run lint:fix",
    "typecheck": "pnpm -r --parallel run typecheck",
    "test": "pnpm -r --parallel run test",
    "test:coverage": "pnpm -r --parallel run test:coverage",
    "// ─── build ───": "produces dist/ per sub-package",
    "build": "pnpm -r run build",
    "clean": "pnpm -r --parallel run clean && rimraf node_modules/.cache",
    "// ─── changesets ───": "author-side + CI-side release orchestration",
    "changeset": "changeset",
    "changeset:status": "changeset status --verbose",
    "changeset:version": "changeset version && npm install --lockfile-only",
    "changeset:publish": "pnpm -r run build && changeset publish",
    "// ─── composed gates ───": "used by MRs (verify) + CI (ci) + local (check)",
    "verify": "pnpm format:check && pnpm lint && pnpm typecheck",
    "check": "pnpm verify && pnpm test",
    "ci": "pnpm check && pnpm build",
  },
}
```

And the devDependencies MUST include:

- `@changesets/cli` — the versioning + publish orchestrator.
- `prettier` — the formatter.
- `rimraf` — for the `clean` script.

## Rule 4 — `.changeset/config.json` (canonical shape)

Every metapackage repo ships this exact config unless a documented per-repo
delta applies:

```jsonc
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
}
```

Field semantics:

- **`access: "public"`** — every `@stackra/*` package publishes to the public
  `@stackra` npm scope (paid plan). Private packages within a repo (like the
  metapackage's own root `@stackra/identity` at `private: true`) are
  auto-ignored because they're outside the workspace's `packages:` glob.
- **`baseBranch: "main"`** — the branch diffs run against.
- **`updateInternalDependencies: "patch"`** — when a workspace-peer bumps minor
  / major, dependents get an automatic patch bump.
- **`commit: false`** — the version-bump commit lives in the CI's
  `open-version-mr` job, not in the CLI itself. Keeps the local `pnpm changeset`
  invocation side-effect-free.
- **`fixed: []` / `linked: []`** — every sub-package versions independently. If
  a coordination requirement emerges (e.g. every auth-* package must bump
  together), add the affected package names as a string array under `fixed`.

## Rule 5 — CHANGELOG.md is the source of truth for release notes

Every sub-package's `CHANGELOG.md` follows the Changesets output format:

```markdown
# @stackra/<pkg>

## 1.5.0

### Minor Changes

- <one-line summary from the changeset>
- <additional summaries if multiple changesets targeted this package>

## 1.4.2

### Patch Changes

- ...
```

GitLab Releases (created by CI's `📝 release` job on tag push) inherit the
CHANGELOG entries matching the tag's version.

**Catch-up path.** When a hand-bump has already landed (Rule 2 violation), the
corrective action is:

1. Do NOT roll back the version bump — that breaks consumer resolution.
2. Author a follow-up commit that patches the affected `CHANGELOG.md` with the
   missing entry (matching the current `package.json` version).
3. Author a `.kiro/steering/*` amendment describing the catch-up so the trail
   stays honest.

## Rule 6 — `.gitlab-ci.yml` stages (canonical order)

```
🧰 setup     →  🎨 quality (parallel format + lint + typecheck + test)  →
🏗️ build   →  📦 verify (MR-only: changeset-verify)                    →
🚀 release  (main-only: open-version-mr; tag-only: publish + release)
```

Every job uses the canonical anchor set:

- `.pnpm-boot` — corepack + pnpm activation + store-dir config.
- `.consumer-npmrc` — writes `.npmrc` with both npmjs.org (via `NPM_TOKEN`) and
  the GitLab group aggregator (via `STACKRA_GITLAB_TOKEN`) so workspace-peer
  resolution works.
- `.on-mr` / `.on-main` / `.on-mr-or-main` / `.on-tag` — canonical trigger-gate
  anchors.

Every job's name carries a leading emoji (🧰 🎨 🔍 🔎 🧪 🏗️ 📦 🚀 🎉 📝). This
is workspace convention — makes GitLab's pipeline view scannable and signals
stage function at a glance.

## Rule 7 — Required CI variables per repo

Every metapackage repo MUST set these three CI variables (Settings → CI/CD →
Variables, ALL masked + protected):

| Variable               | Purpose                                             | Doppler source                     |
| ---------------------- | --------------------------------------------------- | ---------------------------------- |
| `NPM_TOKEN`            | Publishes `@stackra/*` to `npmjs.org`.              | `STACKRA_NPM_TOKEN` (workspace)    |
| `STACKRA_GITLAB_TOKEN` | Reads workspace peers from `@stackra` GitLab group. | `STACKRA_GITLAB_TOKEN` (workspace) |
| `GITLAB_TOKEN`         | Opens the Version Packages MR (`api` scope PAT).    | `FIGENTRA_GITLAB_TOKEN` (fallback) |

Provisioning the variables is a Rule-8 workflow (below); scripted via
`scripts/provision-repo-ci-vars.mjs` (planned) using `FIGENTRA_GITLAB_TOKEN`
from the workspace-tooling Doppler.

## Rule 8 — Onboarding a new metapackage repo to the flow

Every new `@stackra/*` publishable metapackage repo lands the same setup:

1. **Copy the four files** from an established repo (identity is the canonical
   pilot):
   - `.changeset/config.json`
   - `.changeset/README.md`
   - `.gitlab-ci.yml`
   - `package.json` scripts section
2. **Add `@changesets/cli` + `prettier` + `rimraf`** to root devDeps.
3. **Set `packageManager: "pnpm@11.20.0"`** in root `package.json`.
4. **Provision CI variables** per Rule 7.
5. **Verify locally**: `npm install && pnpm changeset:status` must return "🦋
   info Running release would release NO packages ...".
6. **First real changeset**: author a `.changeset/*.md` describing any pending
   change, open an MR, verify CI runs green.
7. **Merge + tag**: let CI open the Version MR + publish on tag push.

## Rule 9 — Metapackage vs. single-package repo delta

The metapackage shape (framework, identity, notifications, platform, ai) has
`package.json workspaces` with `packages: - "src/*"` and multiple nested
sub-packages under `src/`.

Single-package repos (currently: only `stackra/frontend/tenancy`) put their sole
`package.json` at repo root — no `package.json workspaces`. The scripts contract
simplifies:

- `pnpm -r --parallel run lint` becomes `eslint .`
- `pnpm -r run build` becomes `tsup`
- Everything else stays.

The `.gitlab-ci.yml` structure stays IDENTICAL; only the script bodies in root
`package.json` differ. This delta lives in `Rule 9 §Single-package delta`
(rendered inline when a single-package repo needs the setup).

## Anti-patterns

| Anti-pattern                                                         | Correct                                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Hand-editing `package.json` `version` field                          | `pnpm changeset` — the wizard writes the intent, CI does the bump.         |
| `pnpm publish` from a workstation                                    | Never. CI's `🎉 publish` job on tag push is the only publish path.         |
| Committing to `main` without a changeset when source changed         | Reviewers reject. Author `pnpm changeset` retroactively on a follow-up MR. |
| `.changeset/*.md` in the same commit as unrelated non-source changes | Ok — changeset ownership is per-file, not per-commit.                      |
| Missing `packageManager` field in root `package.json`                | Set to `pnpm@11.20.0` per Rule 3.                                          |
| `.gitlab-ci.yml` without emojis on job names                         | Emojis are workspace convention — pipeline UI scans faster.                |
| Skipping `changeset-verify` on an MR because "it's a small change"   | Every source change under `src/*/src/` gets a changeset. No exceptions.    |
| Publish job that runs on push-to-main (not tag-only)                 | Publish is tag-triggered per Rule 6. Push-to-main opens a Version MR only. |
| Absent NPM_TOKEN in CI variables                                     | Rule 7. Publish fails without it.                                          |

## Enforcement

CI's `📦 changeset-verify` job on every MR is the primary enforcement. In
addition, the workspace-wide auditor runs these greps quarterly:

```bash
# Every publishable metapackage repo carries .changeset/ + .gitlab-ci.yml
for repo in ~/dev/stackra/frontend/{framework,identity,tenancy,notifications,platform,ai}; do
  test -d "$repo/.changeset" || echo "MISSING .changeset/: $repo"
  test -f "$repo/.gitlab-ci.yml" || echo "MISSING .gitlab-ci.yml: $repo"
  grep -q '"@changesets/cli"' "$repo/package.json" || echo "MISSING @changesets/cli devDep: $repo"
  grep -q '"packageManager": "pnpm@' "$repo/package.json" || echo "MISSING packageManager pin: $repo"
done

# No hand-bumped versions in recent commits
for repo in ~/dev/stackra/frontend/*; do
  cd "$repo"
  # Look for commits that touch package.json's version field but no changeset
  git log --since="1 week ago" --name-only --format="%h" -- '**/package.json' \
    | awk 'NR%2{sha=$0; next} {print sha, $0}' \
    | grep -v changeset \
    | while read sha file; do
        if git show --stat "$sha" -- "$file" | grep -qE '^\+\s*"version":'; then
          if ! git show --stat "$sha" -- '.changeset/*.md' | grep -q '.changeset'; then
            echo "HAND-BUMP without changeset: $repo $sha $file"
          fi
        fi
      done
done
```

## Cross-references

- Pilot repo — `stackra/frontend/identity` — the canonical implementation.
- `.changeset/README.md` per repo — author-facing primer.
- [`commit-conventions.md`](commit-conventions.md) §Provenance — commit footer
  every changeset-authoring commit carries.
- [`package-json-conventions.md`](package-json-conventions.md) — root
  `package.json` shape.
- [`package-conventions.md`](package-conventions.md) — sub-package shape.
- [`frontend-packages.md`](../../.ref/steering/frontend-packages.md) — the package doctrine.
- Doppler — `figentra-workspace/dev` `STACKRA_NPM_TOKEN` — the workspace storage
  substrate for the publish token.
