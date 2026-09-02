# `package.json` conventions

Every `package.json` in the workspace follows one of five canonical shapes,
determined by which tier of the monorepo it lives in. This doc codifies each
shape so a reviewer can tell at a glance whether a manifest is compliant, and so
the `workspace-standardization-steward` and `frontend-package-auditor`
sub-agents can normalize drift programmatically.

Read alongside:

- [`package-conventions.md`](package-conventions.md) — the deeper contract for
  `@stackra/*` frontend packages (tsup + vitest + tsconfig alignment).
- [`catalog-manifest.md`](catalog-manifest.md) — the sibling `catalog.json`
  every frontend package ships.
- [`commit-conventions.md`](commit-conventions.md) — dependency-classifier rules
  (`catalog:` vs `workspace:^` vs `workspace:*`).
- [`code-standards.md`](code-standards.md) — every folder has an `index.ts`
  barrel + one export per file.

## The five tiers

Every `package.json` in the workspace fits one of these tiers. Pick the tier
first; the required shape follows.

| Tier                            | Where it lives                          | Publishable? | Example                                        |
| ------------------------------- | --------------------------------------- | :----------: | ---------------------------------------------- |
| **1. Workspace root**           | `/package.json`                         |      no      | this repo's root                               |
| **2. Publishable `@stackra/*`** | `frontend/packages/<name>/package.json` |     yes      | `frontend/packages/rbac/package.json`          |
| **3. Config package**           | `packages/config/<name>/package.json`   |   yes[^1]    | `frontend/packages/config/eslint/package.json` |
| **4. App template**             | `templates/<flavor>/package.json`       |      no      | `frontend/templates/vite/package.json`         |
| **5. App**                      | `apps/<name>/package.json`              |      no      | `apps/academorix-dashboard/package.json`       |

[^1]:
    Config packages are technically publishable to npm (they're
    `@stackra/eslint-config`, `@stackra/prettier-config`, etc.) but they're
    consumed workspace-only in practice. Treat as tier 2 for the shape rules;
    the `sideEffects` + `exports` fields still apply.

## Rule 1 — every `package.json` picks exactly one tier

A `package.json` MUST match one tier's shape. Mixing shapes (e.g. an app-tier
manifest that carries `publishConfig`, or a root manifest that declares
`exports`) is a review-blocking finding.

Reviewers determine tier by folder location:

- `/package.json` → tier 1 (root)
- `frontend/packages/*/package.json` → tier 2
- `frontend/packages/config/*/package.json` → tier 3
- `templates/*/package.json` → tier 4
- `frontend/frontend/apps/*/package.json` → tier 5

## Tier 1 — Workspace root

The workspace orchestrator. Never publishes to npm. Runs Turborepo tasks across
every workspace member.

### Required fields

- `name` — repo slug (`academorix-clients` today; becomes `academorix-backend`
  when the backend repo splits per brand hierarchy).
- `version` — `"0.0.0"` (never bumped; the root is not a release artifact).
- `private` — `true`.
- `description` — one sentence describing the monorepo's scope (frontend
  packages + backend packages + services + apps).
- `type` — `"module"` (every `*.mjs` script under `scripts/` uses ES modules).
- `packageManager` — pinned pnpm version (e.g. `"pnpm@11.17.0"`). Enforces the
  same pnpm across every workstation. Bump only when the workspace intentionally
  upgrades pnpm.
- `engines` — minimum node + pnpm versions (`"node": ">=22.0.0"`,
  `"pnpm": ">=10.0.0"` today). Aligns with `.nvmrc` at the repo root.
- `prettier` — `"@stackra/prettier-config"` so every editor + CLI reads the same
  config without a per-package `.prettierrc`.
- `scripts` — the full task contract (see §"Root script contract" below).
- `devDependencies` — every dev tool the workspace uses at the root level
  (turbo, prettier, husky, changeset, playwright, size-limit).
- `config.commitizen.path` — `"cz-conventional-changelog"` so `pnpm commit`
  opens the conventional-commits wizard.
- `lint-staged` — the pre-commit staging rules. Covers `.ts` / `.tsx` / `.js` /
  `.jsx` / `.cjs` / `.mjs` (oxlint + prettier), `.json` / `.md` / `.yml` /
  `.yaml` / `.css` (prettier), `.go` (`gofmt`), `.py` (`ruff`).

### Root script contract

Every script below MUST be present at the root. Turborepo fans them out to
workspace members that also carry the same script name (its `turbo.json`
`tasks:` declares each and its cache key + dependencies).

