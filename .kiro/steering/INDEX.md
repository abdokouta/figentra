# Steering INDEX — 59 rule docs classified by scope

> **The steering surface at a glance.** Every rule in the workspace lives under
> `.kiro/steering/`. This INDEX classifies each by scope so an agent loads only
> the rules relevant to the file it's touching. Do NOT read all 59 at boot.

Kiro's `inclusion: fileMatch` frontmatter drives per-file auto-loading; this
INDEX documents which docs SHOULD auto-load for which paths + provides the
manual-load reference for Claude Code / other agents.

## Scopes

Every doc has ONE primary scope. Some apply cross-cuttingly.

- **`always`** — applies to every session, regardless of file touched.
- **`meta`** — rules about the workspace / kiro system / naming itself.
- **`backend`** — TypeScript Cloudflare Workers (+ Go / Python) + Supabase
  Postgres. Auto-load on `services/**` + `backend/**` paths.
- **`frontend`** — TypeScript + React + `@stackra/*` packages. Auto-load on
  `packages/frontend/**` + `frontend/**` paths.
- **`native`** — React Native + Expo. Auto-load on
  `packages/frontend/*/src/native/**` + `mobile/**` paths.
- **`cloud`** — Cloudflare zone + edge + Pages + Terraform. Auto-load on
  `terraform/**` + `.kiro/cloud/` paths.
- **`observability`** — signal taxonomy + growth. Auto-load on observability /
  analytics paths.

## Always-on (11 docs)

Load on every session, regardless of task. Foundational conventions.

| Doc                                                      | Owns                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| [`brand-hierarchy.md`](brand-hierarchy.md)               | Figentra / Stackra / Academorix three-brand model                  |
| [`commit-conventions.md`](commit-conventions.md)         | Conventional commits + emoji table + protected paths               |
| [`communication-patterns.md`](communication-patterns.md) | Three-lane rule — DI vs context vs events                          |
| [`conventions.md`](conventions.md)                       | TypeScript / Testing / Git baseline                                |
| [`documentation.md`](documentation.md)                   | Documentation + docblock rules                                     |
| [`env-naming.md`](env-naming.md)                         | Workspace-wide env-var + secret naming (ADR-0085)                  |
| [`hierarchy.md`](hierarchy.md)                           | Platform tree — Application / Tenant / Org / Branch / ...          |
| [`module-lifecycle.md`](module-lifecycle.md)             | `OnModuleInit` / `OnApplicationBootstrap` / ADR-0052               |
| [`priority-ordering.md`](priority-ordering.md)           | How to resolve conflicts between rules                             |
| [`shell-commands.md`](shell-commands.md)                 | **Guardrail** — no `for`/`while` in tool-invoked shell             |
| [`tmp-files.md`](tmp-files.md)                           | **Guardrail** — every temp file lands under `.tmp/`, never `/tmp/` |

## Meta (17 docs)

Rules about the workspace itself, the AI-agent surface, naming, tooling.

