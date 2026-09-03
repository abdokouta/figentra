---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization-tasklist
reviewed_by: null
reviewed_at: null
---

# 2026-09-03 — Workspace standardisation tasklist

The consolidated plan for the 12 asks in the standardisation session. Every
section starts with the answer / recommendation (so the reader can commit to a
direction), then lists the concrete tasks (so a writer sub-agent can pick them
up one at a time).

Task ownership is called out per section using the agent slugs from
[`.kiro/agents/`](../agents/). Cross-cutting rules (`code-standards.md`,
`package-conventions.md`, `package-json-conventions.md`) are cited inline so a
writer never needs to guess the standard.

## Amendments — 2026-09-03 second-half session

Three additional ADRs landed alongside this plan; three sibling architecture
plans reference them:

- [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md) — Manager +
  MultipleInstanceManager pattern (drives every `@stackra/*` driver-based
  package's shape).
- [ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md) —
  Cross-runtime package structure (locks the subpath layout every cross-runtime
  package follows).
- [ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) — Service
  auto-registration (`StackraServiceModule` composite that ships the seven
  platform modules every backend service imports).

Sibling architecture plans:

- [`.kiro/plans/2026-09-03-container-package.md`](./2026-09-03-container-package.md)
  — full `@stackra/container` design (browser + RN + Worker + NestJS).
- [`.kiro/plans/2026-09-03-logger-package.md`](./2026-09-03-logger-package.md) —
  full `@stackra/logger` design (channels, drivers, cross-runtime sinks,
  Pino/Winston as optional peers).
- [`.kiro/plans/2026-09-03-database-package.md`](./2026-09-03-database-package.md)
  — full `@stackra/database` design (MikroORM + Postgres + D1, fluent Schema
  builder).
- [`.kiro/plans/2026-09-03-coordinator-package.md`](./2026-09-03-coordinator-package.md)
  — **NEW 2026-09-03** — cross-tab primitive (Web Locks + BroadcastChannel).
  Referenced by `@stackra/events` (cross-tab relay) + `@stackra/realtime`
  (leader-only WebSocket). 18-day plan.
- [`.kiro/plans/2026-09-03-settings-package.md`](./2026-09-03-settings-package.md)
  — **NEW 2026-09-03** — runtime user-editable settings with schema-driven admin
  UI. Distinct from `@stackra/config` (developer / build-time). 24-day plan.

**2026-09-03 addendum — cloud secrets + cross-tab + settings:**

- **`@stackra/config` amended** to add 4 optional cloud-secret drivers:
  `doppler` (full API), `aws-secrets`, `gcp-secrets`, `vault`. Phase 2b added
  (+4 days → 20 days total). New "Source-per-concern composition" section
  documents the reference layer stack
  (`static → env → doppler → aws-secrets → http`); `.secret()` schema marker
  forbids resolution from `static` / `env` (dev-mode exception).
- **`@stackra/events` cross-tab relay** — DELEGATED to `@stackra/coordinator`.
  Phase 5 in the events plan reduced to a delegation note; the old
  `CrossTabAdapter` is retired.
- **`@stackra/realtime` "cross-tab" connector** — now composes
  `@stackra/coordinator` (was raw `broadcast-channel.connector.ts`). Leader tab
  holds the WebSocket; followers subscribe via BroadcastChannel. New
  §"Leader-only WebSocket pattern" section documents the wiring.

Task changes summarised at the end of this amendment block:

- **Task 1 (all subtasks 1.1 → 1.14)** — ✅ **COMPLETE 2026-09-03**.
  `@stackra/testing@1.0.0` ships with 13 subpath exports (`.`, `/preset`,
  `/preset/base`, `/preset/nest`, `/preset/worker`, `/preset/react`,
  `/matchers`, `/setup`, `/nest`, `/worker`, `/database`, `/react`,
  `/react/setup`). Build + typecheck + 185/185 unit tests green. Consumer
  migration landed (`services/approval` → `preset/nest`; `apps/portal` +
  `apps/landing-page` → `preset/react`;
  `services/approval/vitest.config.base.ts` deleted). Root `package.json` gained
  turbo filter scripts `test:packages` / `test:workers` / `test:services` /
  `test:apps`. Package README documents every subpath.
- **Task 2** — expanded (§Task 2 amendment below). Per-template `.vscode/`,
  `.kiro/`, `AGENTS.md`, `CLAUDE.md`; root `.vscode/workspaces/*.code-workspace`
  multi-root files with emoji names.
- **Task 3.3** — recommended scripts (audit-repos, sync-branches,
  prune-stale-branches, audit-env-naming, rename-env-vars, doppler-bind,
  audit-package-shapes, audit-doppler, audit-ulid-prefixes, check-i18n-parity) —
  **SKIPPED** per operator direction. The `_lib` catalogue documentation (Task
  3.1 + 3.2) stays; script authoring defers indefinitely.
- **Tasks 11 + 12** — REFINED. The full `@stackra/database` architecture now
  lives in
  [`.kiro/plans/2026-09-03-database-package.md`](./2026-09-03-database-package.md).
  Task 11 + Task 12 in THIS file remain the summary; the sibling plan is the
  source of truth for entity decorators, migration builder API, D1 fallback
  strategy, and the 11-phase rollout.

## Table of contents

1. [Testing package + Vitest vs Jest decision](#task-1--stackratesting-vitest-preset-package)
2. [`.templates/` scaffolds for service / worker / package / app](#task-2--templates-scaffolds)
3. [`scripts/_lib` documentation + candidate scripts](#task-3--scripts_lib-and-scripts-catalogue)
4. [`.kiro` triage — keep base, ship the rest to `.ref/`](#task-4--kiro-triage)
5. [Enterprise review of root config files](#task-5--enterprise-review-of-root-config-files)
6. [`@stackra/contracts` architecture](#task-6--stackracontracts-architecture)
7. [Config-package standardisation + tsup-config's TS source](#task-7--config-package-standardisation)
8. [Infrastructure `.generated/` folder + Terraform / Docker alignment](#task-8--infrastructure-generated--terraform--docker-alignment)
9. [Move `ENVIRONMENT-STANDARD.md` into `.docs/` as an ADR](#task-9--move-environment-standardmd-into-docs-as-an-adr)
10. [`infrastructure/infrastructure.mk` as the single include point](#task-10--infrastructureinfrastructuremk-as-the-single-include-point)
11. [`@stackra/database` package with MikroORM + D1 story](#task-11--stackradatabase-package-mikroorm--d1)
12. [Migration base class + query-builder story](#task-12--migration-abstract-class--query-builder)
13. [Cross-cutting rollout order](#cross-cutting-rollout-order)

---

## Task 1 — `@stackra/testing` Vitest preset package

### Decision — Vitest, not Jest

**Vitest wins on every axis that matters for this workspace.** The steering doc
[`testing.md`](../steering/testing.md) already locks it, and the evidence in the
workspace confirms the choice was correct:

- **Native ESM + TypeScript.** The workspace is `"type": "module"` end-to-end;
  Jest still requires `ts-jest` + custom ESM shims. Vitest reads `tsconfig.json`
  via `vite-tsconfig-paths` and executes TS directly.
- **SWC-driven decorator metadata.** NestJS services need
  `emitDecoratorMetadata: true` at runtime. Vitest composes cleanly with
  `unplugin-swc` (already in the catalog); the pattern is proven in
  `services/approval/vitest.config.base.ts`. Jest's decorator story requires
  Babel transforms that fight `nest build`.
- **Cloudflare Worker parity.** Vitest's `@cloudflare/vitest-pool-workers` pool
  runs tests inside `workerd` — the same runtime the Worker deploys to. Jest
  cannot do this.
- **HMR-style watch mode + browser mode.** Vitest 4 ships fast watch + native
  browser mode for component tests. Jest's watch mode is noticeably slower on
  workspaces this size.
- **Coverage via c8 / v8** (`@vitest/coverage-v8`) matches the platform (Node
  24). No `jest-babel-plugin-istanbul` maintenance.
- **API compat.** `describe/it/expect` are byte-identical. Migrating from Jest
  to Vitest is a search-and-replace. The reverse would be a rewrite.
- **React Native carve-out** — `apps/family` runs Jest today because Metro +
  `jest-expo` are still the RN reality. That's the ONE exception. Every other
  package/worker/service uses Vitest.

### Decision — YES, ship a `@stackra/testing` framework-testing package

Every framework (Laravel, Rails, Nest, Angular) ships a testing package. The
workspace already references `@stackra/testing` as `workspace:*` from
`packages/contracts/package.json` and `services/approval/package.json` — the
package is a MISSING dependency, not a proposed one. Ship it.

The package plays TWO roles the Laravel `Illuminate\Testing` package plays:

1. **A shared Vitest preset** — one `vitest.config.ts` merged into every
   package/service/worker/app. Consumers write:

   ```ts
   import preset from "@stackra/testing/preset";
   import { defineConfig, mergeConfig } from "vitest/config";
   export default mergeConfig(
     preset,
     defineConfig({/* per-package overrides */}),
   );
   ```

2. **A shared test-authoring toolkit** — factory builders, assertable proxies
   (already used by `packages/logger/src/testing/index.ts`), HTTP fixtures for
   NestJS + Fastify, D1 fixtures for Workers, Postgres `PGlite` fixtures for
   services, DI container helpers, `@stackra/contracts`-shaped mocks.

### Package shape

```
packages/testing/
├── catalog.json
├── package.json
├── README.md
├── tsconfig.json
├── tsup.config.ts               # builds core/, nest/, worker/, react/
├── vitest.config.ts             # dogfood — tests the preset itself
└── src/
    ├── preset/                  # subpath: "@stackra/testing/preset"
    │   ├── base.ts              # jsdom-optional + coverage-v8 baseline
    │   ├── nest.ts              # + unplugin-swc + globals: true
    │   ├── worker.ts            # + @cloudflare/vitest-pool-workers pool
    │   ├── react.ts             # + jsdom + testing-library setup
    │   └── native.ts            # + jest-expo shim for RN (not used yet)
    ├── core/                    # subpath: "@stackra/testing"
    │   ├── factories/           # base FactoryBuilder + sequence, faker helpers
    │   ├── assertable/          # createAssertableProxy (already consumed)
    │   ├── containers/          # DI helpers for @stackra/container
    │   ├── fixtures/            # generic time / clock / rng fixtures
    │   └── matchers/            # custom expect() matchers
    ├── nest/                    # subpath: "@stackra/testing/nest"
    │   ├── module.ts            # TestingModule builder wrapper
    │   ├── fastify-app.ts       # NestFastifyApplication test host
    │   ├── supertest.ts         # supertest wrapper w/ typed helpers
    │   └── outbox.ts            # transactional-outbox test harness
    ├── worker/                  # subpath: "@stackra/testing/worker"
    │   ├── worker-fetch.ts      # Miniflare-driven fetch helper
    │   ├── d1-fixture.ts        # test-scoped D1 database
    │   ├── kv-fixture.ts        # test-scoped KV namespace
    │   └── durable-object.ts    # DO test harness
    ├── database/                # subpath: "@stackra/testing/database"
    │   ├── pglite.ts            # in-process Postgres via pglite
    │   ├── transaction.ts       # per-test transaction rollback
    │   └── mikro-orm.ts         # MikroORM test EntityManager helper
    └── react/                   # subpath: "@stackra/testing/react"
        ├── render.ts            # RTL render + workspace providers
        └── user-events.ts       # @testing-library/user-event re-export
```

### Exports map

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.mjs",
      "require": "./dist/core/index.js",
    },
    "./preset": {
      "types": "./dist/preset/base.d.ts",
      "import": "./dist/preset/base.mjs",
      "require": "./dist/preset/base.js",
    },
    "./preset/nest": {/* ... */},
    "./preset/worker": {/* ... */},
    "./preset/react": {/* ... */},
    "./nest": {/* ... */},
    "./worker": {/* ... */},
    "./database": {/* ... */},
    "./react": {/* ... */},
  },
}
```

### Tasks

- [x] **1.1** — Scaffold `packages/testing/` per
      `.kiro/steering/package-conventions.md` §"Frontend tooling standards" —
      `package.json`, `catalog.json`, `tsconfig.json` (extends
      `@stackra/typescript-config/base`), `tsup.config.ts` (calls
      `defineBaseConfig` with the multi-entry map), `vitest.config.ts` (dogfoods
      `./src/preset/base.ts`), `README.md`. Author: `framework-core-builder`.
      _(Landed 2026-09-03. `@stackra/testing@1.0.0` scaffolded with 13 subpath
      exports; `sideEffects` whitelists `setup/index` + `react/setup` +
      `preset/react`; `@cloudflare/workers-types` added as optional peer after
      DTS build revealed `create-do-harness.ts` needed it.)_
- [x] **1.2** — Move the ad-hoc `createAssertableProxy` (currently referenced
      from `packages/logger/src/testing/index.ts`) into
      `src/core/assertable/create-assertable-proxy.ts`. Author:
      `framework-core-builder`. _(Landed 2026-09-03. Public API preserved via
      `AssertableProxy` type + `IAssertionApi` + `IRecordedCall` interfaces;
      both the modern `.$` API and legacy `.assertCalled` / `.getCalls` /
      `.reset` shape kept. Covered by 342-line
      `__tests__/unit/assertable.test.ts`.)_
- [x] **1.3** — Author `src/preset/base.ts` — jsdom-optional + coverage-v8
      defaults + `passWithNoTests: true` +
      `include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts']`. Author:
      `framework-core-builder`. _(Landed 2026-09-03.)_
- [x] **1.4** — Author `src/preset/nest.ts` — extends base + `unplugin-swc` +
      `globals: true` + `oxc: false, esbuild: false` (the same shape as
      `packages/contracts/vitest.config.ts` calls out). Author:
      `framework-core-builder`. _(Landed 2026-09-03. `pool: "forks"` +
      `testTimeout: 30_000` for Nest bootstrap headroom; `defineConfig` arg cast
      to `any` to bypass Vitest 4's narrowed `poolOptions` overload — runtime
      shape unchanged, DTS emit uncorked.)_
- [x] **1.5** — Author `src/preset/worker.ts` — extends base +
      `@cloudflare/vitest-pool-workers` pool + a default `wrangler.jsonc`
      locator. Author: `framework-core-builder`. _(Landed 2026-09-03. Exports
      `createWorkerPreset(opts)` factory + default. Same `as any` cast pattern
      for `defineWorkersConfig` + inner `defineConfig`; `nodejs_compat` flag on
      by default; `outboundNetworkAccess: false` locks tests to Miniflare-only
      fetch unless explicitly opted in.)_
- [x] **1.6** — Author `src/preset/react.ts` — extends base +
      `environment: 'jsdom'` + `setupFiles: ['@stackra/testing/react/setup']`.
      Author: `framework-core-builder`. _(Landed 2026-09-03.)_
- [x] **1.7** — Author `src/nest/*.ts` — TestingModule wrapper,
      NestFastifyApplication host, supertest helper. Author:
      `framework-core-builder`. _(Landed 2026-09-03. Seven files:
      `create-testing-module`, `build-fastify-test-app`, `supertest-client`,
      `outbox-harness`, `create-nest-test-context`, `testing-context.interface`,
      barrel.)_
- [x] **1.8** — Author `src/worker/*.ts` — Miniflare fetch helper, D1 fixture,
      KV fixture, DO harness. Uses `@cloudflare/workers-types` + `miniflare`.
      Author: `framework-core-builder`. _(Landed 2026-09-03. Five files:
      `create-worker-fetch`, `create-d1-fixture` (per-test SQLite + reset),
      `create-kv-fixture` (per-test KV), `create-do-harness` (DO namespace
      fetcher via `idFromName`), barrel.)_
- [x] **1.9** — Author `src/database/*.ts` — PGlite fixture + per-test
      transaction rollback + MikroORM `EntityManager` fork helper. Cross-refs
      Task 11. Author: `framework-core-builder`. _(Landed 2026-09-03. Four
      files: `create-pglite-database` (`@electric-sql/pglite` +
      schema/migrations + reset()), `with-transaction` (BEGIN/ROLLBACK,
      savepoint-nested-safe), `create-test-entity-manager` (MikroORM EM fork +
      begin + commit/rollback handle), barrel.)_
- [x] **1.10** — Author `src/core/factories/*.ts` — `defineFactory`, `Sequence`,
      `Rng` (deterministic seed for CI), faker re-exports pinned to `catalog:`.
      Author: `framework-core-builder`. _(Landed 2026-09-03. `Rng` uses
      mulberry32; `Sequence` returns monotonic + wraps; `defineFactory` shape
      mirrors thoughtbot/factory-bot's build/create API. Covered by 333-line
      `factories.test.ts` + 195-line `rng.test.ts` + 69-line
      `sequence.test.ts`.)_
- [x] **1.11** — Add `@stackra/testing` to `pnpm-workspace.yaml` catalog if
      consumed by workspace ranges (currently `workspace:*` only, so no catalog
      entry needed). Author: `workspace-standardization-steward`. _(No-op —
      consumers use `"workspace:*"` per convention. `pnpm-workspace.yaml` DID
      gain 7 new catalog entries for `@stackra/testing`'s optional peer deps
      (`@cloudflare/vitest-pool-workers`, `@electric-sql/pglite`,
      `@faker-js/faker`, `@testing-library/jest-dom`,
      `@testing-library/user-event`, `miniflare`, `ulid`) — that's Task 1.11's
      spiritual work.)_
- [x] **1.12** — Sweep every existing `vitest.config.ts` in `apps/*/`,
      `services/*/`, `workers/*/`, `packages/*/` and migrate to
      `mergeConfig(preset, defineConfig({...}))`. Author: `vitest-test-engineer`
      after 1.3–1.6 land. _(Landed 2026-09-03.
      `services/approval/vitest.config.{ts,e2e.ts}` → `preset/nest`;
      `services/approval/vitest.config.base.ts` deleted.
      `apps/portal/vitest.config.ts` + `apps/landing-page/vitest.config.ts` →
      `preset/react`. `packages/contracts` + `packages/pipeline` already merged
      the preset default. `apps/family` stays on Jest per
      `.kiro/steering/testing.md`. Workers migration deferred until a live
      worker replaces `workers/example/`.)_
- [x] **1.13** — Add root `pnpm run test:packages` and `pnpm run test:workers`
      scripts (turbo filters). Author: `docs-changesets-steward`. _(Landed
      2026-09-03. Added four filter scripts to the workspace root
      `package.json`: `test:packages` (`./packages/*`), `test:workers`
      (`./workers/*`), `test:services` (`./services/*`), `test:apps`
      (`./apps/*`). Verified via `pnpm test:packages --dry-run`.)_
- [x] **1.14** — Author `packages/testing/README.md` per `documentation.md` —
      every subpath documented with a copy-pasteable snippet + link to
      `.kiro/steering/testing.md`. Author: `docs-changesets-steward`. _(Landed
      2026-09-03. Every subpath — `@stackra/testing`, `/preset`, `/preset/base`,
      `/preset/nest`, `/preset/worker`, `/preset/react`, `/matchers`, `/setup`,
      `/nest`, `/worker`, `/database`, `/react`, `/react/setup` — documented
      with a copy-pasteable snippet.)_

### Cross-refs

- [`.kiro/steering/testing.md`](../steering/testing.md)
- [`.kiro/steering/subpath-layering.md`](../steering/subpath-layering.md) —
  every subpath under `src/<subdomain>/`.
- [`.kiro/steering/package-conventions.md`](../steering/package-conventions.md)
  §"Frontend tooling standards".

---

## Task 2 — `.templates/` scaffolds

### Decision — one `.templates/` folder at repo root, four canonical shapes

Templates are NOT deployables (see `doppler.md` §"Templates under `templates/`
are NOT deployables"). Keep them at repo root so bootstrap scripts
(`pnpm bootstrap:*`) can `cp -R` them into `services/<name>/`,
`workers/<name>/`, etc.

**Choice of folder name — use `.templates/` (leading dot).** Matches the
existing workspace convention for tooling folders (`.kiro/`, `.docs/`,
`.husky/`, `.changeset/`, `.generated/`). Reviewers scan hidden folders as
"workspace substrate, not product code".

### Templates to author

| Kind                | Location                 | Shape                                                                                                                    |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Service (NestJS)    | `.templates/service/`    | Fastify + NestJS 12 + `@stackra/testing/preset/nest` + `@stackra/database/nest` (Task 11) + Doppler binding + Dockerfile |
| Worker (D1)         | `.templates/worker/`     | Hono + `@stackra/testing/preset/worker` + `wrangler.jsonc` + D1 migration folder + `worker-configuration.d.ts`           |
| Package (framework) | `.templates/package/`    | `@stackra/*` library — tsup dual-format build, subpath layering, catalog, README, changesets                             |
| Vite SPA            | `.templates/app-vite/`   | React 19 + Vite 8 + HeroUI + `@stackra/testing/preset/react` + Playwright config                                         |
| RN app (Expo)       | `.templates/app-native/` | Expo + `apps/family` shape — deferred; Jest still lives here                                                             |

Each template ships with:

- `AGENTS.md` / `CLAUDE.md` — first-file-agents-read pointer.
- Every file the shape mandates (per `package-json-conventions.md`).
- Placeholder tokens (`{{PACKAGE_NAME}}`, `{{PACKAGE_SCOPE}}`, `{{PORT}}`) the
  bootstrap scripts replace at copy time.
- A `catalog.json` skeleton per `.kiro/steering/catalog-manifest.md`.
- A `cloud.yaml` skeleton (empty for templates, populated at scaffold time) —
  templates are NOT deployables per `doppler.md`, but the shape must be there.

### Per-repo editor + AI-agent files (each template)

Every template additionally ships a per-repo agent + IDE bundle so that when
`pnpm bootstrap:*` copies the template into `services/<name>/`,
`workers/<name>/`, `packages/<name>/`, or `apps/<name>/`, the destination is
IMMEDIATELY promotable to its own git repo (per the workspace's split-repo
roadmap):

| File                      | Purpose                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `AGENTS.md`               | Universal AI-agent entry point (mirrors root `AGENTS.md` with per-repo scope).                      |
| `CLAUDE.md`               | Symlink or one-line reference to `AGENTS.md`.                                                       |
| `.kiro/steering/INDEX.md` | Per-repo steering index (points at parent workspace `.kiro/steering/` by default).                  |
| `.kiro/agents/README.md`  | Per-repo agent charter (which sub-agents own THIS repo's scope).                                    |
| `.vscode/settings.json`   | Per-repo VS Code settings (typescript.tsdk, prettier config path, deno.enable=false).               |
| `.vscode/extensions.json` | Recommended extensions (esbenp.prettier-vscode, vitest.explorer, dbaeumer.vscode-eslint, etc.).     |
| `.vscode/launch.json`     | Debug configurations per template kind (Node inspector for service; wrangler dev for worker; etc.). |
| `.vscode/tasks.json`      | Common tasks (test, build, dev, deploy) wired to `pnpm --filter`.                                   |
| `README.md`               | Per-repo README with quick-start commands.                                                          |

### Root `.vscode/workspaces/` multi-root files (emoji-named)

At the workspace ROOT (not per-template), we author FIVE multi-root VS Code
workspace files that group folders by concern. Every entry uses an emoji + a
scannable name so the VS Code welcome view + Cmd+K Cmd+P recent-workspaces list
communicate scope at a glance:

```
.vscode/
└── workspaces/
    ├── 🏠 monorepo-agentic-core.code-workspace   # everything — the AI development core
    ├── 📱 mobile.code-workspace                   # apps/family + apps/portal (RN + Vite)
    ├── ⚙️  services.code-workspace                # services/* (NestJS)
    ├── ⚡ workers.code-workspace                  # workers/* (Cloudflare Workers)
    └── 📦 packages.code-workspace                 # packages/* (framework libraries)
```

Each `.code-workspace` file:

- Includes the workspace root as folder #0 (so `.kiro/`, `.docs/`,
  `pnpm-workspace.yaml`, top-level scripts stay accessible).
- Includes the relevant sub-folders as additional folders (e.g. mobile includes
  `apps/family` + `apps/portal`).
- Ships `settings` — Prettier config path, TypeScript SDK path
  (`node_modules/typescript/lib`), search excludes (`dist`, `.turbo`,
  `.generated`), file-nesting patterns.
- Ships `launch` — per-workspace debug configurations composed via `compounds`
  from each folder's `.vscode/launch.json`.
- Ships `tasks` — same composition for tasks.
- Ships `extensions.recommendations` — the union of every folder's
  recommendations.

Example — `⚙️ services.code-workspace`:

```json
{
  "folders": [
    { "name": "🏠 workspace-root", "path": "../.." },
    { "name": "⚙️ approval", "path": "../../services/approval" }
  ],
  "settings": {
    "typescript.tsdk": "node_modules/typescript/lib",
    "prettier.configPath": "../../.prettierrc",
    "eslint.workingDirectories": ["services/approval"]
  },
  "extensions": {
    "recommendations": [
      "esbenp.prettier-vscode",
      "vitest.explorer",
      "dbaeumer.vscode-eslint"
    ]
  }
}
```

### Tasks

- [ ] **2.1** — Create `.templates/` folder + add to `.prettierignore`
      (templates carry placeholder tokens that Prettier chokes on) and to
      `.gitignore` allowlist (they ARE committed). Author:
      `workspace-standardization-steward`.
- [ ] **2.2** — Scaffold `.templates/service/` — copy the shape of
      `services/approval/` (nest-cli.json, tsconfig.build.json, `__tests__/`,
      Dockerfile, docblocked package.json). Author: `framework-core-builder`.
- [ ] **2.3** — Scaffold `.templates/worker/` — copy the shape of
      `workers/registry/` (wrangler.jsonc, worker-configuration.d.ts,
      `__tests__/`, database migration folder). Author:
      `framework-core-builder`.
- [ ] **2.4** — Scaffold `.templates/package/` — copy `packages/contracts/`
      shape (per `package-conventions.md`). Author: `framework-core-builder`.
- [ ] **2.5** — Scaffold `.templates/app-vite/` — copy `apps/portal/` shape
      (vite.config.ts, playwright.config.ts, index.html, `src/main.tsx`).
      Author: `heroui-ui-builder`.
- [ ] **2.6** — Defer `.templates/app-native/` — track as a Phase 2 task; RN
      template ships when Expo Router + `heroui-native-pro` shape stabilises.
      Author: none for now.
- [ ] **2.7** — For every template above, add the per-repo agent + IDE bundle:
      `AGENTS.md`, `CLAUDE.md`, `.kiro/steering/INDEX.md`,
      `.kiro/agents/README.md`, `.vscode/settings.json`,
      `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/tasks.json`,
      `README.md`. Author: `framework-core-builder`.
- [ ] **2.8** — Author root `.vscode/workspaces/` folder + FIVE multi-root
      workspace files: `🏠 monorepo-agentic-core.code-workspace`,
      `📱 mobile.code-workspace`, `⚙️ services.code-workspace`,
      `⚡ workers.code-workspace`, `📦 packages.code-workspace`. Each composes
      `folders[]`, `settings`, `launch.compounds`, `tasks`, and
      `extensions.recommendations`. Author: `workspace-standardization-steward`.
- [ ] **2.9** — Add root `.vscode/settings.json` — workspace-wide defaults
      (typescript.tsdk, prettier configPath, files.exclude for
      `dist`/`.turbo`/`.generated`, file-nesting patterns). Author:
      `workspace-standardization-steward`.
- [ ] **2.10** — Add root `.vscode/extensions.json` — recommended extensions
      applied to every `.code-workspace` in the workspace. Author:
      `workspace-standardization-steward`.
- [ ] **2.11** — Author `scripts/bootstrap-service.mjs`,
      `scripts/bootstrap-worker.mjs`, `scripts/bootstrap-package.mjs`,
      `scripts/bootstrap-app.mjs`. Each takes `--name`, `--scope`, `--dest`,
      replaces placeholder tokens, wires the deployable's `.doppler.yaml`, AND
      adds the new deployable to the matching
      `.vscode/workspaces/*.code-workspace` `folders[]` array. Author:
      `framework-core-builder`.
- [ ] **2.12** — Wire the bootstrap scripts under `package.json` root scripts
      (`bootstrap:service`, `bootstrap:worker`, `bootstrap:package`,
      `bootstrap:app`). Author: `docs-changesets-steward`.
- [ ] **2.13** — Author `.templates/README.md` explaining the shape rules + how
      to bootstrap + how each template's per-repo bundle rolls up to the
      split-repo roadmap. Author: `docs-changesets-steward`.
- [ ] **2.14** — Author `.vscode/workspaces/README.md` — one section per
      code-workspace, describing what's in scope + when to open which. Author:
      `docs-changesets-steward`.

### Cross-refs

- [`.kiro/steering/doppler.md`](../steering/doppler.md) §"Templates under
  `templates/` are NOT deployables".
- [`.kiro/steering/package-conventions.md`](../steering/package-conventions.md).
- [`.kiro/steering/package-json-conventions.md`](../steering/package-json-conventions.md).

---

## Task 3 — `scripts/_lib` and scripts catalogue

### What `scripts/_lib/` is

`scripts/_lib/` is the shared Node.js toolkit every `scripts/*.mjs` composes.
It's a private, workspace-internal library — never published, never imported by
runtime code. Modules:

| Module                 | Owns                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `_lib/log.mjs`         | Coloured, timestamped stdout/stderr (`log.info` / `log.warn` / `log.error` / `log.section`).     |
| `_lib/reporter.mjs`    | Pass/fail/warn tally + printed summary + non-zero exit-code discipline (`new Reporter(name)`).   |
| `_lib/cli.mjs`         | Typed CLI flag parsing (`parseArgs({ flags: { dryRun: 'boolean', only: 'string' } })`).          |
| `_lib/shell.mjs`       | Spawn-based `sh(cmd, args)` and `shOk(cmd, args)` — NO shell, no word-splitting, cross-platform. |
| `_lib/http.mjs`        | `httpJson(url, opts)` + `HttpError` — the workspace's fetch wrapper.                             |
| `_lib/concurrency.mjs` | `pool(items, N, fn)` + `poolOk` — bounded parallel iteration.                                    |
| `_lib/fs-walk.mjs`     | `walkGitRepos(root)` — enumerates every git repo under a base dir.                               |
| `_lib/gitlab.mjs`      | GitLab REST v4 wrapper (protected branches, MR API, tags, releases).                             |
| `_lib/paths.mjs`       | Workspace path constants (`REPO_ROOT`, `PACKAGES_DIR`, etc.).                                    |
| `_lib/env-naming.mjs`  | The Layer 1 canonical env-name map from `env-naming.md` §Rule 4.                                 |
| `_lib/repos.mjs`       | `WORKSPACE_REPOS` inventory (used by cross-repo fan-out scripts).                                |
| `_lib/index.mjs`       | Barrel — re-exports the public functions.                                                        |

### Recommended new scripts

Ordered by ROI. Every script uses `_lib/index.mjs` for consistency.

| Script                                   | Owns                                                                                                    | Priority     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| `scripts/audit-repos.mjs`                | Read-only cross-repo audit per `repo-hygiene.md` (git status, GitLab MRs, orphan branches).             | P0           |
| `scripts/sync-branches.mjs`              | Fast-forward tracker branches (`develop`, `staging`) to source. `--dry-run` / `--execute` gate.         | P0           |
| `scripts/prune-stale-branches.mjs`       | Delete merged remote feature branches on GitLab. `--dry-run` / `--execute` gate.                        | P0           |
| `scripts/audit-env-naming.mjs`           | Enforce ADR-0085 env-var naming across every `.env.example`, `wrangler.toml`, `terraform/**`.           | P0           |
| `scripts/rename-env-vars.mjs`            | The mechanical fixer for `audit-env-naming` findings.                                                   | P1           |
| `scripts/doppler-bind.mjs`               | Fan-out `doppler setup` across every `.doppler.yaml` in the workspace (per `doppler.md`).               | P0           |
| `scripts/check-docblocks.mjs`            | Already referenced by `package.json`; docblock enforcement per `documentation.md`.                      | P0 (exists?) |
| `scripts/check-messaging-contracts.mjs`  | Cross-service event catalogue enforcement per `cross-service-events.md`.                                | P0 (exists?) |
| `scripts/check-package-catalogs.mjs`     | Every package ships a `catalog.json` per `catalog-manifest.md`.                                         | P0 (exists?) |
| `scripts/check-export-maps.mjs`          | Every package's `exports` matches `tsup.config.ts` entries.                                             | P0 (exists?) |
| `scripts/check-dependency-policy.mjs`    | Third-party deps use `catalog:`, internal peers use `workspace:^`, devDeps use `workspace:*`.           | P0 (exists?) |
| `scripts/check-local-packages.mjs`       | Every workspace member's manifest passes the tier check.                                                | P0 (exists?) |
| `scripts/validate-workers-structure.mjs` | Every worker ships wrangler.jsonc + worker-configuration.d.ts + the canonical folders.                  | P0 (exists?) |
| `scripts/check-yaml.mjs`                 | Every YAML file (`cloud.yaml`, `catalog.yaml`, etc.) validates against its schema.                      | P0 (exists?) |
| `scripts/check-toolchain.mjs`            | Every workstation runs Node 24 + pnpm 11.25 + `packageManager` matches root.                            | P0 (exists?) |
| `scripts/check-control-planes.mjs`       | Every service's control-plane surface (health, readiness, metrics) is present.                          | P0 (exists?) |
| `scripts/check-terraform-policy.mjs`     | Terraform policy (no hard-coded secrets, no unversioned providers).                                     | P0 (exists?) |
| `scripts/generate-workspace-shims.py`    | Per-workspace clean-shim generator (already exists per `clean.mjs` docblock).                           | P1 (exists?) |
| `scripts/audit-package-shapes.mjs`       | Every package matches its tier's canonical shape (delegates to `frontend-package-auditor` rules).       | P1           |
| `scripts/audit-doppler.mjs`              | Every deployable ships one `.doppler.yaml` at its root per `doppler.md`.                                | P2           |
| `scripts/audit-ulid-prefixes.mjs`        | Every aggregate carries a 3-letter ULID prefix per `.kiro/steering/ulid-prefix-registry.md`.            | P2           |
| `scripts/check-i18n-parity.mjs`          | Every package's `src/core/i18n/en.json` + `ar.json` have 1:1 key parity per `frontend-localization.md`. | P2           |

Note — the "exists?" rows are scripts referenced by `package.json` but haven't
been enumerated in this session. Task 3.1 below is to catalogue what's there and
what's a stub.

### Tasks

- [ ] **3.1** — Enumerate every `scripts/*.mjs` file referenced by
      `package.json` (currently 19 references) — mark existing / stubbed /
      missing. Author: `docs-changesets-steward`.
- [ ] **3.2** — Re-write `scripts/README.md` per
      `.kiro/steering/documentation.md` — one section per module in `_lib/`, one
      section per top-level script, snippet per script, cross-refs to steering.
      Author: `docs-changesets-steward`.
- [~] **3.3** — Author the P0 scripts named above that don't exist yet. One PR
  per script. Author: `framework-core-builder`. **SKIPPED 2026-09-03** per
  operator direction. The `_lib` documentation (3.1 + 3.2) stays; the
  recommended new scripts (audit-repos, sync-branches, prune-stale-branches,
  audit-env-naming, rename-env-vars, doppler-bind, audit-package-shapes,
  audit-doppler, audit-ulid-prefixes, check-i18n-parity) defer indefinitely.
  Existing scripts referenced by `package.json` remain functional.
- [ ] **3.4** — Add a `scripts/_lib/testing.mjs` helper for unit-testing `.mjs`
      scripts (thin Vitest wrapper). Author: `vitest-test-engineer`.
- [ ] **3.5** — Move the ad-hoc `clean.mjs` to compose `_lib/` (its docblock
      already flags this as follow-up). Author: `framework-core-builder`.
- [ ] **3.6** — Add per-script tests under `scripts/__tests__/`. Author:
      `vitest-test-engineer`.

### Cross-refs

- [`.kiro/steering/shell-commands.md`](../steering/shell-commands.md).
- [`.kiro/steering/repo-hygiene.md`](../steering/repo-hygiene.md).
- [`.kiro/steering/env-naming.md`](../steering/env-naming.md).

---

## Task 4 — `.kiro` triage

### Current state

`.kiro/steering/` has **62 files**, `.kiro/agents/` has **60 files**. The
workspace legitimately needs the base substrate (rule set of record) — but 62
steering docs is too heavy for a workspace that's still setting foundational
config. Many are aspirational (mobile-focused, brand-hierarchy heavy, RN review
checklists) or session-specific (waves N of a specific frontend refactor that
predates this workspace).

### Decision — a two-tier split

Move the aspirational / not-yet-active docs to `.ref/steering/` and
`.ref/agents/` for later review. Keep the foundational / active docs in
`.kiro/steering/` and `.kiro/agents/`. Two-tier lets the AI-agent context stay
lean while preserving the reference material.

### Steering docs to KEEP in `.kiro/steering/`

The base 18 the workspace uses today (every task in this file cites one of
these):

- `INDEX.md`
- `AGENTS.md` (if present at .kiro root)
- `priority-ordering.md`
- `conventions.md`
- `code-standards.md`
- `commit-conventions.md`
- `documentation.md`
- `testing.md`
- `shell-commands.md`
- `tmp-files.md`
- `catalog-manifest.md`
- `package-conventions.md`
- `package-json-conventions.md`
- `package-naming.md`
- `subpath-layering.md`
- `contract-reexports.md`
- `contract-implementer-split.md`
- `contracts-and-decorators-promotion.md`
- `changesets-flow.md`
- `doppler.md`
- `env-naming.md`
- `brand-hierarchy.md`
- `hierarchy.md`
- `tenancy-columns.md`
- `data-ownership.md`
- `cross-service-events.md`
- `service-boundary.md`
- `communication-patterns.md`
- `discovery-vs-loader.md`
- `module-lifecycle.md`
- `provenance-frontmatter.md`
- `ai-agent-governance.md`

### Steering docs to MOVE to `.ref/steering/`

The aspirational / product-specific / not-yet-scoped for this repo:

- `auth-tenancy-composition.md` (auth is not scaffolded yet)
- `brand-system.md`
- `browser-safe-imports.md` (frontend-scoped; move back when SPA lands)
- `canonical-deployable-slug.md`
- `cloudflare-conventions.md` (move back once workers land in production)
- `dashboard-widgets.md`
- `events-authoring.md` (move back when events package lands)
- `frontend-localization.md`
- `frontend-module-architecture.md`
- `frontend-package-audit-checklist.md`
- `frontend-packages.md`
- `growth-and-observability.md`
- `growth-signals.md`
- `heroui-pro-license.md` (move back when HeroUI lands)
- `localization-content-strategy.md`
- `module-graph.md`
- `module-partitioning.md`
- `navigation-catalog.md`
- `observability-signals.md`
- `react-native-package-audit-checklist.md`
- `repo-hygiene.md` (move back when cross-repo fan-out lands)
- `scope.md`
- `state-storage-coordinator-standard.md`
- `storage-usage.md`
- `support-utilities.md` (move back when `@stackra/support` lands)
- `ui-components.md`
- `ulid-prefix-registry.md`
- `zones-catalog.md`

### Agents to KEEP in `.kiro/agents/`

Base 15:

- `INDEX.md`
- `README.md`
- `ROUTING.md`
- `framework-core-builder.md`
- `code-standards-steward.md`
- `code-documentation-writer.md`
- `docs-adr-steward.md`
- `docs-changesets-steward.md`
- `env-naming-steward.md`
- `package-api-release-reviewer.md`
- `security-compliance-reviewer.md`
- `support-utilities-steward.md`
- `vitest-test-engineer.md`
- `workspace-standardization-steward.md`
- `frontend-package-auditor.md`

Every OTHER agent moves to `.ref/agents/` — they're aspirational (product-lead,
design-lead, quality-lead, etc.), reviewer-only (mlops-reviewer,
ui-design-a11y-reviewer), or product-line-specific (en-copy-editor,
ar-native-reviewer, ru-native-reviewer, stackra-product).

### Tasks

- [ ] **4.1** — Create `.ref/steering/` + `.ref/agents/` folders. Author:
      `workspace-standardization-steward`.
- [ ] **4.2** — Move the 29 aspirational steering docs from `.kiro/steering/` →
      `.ref/steering/`. `git mv` per file to preserve history. Author:
      `workspace-standardization-steward`.
- [ ] **4.3** — Move the 45 aspirational agent charters from `.kiro/agents/` →
      `.ref/agents/`. Author: `workspace-standardization-steward`.
- [ ] **4.4** — Author `.kiro/steering/INDEX.md` reflecting the new lean base
      set. Author: `docs-changesets-steward`.
- [ ] **4.5** — Author `.kiro/agents/INDEX.md` + `.kiro/agents/ROUTING.md`
      reflecting the new lean base set. Author: `docs-changesets-steward`.
- [ ] **4.6** — Author `.ref/README.md` explaining "these are the aspirational
      docs — promoted back into `.kiro/` when the concern lands". Author:
      `docs-changesets-steward`.
- [ ] **4.7** — Update every cross-reference in the KEPT docs to fix broken
      links (dropped docs that used to be linked). Author:
      `docs-changesets-steward`.
- [ ] **4.8** — Add a `.ref` allowlist entry to `.gitleaks.toml` (already
      present) and to `.prettierignore` (already present) — confirm they cover
      the newly-populated `.ref/steering/` + `.ref/agents/` subfolders. Author:
      `workspace-standardization-steward`.

---

## Task 5 — Enterprise review of root config files

### Findings per file

#### `.changeset/README.md` + `changeset.config.json`

- `access: "restricted"` — every `@stackra/*` package is meant to be public per
  `package-naming.md` §Rule 1. **Fix** — set `access: "public"`. Overriding
  per-package requires an `.npmignore` OR a `publishConfig.access: "restricted"`
  in that package's `package.json`; the workspace default should be public.
- `ignore: ["@figentra/family"]` — good; the family app is private.
- **Add** — `commit: false` is present. Good.
- **Add** — `updateInternalDependencies: "patch"` — good.
- **Missing** — no `linked` / `fixed` groups defined. Not a bug, but call out in
  the README that the family of `@stackra/database/*` sub-packages (Task 11)
  will land as a `linked` group when they exist.

#### `.husky/` — pre-commit, commit-msg, pre-push

- `pre-commit` → `pnpm exec lint-staged` — good.
- `commit-msg` → `pnpm exec commitlint --edit "$1"` — good.
- `pre-push` → `pnpm check` — **too heavy**. `pnpm check` runs the entire
  standards suite (workers-check, ci-contract, docker/terraform validation).
  Push time is measured in tens of seconds; recommend split to `pnpm verify`
  (format+lint+typecheck) at pre-push, `pnpm check` only at CI. Otherwise devs
  disable the hook (which is the root cause of every workspace's hook drift).
- **Missing** — `.husky/_/husky.sh` scaffolding. Confirm husky 9 v2 mode is
  active (root `package.json` has `"prepare": "husky"` — good).

#### `.gitignore`

- `.env.example` allowlist — good.
- `apps/family/ios` + `apps/family/android` explicitly ignored — good (RN
  auto-generated).
- `infrastructure/terraform/catalog.json` — **STALE**. User moved `catalog.json`
  to `infrastructure/.generated/catalog.json` per Task 8. **Fix** — replace with
  `infrastructure/.generated/`.
- **Missing** — `infrastructure/docker/docker-compose.generated.yml` explicit
  ignore (currently allowed to be committed, which conflicts with Task 8).

#### `.npmrc`

- One line: `registry=https://registry.npmjs.org/`. **Adequate but incomplete
  for enterprise**. Recommend adding:
  ```
  # Fail-fast on lifecycle warnings — enterprise supply-chain hygiene
  fund=false
  auto-install-peers=true
  strict-peer-dependencies=false
  ```
  (`strict-peer-dependencies` is already `false` via `pnpm-workspace.yaml`, so
  this line is a no-op but explicit at the `.npmrc` layer for pnpm-alien tools).

#### `.nvmrc`

- `24.18.0` — matches `package.json` `engines.node >=24`. Good. Consider pinning
  to a specific patch (`24.18.0`) instead of `>=24` to prevent drift between
  workstations. **No change needed** — already pinned.

#### `.prettierignore`

- `.ref` block — good.
- `dist`, `build`, `.turbo`, `.terraform`, `.wrangler`, `.vercel` — good.
- **Missing** — `.generated/` (Task 8) should be added if content is
  machine-owned.

#### `.prettierrc`

- Single-string reference to `@stackra/prettier-config`. Good. `.prettierrc`
  format is JSON — the ONE-LINE string extends convention works.

#### `.mcp.json`

- Every secret is a `${VAR}` placeholder. Good.
- **Missing** — a `mcp-server-fetch` entry for docs research (would help
  writers). Optional.
- Doppler MCP autoApprove list is generous — includes `secrets_download` which
  will happily dump every secret in the project. Review the autoApprove per
  `.kiro/steering/ai-agent-governance.md` §"Rotate any secret" (MUST escalate).

#### `.gitleaks.toml`

- `useDefault = true` — good.
- Allowlist paths cover `.ref/`, `docs/`, `.kiro/` — good. **Add** `.generated/`
  when Task 8 lands (generated docker-compose may carry connection strings the
  scanner false-positives on).
- **Missing** — regex-based allowlist for placeholder tokens (`${VAR}`,
  `PLACEHOLDER_`, `EXAMPLE_`). Enterprise pattern.

#### `commitlint.config.ts`

- Header 120 chars — good (aligns with Prettier `printWidth: 100` + emoji).
- 13 type enums — matches `commit-conventions.md` §Rule 1.
- **Missing** — the emoji-in-subject convention from `commit-conventions.md`
  §Rule 2 is NOT enforced by commitlint. It's a review-time convention today.
  Optional: add a `subject-pattern` rule enforcing an emoji prefix.
- `scope-empty: never` — enforces every commit has a scope. Matches convention.
- `subject-case: never [sentence-case, start-case, pascal-case, upper-case]` —
  imperative-lowercase enforcement. Good.

#### `turbo.json`

- `$schema` points at `v2-10-12.turborepo.dev`. Version pins should follow the
  pnpm catalog. **Fix** — reference the schema version matching the installed
  `turbo` (catalog: `turbo: ^2.10.12`).
- Every task has an `inputs` array. Good.
- `dev` and `deploy` correctly set `cache: false`.
- **Missing** — no `format` task (Prettier isn't Turbo-orchestrated today). Not
  required; `pnpm format` at root is fine.

### Tasks

- [ ] **5.1** — Flip `changeset.config.json` `access: "restricted"` →
      `access: "public"` unless there's a reason to gate. Author:
      `docs-changesets-steward`.
- [x] **5.2** — Split `.husky/pre-push` from `pnpm check` → `pnpm verify`
      (format:check + lint + typecheck). Author:
      `workspace-standardization-steward`.
- [x] **5.3** — Update `.gitignore` — replace
      `infrastructure/terraform/catalog.json` with `infrastructure/.generated/`
      (Task 8 dependency). Author: `workspace-standardization-steward`.
- [x] **5.4** — Add `.npmrc` enterprise settings (`fund=false`,
      `auto-install-peers=true`). Author: `workspace-standardization-steward`.
- [x] **5.5** — Add `.prettierignore` entry for `.generated/` (Task 8
      dependency). Author: `workspace-standardization-steward`.
- [ ] **5.6** — Review `.mcp.json` Doppler `autoApprove` list; drop
      `secrets_download` from auto-approve per `ai-agent-governance.md`
      §MUST-escalate. Author: `docs-changesets-steward`.
- [x] **5.7** — Update `.gitleaks.toml` — add `.generated/` allowlist entry
      after Task 8. Author: `workspace-standardization-steward`.
- [x] **5.8** — Bump `turbo.json` `$schema` to match the catalog turbo version.
      Author: `workspace-standardization-steward`. _(Already synced —
      `v2-10-12.turborepo.dev` matches catalog pin `turbo: ^2.10.12`.)_
- [x] **5.9** — Document the pre-push vs CI split in `.docs/adr/` — codify what
      runs where. Author: `docs-adr-steward`. →
      [ADR-0089](../../.docs/adr/ADR-0089-pre-push-vs-ci-verification-split.md)

---

## Task 6 — `@stackra/contracts` architecture

### Naming — KEEP `@stackra/contracts`

Every framework in the industry that ships a "shared vocabulary" package uses
one of these names: `contracts` (Laravel, DDD), `common` (NestJS:
`@nestjs/common`), `shared` (Angular library convention), `core-types`,
`kernel`. Of those:

- `contracts` — cleanest for THIS workspace because the package's job IS "the
  cross-package interface + token vocabulary". It maps directly to the DDD /
  ports-and-adapters term. Steering docs already reference the name extensively
  (`contract-reexports.md`, `contracts-and-decorators-promotion.md`).
- `common` — clashes with `@nestjs/common` in every service. Confusing.
- `shared` — too generic. Reviewers won't know what's shared.
- `kernel` — off-brand.

**Decision: keep `@stackra/contracts`.** Rename cost is high; naming clarity
gain is zero.

### What the package holds

Every symbol below is documented per
`.kiro/steering/contracts-and-decorators-promotion.md`:

| Category                 | Subfolder         | What lives here                                                                                            |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **DI tokens**            | `src/tokens/`     | `Symbol()` tokens for every cross-package service (one per file, `foo.token.ts`).                          |
| **Interfaces**           | `src/interfaces/` | Every cross-package protocol interface (`ILoggerManager`, `IStorage`, `IEventEmitter`).                    |
| **Types**                | `src/types/`      | Cross-package type aliases (unions, mapped types) not expressible as interfaces.                           |
| **Enums**                | `src/enums/`      | Cross-package enums (`LogLevel`, `HttpMethod`, `Sensitivity`).                                             |
| **DTOs**                 | `src/dtos/`       | Zod-schema-first DTOs — cross-service request/response shapes. Zod schemas + inferred types.               |
| **Events**               | `src/events/`     | Per-domain event catalogues (`<domain>.events.ts`) — event name constants + payload types.                 |
| **Zones**                | `src/zones/`      | Per-package zone identifiers (`<pkg>.zones.ts`) per `.ref/steering/zones-catalog.md`.                      |
| **Constants**            | `src/constants/`  | Cross-package constants (`DEFAULT_TIMEOUT_MS`, `WORKSPACE_ROOT_SLUG`).                                     |
| **Decorators**           | `src/decorators/` | Cross-package decorators — but SEE `contracts-and-decorators-promotion.md` §"container-decorator quintet". |
| **Framework primitives** | `src/primitives/` | `Type<T>`, `Provider`, `DynamicModule`, `Scope`, lifecycle-hook interfaces.                                |

Every export follows `.kiro/steering/code-standards.md` — one export per file,
suffix-per-kind, folder-per-category, every folder has an `index.ts` barrel.

The package's `src/index.ts` is a barrel that re-exports every subfolder's
`index.ts`. Consumers import from `@stackra/contracts` — never
`@stackra/contracts/tokens/logger.token`.

### Special consideration — decorators inside contracts

Per `contracts-and-decorators-promotion.md`:

- The FIVE DI decorators (`Module`, `Injectable`, `Inject`, `Optional`,
  `Global`) live PERMANENTLY in `@stackra/container` — never promoted to
  contracts. That's ADR-0059.
- Every OTHER cross-package decorator (`@AsController`, `@OnEvent`,
  `@Cacheable`, etc.) lives in `@stackra/decorators/<consumer>/` — a SEPARATE
  package.

So `@stackra/contracts/decorators/` should be empty by default. If a shape
emerges that MUST live in contracts (metadata-key contracts, discovery keys),
put it in `src/decorators/` — but the default is empty.

### Tasks

- [ ] **6.1** — Author `src/index.ts` — barrel that re-exports every subfolder's
      `index.ts`. Author: `framework-core-builder`.
- [ ] **6.2** — Create the 10 subfolders per the table above, each with an empty
      `index.ts` barrel. Author: `framework-core-builder`.
- [ ] **6.3** — Author baseline interfaces in `src/interfaces/`:
      `ILoggerManager`, `IEventEmitter`, `IEventPayload`, `IContainer`,
      `IModule`, `IDiscoveryService`, `IDiscoveryProvider`, `IStorage`. One per
      file. Author: `framework-core-builder`.
- [ ] **6.4** — Author baseline tokens in `src/tokens/`: `LOGGER_MANAGER`,
      `EVENT_EMITTER`, `DISCOVERY_SERVICE`, `STORAGE_MANAGER`, `CACHE_MANAGER`,
      `HTTP_SERVICE`. One per file. Author: `framework-core-builder`.
- [ ] **6.5** — Author baseline primitives in `src/primitives/`: `type.type.ts`
      (Type<T>), `provider.interface.ts`, `dynamic-module.interface.ts`,
      `scope.enum.ts`, `on-module-init.interface.ts`,
      `on-application-bootstrap.interface.ts`. Author: `framework-core-builder`.
- [ ] **6.6** — Author baseline enums in `src/enums/`: `log-level.enum.ts`,
      `http-method.enum.ts`, `sensitivity.enum.ts`. Author:
      `framework-core-builder`.
- [ ] **6.7** — Update `packages/contracts/tsup.config.ts` to reflect one entry
      (already `src/index.ts`) — no change needed. Verify tsup dts still passes.
      Author: `framework-core-builder`.
- [ ] **6.8** — Author `packages/contracts/README.md` per `documentation.md`.
      Author: `docs-changesets-steward`.
- [ ] **6.9** — Author every export's JSDoc per `documentation.md`. Author:
      `code-documentation-writer`.
- [ ] **6.10** — Author `packages/contracts/__tests__/` with one smoke test per
      subfolder (imports resolve, tokens are Symbols, etc.). Author:
      `vitest-test-engineer`.
- [ ] **6.11** — Populate `catalog.json` per `catalog-manifest.md`. Author:
      `workspace-standardization-steward`.

### Cross-refs

- [`.kiro/steering/contract-reexports.md`](../steering/contract-reexports.md).
- [`.kiro/steering/contracts-and-decorators-promotion.md`](../steering/contracts-and-decorators-promotion.md).
- [`.kiro/steering/code-standards.md`](../steering/code-standards.md).

---

## Task 7 — Config-package standardisation

### Why `tsup-config` has `tsconfig.json` but other configs don't

The difference is real and correct. Two distinct shapes:

| Shape           | Applies to                                              | Ships                                         | Compiles?              |
| --------------- | ------------------------------------------------------- | --------------------------------------------- | ---------------------- |
| **TS library**  | `packages/tsup-config`                                  | TypeScript source (`src/*.ts`) → `dist/`      | YES — tsup builds it.  |
| **JSON preset** | `typescript-config`, `prettier-config`, `oxlint-config` | JSON / JS presets (`src/*.json`, `src/*.mjs`) | NO — files ship as-is. |

`@stackra/tsup-config` exports a TypeScript function (`defineBaseConfig`). Its
output must be compiled to CJS + ESM. Therefore it needs a `tsconfig.json`.

The others export JSON files (or `.mjs` presets) directly — no compilation step,
no `tsconfig.json`.

### Standardisation checklist for EVERY config package

Every config package (both shapes) must match:

- `package.json.name` — `@stackra/<name>-config` (kebab-case).
- `package.json.version` — semver, bumped only via Changesets.
- `package.json.type` — `"module"`.
- `package.json.author` — the standard Figentra L.L.C block.
- `package.json.license` — `"MIT"`.
- `package.json.repository` / `homepage` / `bugs` — matching URL block.
- `package.json.publishConfig.access` — `"public"`.
- `package.json.engines.node` — `">=24.0.0"`.
- `package.json.files` — `["src", "README.md"]` for JSON presets,
  `["dist", "README.md"]` for TS libraries.
- `catalog.json` — every field per `catalog-manifest.md`.
- `README.md` — one-paragraph purpose + a copy-pasteable example.
- `scripts` — `build`, `dev`, `clean`, `typecheck`, `lint`, `test`.
  Non-applicable scripts echo `'No source'` per the existing pattern.

### Current state

| Package                      | Standard?  | Missing                                |
| ---------------------------- | ---------- | -------------------------------------- |
| `@stackra/typescript-config` | ✓          | No `tsconfig.json` needed. No changes. |
| `@stackra/prettier-config`   | ✓          | Check `catalog.json` completeness.     |
| `@stackra/oxlint-config`     | ✓          | Check `catalog.json` completeness.     |
| `@stackra/tsup-config`       | ✓          | Has `tsconfig.json` — correct.         |
| `@stackra/testing`           | ✗ (Task 1) | Doesn't exist yet.                     |

### Tasks

- [ ] **7.1** — Sweep every config package: verify `catalog.json` complete,
      README present, `package.json` matches the checklist. Author:
      `workspace-standardization-steward`.
- [ ] **7.2** — Document the JSON-preset vs TS-library distinction in
      `packages/README.md` (author it if it doesn't exist). Author:
      `docs-changesets-steward`.
- [ ] **7.3** — Add a `.kiro/steering/config-package-shape.md` documenting the
      checklist above (optional; could fold into `package-conventions.md`
      §"Config packages"). Author: `docs-adr-steward`.

---

## Task 8 — Infrastructure `.generated/` + Terraform / Docker alignment

### Decision — `.generated/` is the right name

`.generated/` is a well-established convention (Rails, Django, Terraform CDK,
protobuf codegen). Leading dot signals "workspace substrate, machine-owned".
`.cache/` also works but `.cache/` implies "regeneratable, may be deleted at any
time" while `.generated/` implies "authoritative machine output, don't
hand-edit". Docker Compose files fall in the latter — they ARE the input to
`docker compose up`, so `.generated/` is more accurate.

### Consolidate every generated file under `.generated/`

```
infrastructure/
├── .generated/                          # machine-owned; gitignored
│   ├── catalog.json                     # collect-cloud-yaml.mjs output
│   ├── docker-compose.yml               # generate-compose.mjs output (renamed)
│   └── terraform/
│       ├── plans/                       # tf plan .tfplan files (moved from .plans/)
│       └── outputs/                     # tf output JSON captures
├── docker/
│   ├── docker.mk                        # references .generated/docker-compose.yml
│   ├── docker.yaml
│   └── scripts/
│       └── generate-compose.mjs         # emits to .generated/docker-compose.yml
├── terraform/
│   ├── terraform.mk                     # references .generated/terraform/plans/
│   └── scripts/
│       └── render-wrangler-bindings.mjs # emits to .generated/wrangler-*
└── infrastructure.mk                    # includes docker.mk + terraform.mk (Task 10)
```

### Rename `.generated/` targets

- `infrastructure/.generated/catalog.json` (already there — keep).
- `infrastructure/docker/docker-compose.generated.yml` →
  `infrastructure/.generated/docker-compose.yml` (drop the `.generated` suffix
  since the folder now conveys it).
- `infrastructure/terraform/.plans/tfplan-<env>` →
  `infrastructure/.generated/terraform/plans/tfplan-<env>`.

### Update every reference

Files that reference these paths (grep in Task 8.4):

- `package.json` scripts (`docker:compose`, `catalog`, `production-readiness`).
- `infrastructure/docker/docker.mk` — every `docker compose -f` reference.
- `infrastructure/terraform/terraform.mk` — every `.plans/` reference.
- `Makefile` — every `docker compose -f` + `terraform ... .plans/` reference.
- `infrastructure/docker/scripts/generate-compose.mjs` — the emit path.
- `infrastructure/terraform/scripts/render-wrangler-bindings.mjs` — the emit
  path.
- `.gitignore` — replace old paths.
- `.prettierignore` — replace old paths.
- `.gitleaks.toml` — extend allowlist to `.generated/`.

### Tasks

- [x] **8.1** — Create `infrastructure/.generated/` skeleton (already exists) +
      subfolders. Author: `workspace-standardization-steward`.
- [x] **8.2** — Move `infrastructure/docker/docker-compose.generated.yml` →
      `infrastructure/.generated/docker-compose.yml`. Author:
      `workspace-standardization-steward`.
- [x] **8.3** — Move `infrastructure/terraform/.plans/` →
      `infrastructure/.generated/terraform/plans/`. Author:
      `workspace-standardization-steward`.
- [x] **8.4** — Grep every file for stale paths + update every reference.
      Author: `workspace-standardization-steward`.
- [x] **8.5** — Update `.gitignore`, `.prettierignore`, `.gitleaks.toml` per
      Task 5. Author: `workspace-standardization-steward`.
- [x] **8.6** — Author `infrastructure/.generated/README.md` — one sentence
      explaining "machine-owned, do not hand-edit". Author:
      `docs-changesets-steward`.
- [x] **8.7** — Verify `pnpm production:readiness` still passes end-to-end.
      Author: `framework-core-builder`. _(Static verification via `make -n`
      dry-run + `node --check`; full `pnpm production:readiness` run gated by a
      fresh `pnpm install --frozen-lockfile` unrelated to this task.)_

---

## Task 9 — Move `ENVIRONMENT-STANDARD.md` into `.docs/` as an ADR

### Decision — ADR wins

`ENVIRONMENT-STANDARD.md` is a decision-of-record about environment identifiers.
ADRs are the workspace's canonical form for decisions-of-record
(`.docs/adr/*.md`). Moving it makes:

- The doc reachable from `.docs/adr/INDEX.md` (with other decisions).
- The decision auditable (Status: Accepted / Superseded).
- Cross-references consistent (every other rule references
  `.docs/adr/00XX-*.md`).

### Target — `.docs/adr/0080-environment-canonical-identifiers.md`

(Number auto-picked from the next available; the current highest ADR is likely
~0079 based on the `.docs/adr/` listing. Confirm before authoring.)

### Tasks

- [x] **9.1** — Enumerate `.docs/adr/` — find the next available ADR number.
      Author: `docs-adr-steward`. _(Next number was 0088.)_
- [x] **9.2** — Author `.docs/adr/00XX-environment-canonical-identifiers.md` —
      same content + full ADR frontmatter (Status, Date, Deciders, Context,
      Decision, Consequences, References). Author: `docs-adr-steward`. →
      [ADR-0088](../../.docs/adr/ADR-0088-environment-canonical-identifiers.md)
- [x] **9.3** — Delete `infrastructure/ENVIRONMENT-STANDARD.md`. Add a redirect
      stub referencing the ADR (or delete outright). Author: `docs-adr-steward`.
      _(Deleted outright; content folded into ADR-0088.)_
- [x] **9.4** — Update every doc that referenced
      `infrastructure/ENVIRONMENT-STANDARD.md` — grep first
      (`infrastructure/README.md`, `infrastructure/environments/README.md`, both
      `.mk` files). Author: `docs-adr-steward`. _(Zero remaining references
      after the delete.)_

---

## Task 10 — `infrastructure/infrastructure.mk` as the single include point

### Current state

`Makefile` at repo root does:

```makefile
TF_MK := infrastructure/terraform/terraform.mk
DOCKER_MK := infrastructure/docker/docker.mk

include $(TF_MK)
include $(DOCKER_MK)
```

`infrastructure/infrastructure.mk` is EMPTY.

### Decision — one include point per concern

```makefile
# infrastructure/infrastructure.mk
INFRA_TF_MK := $(ROOT)/infrastructure/terraform/terraform.mk
INFRA_DOCKER_MK := $(ROOT)/infrastructure/docker/docker.mk

include $(INFRA_TF_MK)
include $(INFRA_DOCKER_MK)
```

Root `Makefile` reduces to:

```makefile
include infrastructure/infrastructure.mk
```

### Tasks

- [x] **10.1** — Author `infrastructure/infrastructure.mk` — includes
      `terraform.mk` and `docker.mk`. Author:
      `workspace-standardization-steward`.
- [x] **10.2** — Update root `Makefile` — replace two `include`s with one.
      Author: `workspace-standardization-steward`.
- [x] **10.3** — Confirm `make help` still lists every target. Author:
      `workspace-standardization-steward`.
- [x] **10.4** — Author `infrastructure/README.md` documenting the include
      structure. Author: `docs-changesets-steward`.

---

## Task 11 — `@stackra/database` (MikroORM + D1)

> **Source of truth.** Full architecture lives at
> [`.kiro/plans/2026-09-03-database-package.md`](./2026-09-03-database-package.md).
> That sibling plan covers entity decorators, subpath split (`.` + `/nestjs` +
> `/postgres` + `/d1` + `/migrations` + `/worker` + `/testing`), the
> `DatabaseManager extends MultipleInstanceManager<IDatabaseConnection>` shape
> per ADR-0090, the D1 dialect compatibility table, and the 11-phase rollout (32
> days total). This section stays as a summary; Task 11.1-11.11 below track the
> workspace-side integration work.

### Decision — MikroORM for everyone, `@stackra/database` fronts it

**Yes, use MikroORM everywhere.** The workspace already has `@mikro-orm/*` in
the catalog. For NestJS services, MikroORM is the industry-standard choice
alongside TypeORM (MikroORM wins on Unit-of-Work, hydration, and TypeScript
ergonomics). For Cloudflare Workers on D1, MikroORM ships a first-party
Cloudflare D1 driver (`@mikro-orm/cloudflare-d1`) — usable today, actively
maintained.

**Alternatives evaluated (and why not)**:

| ORM     | Verdict                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| Drizzle | Great DX, but no Unit-of-Work. Would fork services (MikroORM) vs workers (Drizzle). No. |
| Prisma  | Node-runtime-only (no Workers). No.                                                     |
| Kysely  | Query builder only, no ORM. Would need a hand-rolled entity layer. No.                  |
| TypeORM | Legacy. MikroORM is the modern successor with the same DI patterns.                     |

**Uniform ORM = uniform migration story + uniform entity story + uniform
testing.** That's the whole point of the framework tier.

### Subpath exports

```
packages/database/
├── src/
│   ├── core/                        # subpath: "@stackra/database"
│   │   ├── entities/                # base Entity, Timestamped, SoftDeletable, TenantScoped
│   │   ├── decorators/              # @Aggregate, @UlidPrefix, @Tenanted
│   │   ├── types/                   # canonical types (UlidId, TenantId, TimestampTZ)
│   │   ├── contracts/               # IRepository, IEntityManager (types over mikro-orm)
│   │   └── enums/                   # OrderDirection, JoinKind
│   ├── nest/                        # subpath: "@stackra/database/nest"
│   │   ├── database.module.ts       # wraps @mikro-orm/nestjs' MikroOrmModule
│   │   ├── decorators/              # @InjectRepository, @UseRequestContext
│   │   ├── testing.module.ts        # NestJS test module for MikroORM
│   │   └── interceptors/            # UnitOfWork interceptor (per-request EM)
│   ├── worker/                      # subpath: "@stackra/database/worker"
│   │   ├── d1.factory.ts            # createD1Orm(env.DB) → MikroORM instance
│   │   ├── request-context.ts       # wraps mikro-orm RequestContext.create for Workers
│   │   └── migrations-runner.ts     # runs D1 migrations at Worker cold-start
│   └── migrations/                  # subpath: "@stackra/database/migrations"
│       ├── migration.abstract.ts    # abstract Migration class (Task 12)
│       ├── query-builder.ts         # thin fluent API over mikro-orm's Knex
│       └── schema/                  # createTable, alterTable, dropTable helpers (Task 12)
```

**Question the user asked — "shall we export worker or d1 or core and nest
only?"** — Recommend **all four subpaths** (`core`, `nest`, `worker`,
`migrations`), because:

- `core/` — the shared entity + type vocabulary. Every consumer imports from
  here.
- `nest/` — the NestJS-runtime binding. Services use it.
- `worker/` — the D1-runtime binding. Workers use it. Distinct file because
  Workers can't import `@mikro-orm/nestjs` (it pulls Node deps).
- `migrations/` — the Migration base class + query builder (Task 12). Both
  services + workers write migrations against this.

### Tasks

- [ ] **11.1** — Scaffold `packages/database/` per `package-conventions.md`
      shape (Task 7 checklist). Author: `framework-core-builder`.
- [ ] **11.2** — Author `src/core/entities/` — base classes: `Aggregate`,
      `Timestamped`, `SoftDeletable`, `TenantScoped` (composes `tenant_id` per
      `tenancy-columns.md`). Author: `framework-core-builder`.
- [ ] **11.3** — Author `src/core/decorators/` — `@UlidPrefix('trn')` per
      `ulid-prefix-registry.md`. Author: `framework-core-builder`.
- [ ] **11.4** — Author `src/nest/database.module.ts` — thin wrapper around
      `MikroOrmModule.forRoot()` from `@mikro-orm/nestjs`. Applies workspace
      conventions (naming, snake_case columns, ULID PKs, migration table
      location). Author: `framework-core-builder`.
- [ ] **11.5** — Author `src/nest/testing.module.ts` — MikroORM test host
      (in-memory sqlite for services, pglite for services needing Postgres
      feature parity, D1 fixture for workers) — composes with
      `@stackra/testing/database`. Author: `framework-core-builder`.
- [ ] **11.6** — Author `src/worker/d1.factory.ts` — `createD1Orm(env)` returns
      a MikroORM instance from D1 binding. Handles per-request
      `RequestContext.create()`. Author: `framework-core-builder`.
- [ ] **11.7** — Add `@mikro-orm/cloudflare-d1` to the workspace catalog.
      Confirm bundle size in a worker build (D1 driver historically has ESM
      issues; verify). Author: `workspace-standardization-steward`.
- [ ] **11.8** — Author `packages/database/__tests__/` — smoke tests per
      subpath. Author: `vitest-test-engineer`.
- [ ] **11.9** — Author `packages/database/README.md` documenting every
      subpath + a copy-pasteable "how to define an entity" walkthrough. Author:
      `docs-changesets-steward`.
- [ ] **11.10** — Migrate the workers' raw SQL calls
      (`workers/registry/database/`,
      `workers/infrastructure-orchestrator/database/`,
      `workers/workflow-runtime/database/`) to `@stackra/database/worker`.
      Author: `framework-core-builder`.
- [ ] **11.11** — Sweep `services/approval/` to compose `@stackra/database/nest`
      where the service currently uses raw MikroORM. Author:
      `framework-core-builder`.

### Cross-refs

- [`.kiro/steering/tenancy-columns.md`](../steering/tenancy-columns.md) —
  `TenantScoped` base class encodes this.
- [`.kiro/steering/hierarchy.md`](../steering/hierarchy.md).
- [`.kiro/steering/data-ownership.md`](../steering/data-ownership.md) — no
  cross-service FKs.

---

## Task 12 — Migration abstract class + query-builder

> **Source of truth.** Full builder API — every column-type helper, chainable
> modifier, dialect-fallback table, and the `Migration` abstract class body —
> lives in
> [`.kiro/plans/2026-09-03-database-package.md`](./2026-09-03-database-package.md)
> §"Fluent migration schema builder" + §Phase 4. Task 12.1-12.8 below track
> workspace-side integration work.

### Answer

**Yes, ship a `Migration` abstract class.** MikroORM already uses Knex
internally for its migration engine — we don't need a separate Knex dep. We wrap
`this.addSql()` with a fluent, Laravel-shaped API.

### Shape

```typescript
// packages/database/src/migrations/migration.abstract.ts
import { Migration as MikroMigration } from "@mikro-orm/migrations";
import { Schema } from "./query-builder/schema";

/**
 * @description Workspace canonical Migration base class.
 *   Wraps @mikro-orm/migrations with a Laravel-shaped fluent
 *   Schema builder that emits raw SQL under the hood.
 */
export abstract class Migration extends MikroMigration {
  /**
   * Fluent schema builder — call `.up()` with `schema.createTable(...)`.
   */
  protected schema = new Schema(this);

  /** Fluent raw-SQL helper for cases the builder can't express. */
  protected raw(sql: string, params: unknown[] = []): void {
    this.addSql(sql, params);
  }
}
```

The `Schema` class exposes Laravel-shaped verbs:

```typescript
schema.createTable("athletes", (t) => {
  t.ulid("id").primary();
  t.string("first_name");
  t.string("last_name");
  t.string("email").unique();
  t.foreignId("tenant_id").references("tenants", "id");
  t.jsonb("attributes").nullable();
  t.timestamps();
  t.index(["tenant_id", "created_at"]);
});

schema.alterTable("athletes", (t) => {
  t.dropColumn("deprecated_field");
  t.addColumn("new_field", "string").nullable();
});

schema.dropTable("legacy_table");
```

Under the hood, `Schema.createTable(name, fn)` emits
`this.migration.addSql(...)` for CREATE TABLE + every CREATE INDEX. The output
is raw SQL — MikroORM's migration engine executes it. We keep MikroORM's
transaction wrapping, up/down semantics, and CLI (`mikro-orm migration:*`).

### Why NOT knex directly

- Adding `knex` as a runtime dep doubles the migration bundle.
- MikroORM's `SchemaBuilder` already uses Knex — we'd be dep-duplicating.
- The migration surface is workspace-canonical; we control the API. Ship the
  fluent facade + emit raw SQL through MikroORM.

### Alternative if MikroORM's D1 story falters

If `@mikro-orm/cloudflare-d1` bundle size / ESM issues bite us in production:

- Keep the `Migration` base class + fluent Schema.
- Swap the underlying emit for `env.DB.exec(sql)` calls directly in Workers.
- Services continue to use MikroORM's engine.

The fluent API becomes the boundary; the runtime is swappable.

### Tasks

- [ ] **12.1** — Author `src/migrations/migration.abstract.ts` — the abstract
      base class. Author: `framework-core-builder`.
- [ ] **12.2** — Author `src/migrations/query-builder/schema.ts` — `createTable`
      / `alterTable` / `dropTable`. Author: `framework-core-builder`.
- [ ] **12.3** — Author `src/migrations/query-builder/blueprint.ts` — the
      `Blueprint` object passed to the callback (`t.string()`, `t.ulid()`,
      `t.foreignId()`, `t.timestamps()`, `t.index()`, `t.softDeletes()`).
      Author: `framework-core-builder`.
- [ ] **12.4** — Author `src/migrations/query-builder/column-types.ts` — every
      column type helper (string, text, integer, bigint, decimal, boolean,
      jsonb, date, timestamp, ulid, uuid, enum). Author:
      `framework-core-builder`.
- [ ] **12.5** — Author unit tests — every emitted SQL string is snapshotted.
      Author: `vitest-test-engineer`.
- [ ] **12.6** — Author `packages/database/migrations.README.md` — "how to write
      a migration" cookbook. Author: `docs-changesets-steward`.
- [ ] **12.7** — Author one example migration in `services/approval/migrations/`
      demonstrating the fluent API. Author: `framework-core-builder`.
- [ ] **12.8** — Author one example migration in
      `workers/registry/database/migrations/` demonstrating the D1 case. Author:
      `framework-core-builder`.

---

## Task 13 — `@stackra/container` (framework DI substrate)

> **Source of truth.** Full architecture lives at
> [`.kiro/plans/2026-09-03-container-package.md`](./2026-09-03-container-package.md).
> That sibling plan covers the six subpath split (`.` + `/nestjs` + `/react` +
> `/native` + `/worker` + `/testing`), the `IDiscoveryService` canonical
> primitive, request-scoped context, testing container alignment with
> `@stackra/testing`, and the 10-phase rollout (25 days).

### Decision — the DI foundation the workspace needs first

Every downstream framework package (`@stackra/logger`, `@stackra/database`,
`@stackra/cache` if we ever ship it) depends on `IContainerResolver` +
`IDiscoveryService` from `@stackra/contracts`. Land `@stackra/container` FIRST
so the shape those interfaces describe has a canonical implementation.

Anchor ADRs: [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md).

### Tasks

- [ ] **13.1** — Land the contracts split:
      `packages/contracts/src/interfaces/container/*` +
      `packages/contracts/src/tokens/container.tokens.ts` +
      `packages/contracts/src/errors/container-*.error.ts`. Cross-refs Task 6.
      Author: `framework-core-builder`.
- [ ] **13.2** — Scaffold `packages/container/` per ADR-0091 §Rule 8-9 (6
      subpath exports). Author: `framework-core-builder`.
- [ ] **13.3** — Ship core runtime — `ApplicationContext`, `ContainerResolver`,
      `Module`, decorators, discovery, lifecycle hooks, cross-platform hooks.
      Per sibling plan Phase 3. Author: `framework-core-builder`.
- [ ] **13.4** — Ship `@stackra/container/nestjs` — `ContainerModule.forRoot`,
      `NestContainerAdapter`, `NestDiscoveryAdapter`,
      `RequestContextMiddleware`. Author: `framework-core-builder`.
- [ ] **13.5** — Ship `@stackra/container/worker` —
      `createWorkerContainer(env, ctx)`, per-request `RequestContext`,
      `flushOnWaitUntil`. Author: `framework-core-builder`.
- [ ] **13.6** — Ship `@stackra/container/react` + `/native` — re-exports of
      core hooks + provider. Author: `framework-core-builder`.
- [ ] **13.7** — Ship `@stackra/container/testing` — `TestContainer.create()` w/
      `.overrideProvider` + `.overrideDiscovery`. Author:
      `framework-core-builder`.
- [ ] **13.8** — Retire `@stackra/testing/core/container` standalone
      TestContainer — re-export from `@stackra/container/testing` when the peer
      is installed. Cross-refs Task 1. Author: `framework-core-builder`.
- [ ] **13.9** — Migrate `packages/logger` to `IDiscoveryService` from contracts
      (drops Nest-only discovery). Author: `framework-core-builder`.
- [ ] **13.10** — Author `packages/container/README.md` +
      `packages/container/__tests__/`. Author: `docs-changesets-steward` +
      `vitest-test-engineer`.

---

## Task 14 — `@stackra/logger` (channels, sinks, cross-runtime)

> **Source of truth.** Full architecture lives at
> [`.kiro/plans/2026-09-03-logger-package.md`](./2026-09-03-logger-package.md).
> That sibling plan covers channels, sinks, the
> `LoggerManager extends Manager<ILogChannel>` shape per ADR-0090, Pino +
> Winston as optional subpath peers, the pipeline stages, the security-redaction
> rules, and the 12-phase rollout (32 days).

### Decision — replace the current `packages/logger/` with the ADR-shaped rewrite

The current `packages/logger/` predates ADR-0090/0091/0092. Rather than
retrofit, land the new package in place — same folder, same npm name, new
architecture. Consumers (`services/approval`, future services) rebind at the
`@stackra/logger` name; the ABI change ships as a major version bump via
Changesets.

Anchor ADRs: [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md).

### Tasks

- [ ] **14.1** — Land the contracts split:
      `packages/contracts/src/interfaces/logger/*` +
      `packages/contracts/src/enums/log-level.enum.ts` +
      `packages/contracts/src/tokens/logger.tokens.ts`. Cross-refs Task 6.
      Author: `framework-core-builder`.
- [ ] **14.2** — Scaffold new `packages/logger/` shape per sibling plan Phase 2
      (8 subpath exports). Preserve the existing package's `catalog.json` +
      `package.json` `name`. Author: `framework-core-builder`.
- [ ] **14.3** — Ship core runtime — `Logger`, `LoggerFactory`,
      `LoggerManager extends Manager<ILogChannel>`, sinks (Console, InMemory,
      Silent, Emergency), redaction engine, enrichers, formatters, context
      repository. Per sibling plan Phase 3. Depends on Task 13 (needs
      `@stackra/container`). Author: `framework-core-builder`.
- [ ] **14.4** — Ship `@stackra/logger/pino` (optional peer) —
      `PinoSink implements ILogSink` + `PinoModule.forRoot()`. Author:
      `framework-core-builder`.
- [ ] **14.5** — Ship `@stackra/logger/winston` (optional peer) —
      `WinstonSink implements ILogSink` + `WinstonModule.forRoot()`. Author:
      `framework-core-builder`.
- [ ] **14.6** — Ship `@stackra/logger/nestjs` —
      `LoggerModule.forRoot/forRootAsync`, Nest logger adapter, request-logging
      middleware/interceptor, exception filter, health indicator. Author:
      `framework-core-builder`.
- [ ] **14.7** — Ship `@stackra/logger/worker` — Cloudflare Worker context
      repository + WorkerConsoleSink + optional QueueSink + `waituntil-flush`.
      Author: `framework-core-builder`.
- [ ] **14.8** — Ship `@stackra/logger/react` + `/native` — cross-platform
      `<LoggerProvider>` + `useLogger` (from core) + web-only `HttpSink` +
      native NativeConsoleSink. Author: `framework-core-builder`.
- [ ] **14.9** — Ship `@stackra/logger/testing` — `MockLogger`, `InMemorySink`,
      `TestLogger.create()` (real pipeline). Author: `framework-core-builder`.
- [ ] **14.10** — Migrate `services/approval` to the new logger surface via
      `StackraServiceModule` (Task 15). Author: `framework-core-builder`.
- [ ] **14.11** — Author `packages/logger/README.md` +
      `packages/logger/__tests__/` + `.docs/logger/*.md`. Author:
      `docs-changesets-steward` + `vitest-test-engineer`.

---

## Task 15 — `@stackra/nest-service` (auto-registration composite)

### Decision — the ADR-0092 composite

Ship a lightweight composite module that wires the seven platform modules
(`ConfigModule`, `ContainerModule`, `RequestContextModule`, `LoggerModule`,
`RegistryModule`, `HealthModule`, `ErrorFilterModule`) in the correct order.
Every backend service imports it as its ONE infrastructure line.

Anchor ADR: [ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md).

### Tasks

- [ ] **15.1** — Scaffold `packages/nest-service/` — one `.` subpath + one
      `./testing` subpath. Author: `framework-core-builder`.
- [ ] **15.2** — Author `StackraServiceModule.forRoot(options)` composing the
      seven modules in the ADR-0092 order. Author: `framework-core-builder`.
- [ ] **15.3** — Author `IServiceOptions` interface — deposited under
      `packages/contracts/src/interfaces/service-options.interface.ts`. Author:
      `framework-core-builder`.
- [ ] **15.4** — Migrate `services/approval/src/app.module.ts` to import
      `StackraServiceModule.forRoot({...})` instead of the seven modules
      individually. Author: `framework-core-builder`.
- [ ] **15.5** — Author `packages/nest-service/README.md` + one smoke test per
      service. Author: `docs-changesets-steward` + `vitest-test-engineer`.

---

## Cross-cutting rollout order

Tasks depend on each other. Ship in this order to avoid rework:

1. **Task 4** — `.kiro` triage. Lean rule surface first, so subsequent tasks
   aren't buried by aspirational rules.
2. **Task 5** — Root config review. Fix drift before scripts and templates lean
   on them.
3. **Task 1 (all subtasks)** — `@stackra/testing` package + presets + consumer
   migration + README + turbo filter scripts. ✅ **COMPLETE 2026-09-03**.
   Package ships v1.0.0 with 13 subpath exports; build + typecheck + 185/185
   tests green.
4. **Task 6** — `@stackra/contracts` full architecture. Unblocks 13+14
   (`@stackra/container` + `@stackra/logger` import contracts).
5. **Task 13** — `@stackra/container`. Foundation for 14 (logger discovery) + 15
   (composite).
6. **Task 14** — `@stackra/logger`. Depends on 13. Ships alongside 15.
7. **Task 15** — `@stackra/nest-service` composite. Depends on 13 + 14.
8. **Task 7** — Sweep config-package standardisation.
9. **Task 2** — `.templates/` scaffolds + `.vscode/workspaces/`. Requires 6 + 1
   (templates consume both).
10. **Task 8 + 9 + 10** — Infrastructure cleanup (parallel).
11. **Task 3.1 + 3.2** — Scripts catalogue + `_lib` documentation. (3.3+
    SKIPPED.)
12. **Task 11** — `@stackra/database` scaffold. Depends on 13 (needs
    `IContainerResolver` + `IDiscoveryService`).
13. **Task 12** — Migration base class + query builder (part of 11 but
    sequential).
14. **`@stackra/coordinator`**
    ([sibling plan](./2026-09-03-coordinator-package.md)) — cross-tab primitive.
    Depends on 13 + `@stackra/support`. Ships before events + realtime because
    both compose it as an OPTIONAL peer.
15. **`@stackra/events` + `@stackra/realtime`** — event bus + realtime
    transports. Both compose coordinator when installed (cross-tab relay +
    leader-only WebSocket).
16. **`@stackra/config`** with cloud-secret drivers
    ([sibling plan](./2026-09-03-config-package.md)) — ships alongside
    `@stackra/settings` because both surface user- vs developer-editable state.
17. **`@stackra/settings`** ([sibling plan](./2026-09-03-settings-package.md)) —
    runtime user-editable settings + schema-driven HeroUI admin UI. Depends on
    `@stackra/storage`, `@stackra/http`, `@stackra/authorization`; OPTIONAL peer
    on `@stackra/realtime` for cross-client sync.
18. **~~Task 1.7–1.9 + 1.11 + 1.13 + 1.14~~** — ✅ Complete. `@stackra/testing`
    fixtures + README shipped 2026-09-03; step retired.

### Blockers to flag

- **`@stackra/database/worker` needs `@mikro-orm/cloudflare-d1`** — verify the
  driver's Worker bundle behaviour BEFORE committing to the uniform-ORM story.
  If it doesn't build clean, fall back to `env.DB.exec()` + the fluent Schema.
- **Task 4 (move steering docs to `.ref/`)** could break in-flight PRs that
  reference them. Coordinate — do this as a single sweep, not piecemeal.
- **Task 8 path renames** cascade through `Makefile`, `docker.mk`,
  `terraform.mk`, `package.json` scripts. Sweep every reference in ONE commit.

---

## Owning agents by task

| Task        | Owning agent(s)                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1           | `framework-core-builder` (scaffold + presets), `vitest-test-engineer` (migrate configs)                                        |
| 2           | `framework-core-builder`, `heroui-ui-builder` (app-vite template), `workspace-standardization-steward` (vscode workspaces)     |
| 3           | `docs-changesets-steward` (README + `_lib` docs); 3.3 SKIPPED                                                                  |
| 4           | `workspace-standardization-steward` (moves), `docs-changesets-steward` (indexes)                                               |
| 5           | `workspace-standardization-steward`, `docs-adr-steward` (ADR)                                                                  |
| 6           | `framework-core-builder`, `code-documentation-writer` (JSDoc)                                                                  |
| 7           | `workspace-standardization-steward`                                                                                            |
| 8           | `workspace-standardization-steward`                                                                                            |
| 9           | `docs-adr-steward`                                                                                                             |
| 10          | `workspace-standardization-steward`                                                                                            |
| 11          | `framework-core-builder`, `vitest-test-engineer` — sibling plan owns full architecture                                         |
| 12          | `framework-core-builder`, `vitest-test-engineer` — sibling plan owns full architecture                                         |
| 13          | `framework-core-builder`, `code-documentation-writer`, `vitest-test-engineer` — sibling plan owns full architecture            |
| 14          | `framework-core-builder`, `code-documentation-writer`, `vitest-test-engineer` — sibling plan owns full architecture            |
| 15          | `framework-core-builder`, `vitest-test-engineer`                                                                               |
| coordinator | `framework-core-builder`, `vitest-test-engineer` — sibling plan owns full architecture                                         |
| settings    | `framework-core-builder`, `heroui-ui-builder` (`<SettingsForm>`), `vitest-test-engineer` — sibling plan owns full architecture |

Every task's tick lands as its own commit (per `commit-conventions.md` §Rule 3 —
per-writer granularity, no multi-domain mixing). Every commit includes a
provenance line per `provenance-frontmatter.md`.