**Section blocks** — the root file uses commented section headers
(`"//------- setup -------"`) to group related scripts. Reviewers expect this
layout; alphabetising scripts is a review-blocking finding.

| Script                   | Purpose                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `prepare`                | `husky \|\| true` — installs git hooks on `npm install` (fails-soft in CI).   |
| `install:all`            | `turbo run install` — fans out per-language install to every service.          |
| `dev`                    | `turbo run dev`                                                                |
| `dev:parallel`           | `turbo run dev --parallel` — for developers running every service at once.     |
| `build`                  | `turbo run build`                                                              |
| `lint`                   | `turbo run lint`                                                               |
| `lint:fix`               | `turbo run lint:fix`                                                           |
| `format`                 | `prettier --write` on every file pattern (never delegated to turbo).           |
| `format:check`           | `prettier --check` on every file pattern.                                      |
| `typecheck`              | `turbo run typecheck`                                                          |
| `analyse`                | `turbo run analyse` — backend static-analysis gate.                            |
| `test`                   | `turbo run test`                                                               |
| `test:watch`             | `turbo run test:watch` — dev-loop.                                             |
| `test:coverage`          | `turbo run test:coverage` — writes coverage reports per workspace.             |
| `knip`                   | `knip --no-config-hints` — root-level unused-dep + unused-export check.        |
| `size`                   | `size-limit` — bundle-size budgets from `.size-limit.json`.                    |
| `quality`                | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip` — static gate. |
| `quality:fix`            | `pnpm format && pnpm lint:fix` — the auto-fix version.                         |
| `verify`                 | Same as `quality` — pre-commit-safe subset (no tests, no build).               |
| `check`                  | `pnpm quality && pnpm test` — full contributor gate pre-push.                  |
| `ci`                     | `pnpm quality && pnpm test && pnpm build && pnpm size` — full CI gate.         |
| `clean`                  | `node scripts/clean.mjs` — reap every regenerable artifact.                    |
| `clean:dry`              | Same script, `--dry-run` flag.                                                 |
| `reset`                  | `pnpm clean && npm install` — full cold-start.                                |
| `dev:secret`             | `doppler run -- turbo run dev --parallel` — with real secrets from Doppler.    |
| `test:secret`            | `doppler run -- turbo run test`                                                |
| `test:integration`       | `doppler run -- turbo run test -- --group=integration`                         |
| `e2e`                    | `playwright test` — full-stack browser suite.                                  |
| `e2e:ui`                 | `playwright test --ui` — Playwright's watch UI.                                |
| `e2e:report`             | `playwright show-report` — last-run report.                                    |
| `changeset`              | `changeset` — opens the wizard for a new changeset.                            |
| `changeset:status`       | `changeset status` — prints pending changesets.                                |
| `changeset:version`      | `changeset version` — applies pending changesets to package versions.          |
| `changeset:publish`      | `changeset publish` — publishes bumped packages to npm.                        |
| `commit`                 | `cz` — the commitizen wizard for conventional-commit-formatted commits.        |
| `danger`                 | `danger local --dangerfile .github/dangerfile.mjs` — local PR review check.    |
| `turbo:login`            | `turbo login` — Vercel/Turbo cache auth.                                       |
| `turbo:link`             | `turbo link` — binds this repo to the team cache.                              |
| `turbo:logout`           | `turbo logout`                                                                 |
| `turbo:info`             | `turbo info` — prints current cache config.                                    |
| `doppler:login`          | `doppler login`                                                                |
| `doppler:setup`          | `doppler setup --no-interactive` — attaches workstation to a config.           |
| `doppler:check`          | Prints active project + config.                                                |
| `doppler:me`             | `doppler me`                                                                   |
| `heroui:*`               | HeroUI Pro license CLI wrappers (login, setup, update, status).                |
| `bootstrap:microservice` | `node scripts/bootstrap-microservice.mjs` — scaffold a Cloudflare Worker service. |
| `bootstrap:vite`         | `node scripts/bootstrap-vite.mjs` — scaffold a Vite web app.                   |
| `bootstrap:react-native` | `node scripts/bootstrap-react-native.mjs` — scaffold a RN app.                 |
| `docs:lint`              | `markdownlint-cli2` on `docs/**/*.md`.                                         |
| `docs:lint:fix`          | Same with `--fix`.                                                             |
| `docs:links`             | `lychee` via docker for link-checking every markdown file.                     |

Add a new script only when it fits an existing section OR justifies a new
section header. Ad-hoc scripts that break the layout are review- blocking.

## Tier 2 — Publishable `@stackra/*` package

Every frontend package under `frontend/packages/*` follows this shape.
Publishable to npm (though workspace consumers use `workspace:^`).

### Required fields

- `name` — `"@stackra/<slug>"`.
- `version` — semver (e.g. `"0.5.2"`). Bumped via Changesets — never by hand.
- `description` — one-sentence purpose.
- `license` — `"MIT"` (or whatever the workspace ships; consistent).
- `author` — `"Figentra L.L.C <dev@figentra.com>"` per
  `.kiro/steering/brand-hierarchy.md`.
- `keywords` — 3-8 npm search keywords (`["stackra", "rbac", "react", ...]`).
- `repository` —
  `{ "type": "git", "url": "https://github.com/figentra/academorix-clients.git", "directory": "frontend/packages/<slug>" }`.
- `homepage` —
  `"https://github.com/figentra/academorix-clients/tree/main/frontend/packages/<slug>#readme"`.
- `bugs` — `{ "url": "https://github.com/figentra/academorix-clients/issues" }`.
- `type` — `"module"`.
- `sideEffects` — `false` (or CSS-only exception array for design-system
  packages that ship stylesheet-only entries).
- `publishConfig` — `{ "access": "public" }`.
- `main` — `"./dist/index.js"` (legacy resolver fallback).
- `module` — `"./dist/index.mjs"`.
- `types` — `"./dist/index.d.ts"`.
- `exports` — the conditional-exports map covering every subpath the package
  ships (`.`, `./react`, `./native`, `./testing`, `./vite`, `./console`, ...).
  Each subpath has `{ types, import, require }` triple pointing at
  `dist/<slug>.d.ts` / `dist/<slug>.mjs` / `dist/<slug>.js`.
- `files` — `["dist", "LICENSE", "README.md"]` (add `"src/core/i18n"` when the
  package ships i18n catalogs the runtime reads at build time, and `"config"`
  when it ships a publishable config file).
- `engines.node` — `">=22.0.0"`.
- `scripts` — the workspace-member script contract (see §"Package script
  contract" below).
- `dependencies` — none by default (rare CLI / build-tool exception applies per
  ADR-0051; see `package-conventions.md`).
- `peerDependencies` — every runtime dep the consumer must install. Internal
  `@stackra/*` uses `workspace:^`; third-party uses `catalog:`.
- `peerDependenciesMeta` — mark optional peers
  (`{ "react": { "optional": true } }`).
- `devDependencies` — mirror every peer dep + build tools. Internal `@stackra/*`
  uses `workspace:*`; third-party uses `catalog:`.

### Package script contract

Every workspace member (tier 2, 3, 4, 5) MUST expose these scripts identically
so the root `turbo run <task>` fans out predictably.

| Script          | Purpose                                              | Cache-safe? |
| --------------- | ---------------------------------------------------- | :---------: |
| `dev`           | `tsup --watch` (or app-tier equivalent).             |     no      |
| `build`         | `tsup` (or `vite build` / `expo prebuild` per tier). |     yes     |
| `clean`         | `rimraf dist .turbo` (add `coverage` if generated).  |     n/a     |
| `typecheck`     | `tsc --noEmit`                                       |     yes     |
| `lint`          | `eslint . --max-warnings=0`                          |     yes     |
| `lint:fix`      | `eslint . --fix`                                     |     n/a     |
| `test`          | `vitest run --passWithNoTests`                       |     yes     |
| `test:watch`    | `vitest`                                             |     no      |
| `test:coverage` | `vitest run --coverage`                              |     yes     |

Optional per-tier:

- `analyse` — tier 2 only when the package ships lint rules for its own domain
  (rare).
- `size` — tier 2 only when the package participates in `size-limit` budgets.

## Tier 3 — Config package

`frontend/packages/config/*` (in the frontend workspace) —
`@stackra/eslint-config`, `@stackra/prettier-config`, `@stackra/tsup-config`,
`@stackra/typescript-config`, `@stackra/testing`.

Same shape as tier 2 with these differences:

- Usually zero source code — every export is a config file exported directly (no
  `src/` build step, no `dist/`).
- `main` typically points at the config file directly (`"./base.mjs"`).
- No `sideEffects` claim (configs are inert).
- `files` includes the config files by name, not a `dist/` folder.
- `scripts` — usually just `lint` + `format:check`. Never `build`.

## Tier 4 — App template

`frontend/templates/vite`, `frontend/templates/react-native`,
`backend/templates/microservice` — seed projects the bootstrap scripts copy into
`apps/` or `services/`.

- `name` — `"vite-template"` / `"react-native-template"` / etc. (never
  `@stackra/*` — the bootstrap script renames on copy).
- `version` — `"0.0.0"` (templates aren't versioned).
- `private` — `true`.
- `description` — one sentence naming what the template scaffolds.
- No `publishConfig`, no `exports`, no `files`.
- `scripts` — the tier the template scaffolds INTO. A Vite template ships `dev`
  / `build` / `preview` / `test` / `lint` / `typecheck`.
- `dependencies` + `devDependencies` — the full runtime + build deps of the
  target app tier. Every peer becomes a direct dep here (templates don't have
  peers, they have concrete deps).

## Tier 5 — App

`apps/*` — every deployed customer-facing surface. Never published to npm.

- `name` — `"@academorix/<slug>"` (product-scoped per brand hierarchy) or
  `"@stackra/<slug>"` (framework-scoped e.g. `apps/vite-example`).
- `version` — `"0.0.0"` (unversioned; deploys are semver-tagged separately).
- `private` — `true`.
- `description` — one sentence.
- No `publishConfig`.
- No `exports` (apps aren't consumed).
- Same `scripts` contract as tier 2 (dev/build/test/lint/typecheck).
- `dependencies` — every runtime dep the app actually consumes (not peers — apps
  use `dependencies`, not `peerDependencies`).
- `devDependencies` — build tools + test framework.

## Rule 2 — dependency classification

Every dep in every `package.json` uses one of these four shapes. Never a bare
version string on internal or catalog deps.

| Shape         | Where                                                | Meaning                                                         |
| ------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `catalog:`    | `peerDependencies`, `devDependencies` — third-party  | Version pinned in root `package.json workspaces` `catalogs:` block. |
| `workspace:^` | `peerDependencies` — internal `@stackra/*`           | Consumer tracks a caret range against the peer's current major. |
| `workspace:*` | `devDependencies` — internal `@stackra/*`            | Consumer tracks the workspace floor. Used for build-time deps.  |
| bare version  | `dependencies` — CLI/build-tool exception (ADR-0051) | Only when the package qualifies for the ADR-0051 exception.     |

Every optional peer additionally carries `{ "optional": true }` in
`peerDependenciesMeta`.

## Rule 3 — engines pinning

Every tier's `engines` block declares the minimum Node version the workspace
supports. The root pins pnpm too:

```jsonc
"engines": {
  "node": ">=22.0.0",   // every tier
  "pnpm": ">=10.0.0"    // root only
}
```

Bumping requires a coordinated ADR — Node bumps break CI, pnpm bumps break
lockfile compat.

## Rule 4 — `sideEffects` on publishable packages

Every tier 2 + tier 3 package declares `sideEffects: false` to enable
tree-shaking, unless it genuinely has side effects (a CSS import, a polyfill
registration).

CSS-only side effects declare the specific files:

```jsonc
"sideEffects": ["**/*.css", "./src/register-polyfills.ts"]
```

Missing `sideEffects` on a publishable package is a P1 audit finding.

## Rule 5 — `exports` map contract

Every publishable package's `exports` map:

- Lists EVERY subpath the package publishes (`.`, `./react`, `./native`, ...).
- Each entry is a `{ types, import, require }` triple pointing at
  `dist/<slug>.d.ts` / `dist/<slug>.mjs` / `dist/<slug>.js`.
- The `types` condition is LISTED FIRST (Node resolver reads first match;
  `types` first ensures IDEs see the type entry).
- The `.` entry MUST be declared even when it's the only entry.
- Legacy `main` / `module` / `types` fields at the top level mirror the `.`
  entry for older resolvers.

Every entry MUST have a matching `tsup.config.ts` entry per
`.kiro/steering/package-conventions.md`.

## Rule 6 — `files` field

Every tier 2 + tier 3 package's `files` field:

- Includes `"dist"` (the built output).
- Includes `"LICENSE"` and `"README.md"` (published to npm).
- Adds `"src/core/i18n"` when the package ships i18n catalogs the runtime reads
  at build time.
- Adds `"config"` when the package ships a publishable config file.
- Never includes `"src"` (source files aren't published — consumers read
  `dist/`).

## Rule 7 — Script contract enforcement

Every workspace member's `scripts` block covers the full contract from §"Package
script contract" above. Missing scripts are review-blocking.

`turbo.json` at the root declares each task's dependency graph and cache key.
Adding a new script that Turbo should manage requires declaring the task in
`turbo.json` too.

## Rule 8 — Root-only fields

Only the root `package.json` carries:

- `packageManager`
- `prettier`
- `config.commitizen.path`
- `lint-staged`
- `engines.pnpm`
- `type: "module"` at the WORKSPACE level (individual packages set their own
  `type` based on their build output; ESM-only packages set `"module"`,
  dual-emit packages omit it or set explicitly per tier).

A workspace-member carrying any of these is a review-blocking finding.

## Rule 9 — Docblock comments at the root

The workspace root's `package.json` opens with a `"//1"`, `"//2"`, ... docblock
explaining what the file orchestrates. JSON doesn't support comments; the `//N`
keys are the workaround (JSON parsers ignore them).