| Doc                                                                              | Owns                                                                                               |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`architecture.md`](architecture.md)                                             | Root architecture rationale (TypeScript / Cloudflare / Turborepo)                                  |
| [`ai-agent-governance.md`](ai-agent-governance.md)                               | MAY vs MUST-escalate for AI agents                                                                 |
| [`auth-tenancy-composition.md`](auth-tenancy-composition.md)                     | Auth-tenancy layering — auth Layer 1 standalone; tenancy Layer 2 optional (ADR-0090-0096)          |
| [`brand-system.md`](brand-system.md)                                             | `brand/**` canonical structure — 28-slot catalog + 5-slot container (ADR-0103)                     |
| [`canonical-deployable-slug.md`](canonical-deployable-slug.md)                   | One deployable slug across Sentry / Doppler / Cloudflare / Terraform                               |
| [`catalog-manifest.md`](catalog-manifest.md)                                     | `catalog.json` per package (frontend)                                                              |
| [`changesets-flow.md`](changesets-flow.md)                                       | Changesets authoring + release flow                                                                |
| [`contract-implementer-split.md`](contract-implementer-split.md)                 | Light-tier + heavy-tier package pattern                                                            |
| [`contract-reexports.md`](contract-reexports.md)                                 | No re-exports of contract symbols in feature packages                                              |
| [`contracts-and-decorators-promotion.md`](contracts-and-decorators-promotion.md) | When to move symbols to `@stackra/contracts` / `@stackra/decorators`                               |
| [`discovery-vs-loader.md`](discovery-vs-loader.md)                               | Naming convention — Discovery (framework) vs Loader (adapter)                                      |
| [`heroui-pro-license.md`](heroui-pro-license.md)                                 | HeroUI Pro license constraint                                                                      |
| [`module-graph.md`](module-graph.md)                                             | Cross-package dependency graph                                                                     |
| [`module-partitioning.md`](module-partitioning.md)                               | How modules split (across services)                                                                |
| [`package-naming.md`](package-naming.md)                                         | npm vendor-scope rules (`@stackra` / `@figentra` / `@academorix`)                                  |
| [`provenance-frontmatter.md`](provenance-frontmatter.md)                         | Provenance YAML frontmatter for agent-authored artefacts                                           |
| [`repo-hygiene.md`](repo-hygiene.md)                                             | Audit / sync / prune workflow — `audit-repos.mjs`, `sync-branches.mjs`, `prune-stale-branches.mjs` |

## Backend (TypeScript Workers + Go / Python + Supabase) — 8 docs

Auto-load on `services/**`, `backend/**`.

| Doc                                                                    | Owns                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`cross-service-events.md`](cross-service-events.md)                   | Cross-service cascade event contract (ADR-0089) — event vocabulary + listener + DLQ    |
| [`data-ownership.md`](data-ownership.md)                               | Cross-service FK ban + row-ownership catalog (ADR-0089)                                |
| [`doppler.md`](doppler.md)                                             | Doppler per-deployable (ADR-0056)                                                      |
| [`localization-content-strategy.md`](localization-content-strategy.md) | Backend i18n content strategy (Supabase-stored translatable content)                   |
| [`scope.md`](scope.md)                                                 | Scope substrate — `scopedTo()`, `ScopeContext`                                         |
| [`service-boundary.md`](service-boundary.md)                           | Service-boundary via per-service OpenAPI YAML (ADR-0087) — 4-seam contract             |
| [`tenancy-columns.md`](tenancy-columns.md)                             | Three-axis attribution (`tenant_id`/`application_id`/`scope_node_id`) — ADR-0027, 0031 |
| [`ulid-prefix-registry.md`](ulid-prefix-registry.md)                   | ULID prefix registry (3-letter prefixes per aggregate)                                 |

## Frontend (@stackra/\* + React) — 18 docs

Auto-load on `packages/frontend/**`, `frontend/**`.

