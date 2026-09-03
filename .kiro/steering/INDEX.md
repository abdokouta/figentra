# Steering INDEX — lean base set (31 rule docs)

> **Every rule the workspace actively enforces lives here.** Aspirational /
> product-specific / not-yet-scoped docs live in `.ref/steering/` for later
> review. Promote back into `.kiro/steering/` when the concern lands.

## Always-on (11 docs)

| Doc                         | Owns                                                 |
| --------------------------- | ---------------------------------------------------- |
| `brand-hierarchy.md`        | Figentra / Stackra / Academorix three-brand model    |
| `commit-conventions.md`     | Conventional commits + emoji table + protected paths |
| `communication-patterns.md` | Three-lane rule — DI vs context vs events            |
| `conventions.md`            | TypeScript / Testing / Git baseline                  |
| `documentation.md`          | Docblock + JSDoc rules                               |
| `env-naming.md`             | Workspace-wide env-var + secret naming (ADR-0085)    |
| `hierarchy.md`              | Platform tree — Application / Tenant / Org / Branch  |
| `module-lifecycle.md`       | OnModuleInit / OnApplicationBootstrap / ADR-0052     |
| `priority-ordering.md`      | How to resolve conflicts between rules               |
| `shell-commands.md`         | **Guardrail** — no for/while in tool-invoked shell   |
| `tmp-files.md`              | **Guardrail** — every temp file under `.tmp/`        |

## Meta (8 docs)

| Doc                           | Owns                                         |
| ----------------------------- | -------------------------------------------- |
| `architecture.md`             | Root architecture rationale                  |
| `ai-agent-governance.md`      | MAY vs MUST-escalate for AI agents           |
| `provenance-frontmatter.md`   | Provenance YAML for agent-authored artefacts |
| `catalog-manifest.md`         | `catalog.json` per package                   |
| `changesets-flow.md`          | Changesets authoring + release flow          |
| `package-naming.md`           | npm vendor-scope rules                       |
| `package-json-conventions.md` | package.json per tier                        |
| `service-boundary.md`         | Per-service OpenAPI contracts                |

## Backend (5 docs)

| Doc                             | Owns                                         |
| ------------------------------- | -------------------------------------------- |
| `cross-service-events.md`       | Cross-service cascade event contract         |
| `data-ownership.md`             | Cross-service FK ban + row-ownership catalog |
| `doppler.md`                    | Doppler per-deployable                       |
| `tenancy-columns.md`            | Three-axis attribution                       |
| `contract-implementer-split.md` | Light-tier + heavy-tier package pattern      |

## Frontend (7 docs)

| Doc                                     | Owns                                  |
| --------------------------------------- | ------------------------------------- |
| `code-standards.md`                     | Folder taxonomy + one-export-per-file |
| `contract-reexports.md`                 | No re-exports of contract symbols     |
| `contracts-and-decorators-promotion.md` | When symbols move to contracts        |
| `discovery-vs-loader.md`                | Discovery vs Loader naming            |
| `package-conventions.md`                | @stackra/* package shape              |
| `subpath-layering.md`                   | Subpath dependency direction          |
| `testing.md`                            | Vitest + @stackra/testing preset      |

## Aspirational docs → `.ref/steering/`

28 docs that cover concerns not yet active in this workspace (mobile, HeroUI,
zones, navigation, dashboard widgets, growth signals, SDUI, etc.) live at
[`.ref/steering/`](../../.ref/steering/). Promote back when the concern lands.