Section headers within `scripts` use `"//------- <name> -------"` keys to group
related scripts. Reviewers expect this layout; alphabetising scripts is a
review-blocking finding.

Workspace-member `package.json` files do NOT carry these comments — they add
noise without value for smaller files.

## Anti-patterns

| Anti-pattern                                                    | Correct                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Bare version string on a third-party dep in a workspace member  | `catalog:` — pin the version in root `package.json workspaces` `catalogs:`.                    |
| `workspace:*` on an internal peer                               | `workspace:^` — peers track major-boundary; devDeps track floor.                           |
| `workspace:^` on an internal devDep                             | `workspace:*` — devDeps track floor.                                                       |
| Missing `sideEffects: false` on a tier 2 package                | Add it (or the CSS-only exception array).                                                  |
| Missing `publishConfig.access: "public"` on tier 2              | Add it — private-scope packages default to `restricted` on publish.                        |
| `packageManager` field on a workspace member                    | Remove — root-only.                                                                        |
| `prettier` config file per package                              | `"prettier": "@stackra/prettier-config"` at the root; per-package config is drift.         |
| `main` / `module` / `types` present but no `exports` map        | Add the `exports` map — the modern resolver reads it first.                                |
| `exports` map with `types` LAST in the condition object         | Put `types` first — order of keys matters for Node's resolver.                             |
| Ad-hoc script names (`dev:local`, `build:prod`)                 | Use the contract (`dev`, `build`) — flavor via env vars.                                   |
| `sideEffects` claim on a config-only package                    | Config packages are inert; omit.                                                           |
| `dependencies` block on a tier 2 package (non-CLI, non-tooling) | Move to `peerDependencies` — consumers supply the runtime.                                 |
| Missing `engines.node` on a workspace member                    | Add `">=22.0.0"`.                                                                          |
| Alphabetised scripts in the root file                           | Preserve section-header grouping — the doc-comment sections are load-bearing for scanning. |
| Tier 4 template's `package.json` names the target directly      | Templates keep generic names — the bootstrap script renames on copy.                       |