| Doc                                                                              | Owns                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`browser-safe-imports.md`](browser-safe-imports.md)                             | Browser bundle safety (no `node:*`)                          |
| [`code-standards.md`](code-standards.md)                                         | Folder taxonomy + one-export-per-file                        |
| [`dashboard-widgets.md`](dashboard-widgets.md)                                   | Dashboard widget contribution model                          |
| [`events-authoring.md`](events-authoring.md)                                     | Event catalogue — `<name>.events.ts` + payload types         |
| [`frontend-localization.md`](frontend-localization.md)                           | Per-package i18n catalogs (`src/core/i18n/{en,ar}.json`)     |
| [`frontend-module-architecture.md`](frontend-module-architecture.md)             | Frontend module architecture (Vite + React + Refine app-tier) |
| [`frontend-package-audit-checklist.md`](frontend-package-audit-checklist.md)     | The 20-section audit checklist                               |
| [`frontend-packages.md`](frontend-packages.md)                                   | Frontend package doctrine (ADR-0023)                         |
| [`navigation-catalog.md`](navigation-catalog.md)                                 | Navigation contribution — menus / zones                      |
| [`package-conventions.md`](package-conventions.md)                               | `@stackra/*` package shape (module + config trio, tsup/vitest) |
| [`package-json-conventions.md`](package-json-conventions.md)                     | package.json per tier                                        |
| [`state-storage-coordinator-standard.md`](state-storage-coordinator-standard.md) | Three-lane rule (state / storage / coordinator)              |
| [`storage-usage.md`](storage-usage.md)                                           | `@stackra/storage` — every read/write routes through it      |
| [`subpath-layering.md`](subpath-layering.md)                                     | Subpath dependency direction (core → react → native/testing) |
| [`support-utilities.md`](support-utilities.md)                                   | `@stackra/support` — canonical utility helpers               |
| [`testing.md`](testing.md)                                                       | Frontend testing framework + `@stackra/testing` preset       |
| [`ui-components.md`](ui-components.md)                                           | HeroUI + component composition rules                         |
| [`zones-catalog.md`](zones-catalog.md)                                           | Zone contribution — `<Zone>` + `IZoneContribution`           |

## Native (React Native + Expo) — 1 doc

Auto-load on `packages/frontend/*/src/native/**`, `mobile/**`.

| Doc                                                                                  | Owns                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`react-native-package-audit-checklist.md`](react-native-package-audit-checklist.md) | The React Native-specific audit checklist |

## Cloud + Edge (Cloudflare + Terraform) — 1 doc

Auto-load on `terraform/**` + `.kiro/cloud/`.

| Doc                                                      | Owns                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`cloudflare-conventions.md`](cloudflare-conventions.md) | Cloudflare zone + edge baseline (WAF, HSTS, rate limits, proxied DNS, Cache Rules, Pages) |

## Observability + Growth — 3 docs

Cross-cutting. Auto-load on any observability / analytics-related path.

| Doc                                                          | Owns                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| [`growth-and-observability.md`](growth-and-observability.md) | Growth signals vs observability signals boundary         |
| [`growth-signals.md`](growth-signals.md)                     | Growth-specific event emission rules                     |
| [`observability-signals.md`](observability-signals.md)       | Three signals, one substrate (audit / activity / traces) |

## By auto-load pattern

Kiro's `inclusion: fileMatch` maps like this:

| Pattern touched                     | Docs auto-loaded (in addition to always-on 11)     |
| ----------------------------------- | -------------------------------------------------- |
| `services/**`, `backend/**`         | Backend (8) + Meta                                 |
| `packages/frontend/**`              | Frontend (18) + Meta                               |
| `packages/frontend/*/src/native/**` | Frontend (18) + Native (1)                         |
| `mobile/**`                         | Frontend (18) + Native (1)                         |
| `ai/**`                             | Backend (8) + Meta (Python AI service)             |
| `terraform/**`, `.kiro/cloud/`      | Cloud + Edge (1) + Meta                            |
| `.docs/adr/**`                      | Always-on + Meta                                   |
| `.kiro/**`                          | Always-on + Meta (workspace itself)                |
| any observability / analytics path  | Observability + Growth (3)                         |

## When to consult which

- **New session, first tool call:** BOOT.md read the always-on 11. Load
  scope-specific docs on demand.
- **About to touch a specific file:** consult the pattern table above → load
  those docs before editing.
- **Cross-cutting question:** load Meta section as needed.
- **When in doubt:** consult [`priority-ordering.md`](priority-ordering.md).

## Related

- [`AGENTS.md`](../../AGENTS.md) — universal entry point.
- [`BOOT.md`](../BOOT.md) — session-start orientation.
- [`../agents/ROUTING.md`](../agents/ROUTING.md) — task-class → agent map.
- [`../../.docs/adr/`](../../.docs/adr/) — architecture decisions.