## Enforcement

Zero-hit greps that must pass across the workspace:

```sh
# Bare third-party version in a workspace member (should be catalog:)
grep -rEn '"[a-z@][^"]*": "[0-9^~]' frontend/packages/*/package.json frontend/apps/*/package.json | \
  grep -v '"workspace:' | grep -v '"catalog:'

# workspace:* on a peer (should be workspace:^)
grep -A20 '"peerDependencies"' frontend/packages/*/package.json | grep '"workspace:\*"'

# Missing sideEffects on tier 2
for pkg in frontend/packages/*/package.json; do
  jq -e '.sideEffects != null' "$pkg" >/dev/null || echo "MISSING sideEffects: $pkg"
done

# packageManager on a workspace member (root-only)
grep -l '"packageManager"' frontend/packages/*/package.json frontend/apps/*/package.json
```

## Cross-references

- [`package-conventions.md`](package-conventions.md) — deeper `@stackra/*`
  package contract (module + config trio, `forFeature` seed loaders).
- [`catalog-manifest.md`](catalog-manifest.md) — `catalog.json` shape.
- [`subpath-layering.md`](subpath-layering.md) — subpath dependency direction
  (one-way, top-down).
- [`commit-conventions.md`](commit-conventions.md) — dependency change hygiene.
- [`frontend-package-audit-checklist.md`](frontend-package-audit-checklist.md) —
  the per-package audit the `frontend-package-auditor` sub-agent walks.
