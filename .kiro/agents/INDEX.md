# INDEX — 56 charters + 5 built-in agents grouped by lane

> **Alphabetical-within-lane view of every agent charter.** For task-class →
> agent decisions, use [`ROUTING.md`](ROUTING.md). For one-liner descriptions,
> use [`../../AGENT_ROSTER.md`](../../AGENT_ROSTER.md).

Every agent's charter lives at `.kiro/agents/<slug>.md`. Invoke via
`invoke_sub_agent(name: "<slug>")` (Kiro) or reference the charter file directly
(Claude Code / others).

## Leads — 10 (advisory only; NEVER write code)

Own phase gates + routing + escalation.

- [`chief-orchestrator`](chief-orchestrator.md) — routing brain, exit gates,
  reviewer non-overlap
- [`data-lead`](data-lead.md) — shape of every persisted row, ERDs, analytics
  catalogs
- [`delivery-lead`](delivery-lead.md) — Phase 4 BUILD across four repos
- [`design-lead`](design-lead.md) — Phase 3 DESIGN (product / content / IA /
  a11y / API contracts)
- [`docs-lead`](docs-lead.md) — Phase 3 + 6 docs (ADRs, steering, changesets,
  contracts)
- [`product-lead`](product-lead.md) — Phase 1 DISCOVERY + Phase 2 DEFINITION
- [`quality-lead`](quality-lead.md) — Phase 5 VERIFY
- [`security-lead`](security-lead.md) — threat modelling + security reviews +
  minor-data controls
- [`sre-lead`](sre-lead.md) — Phase 7 OPERATE (SLIs / SLOs / runbooks / DR)
- [`stackra-product`](stackra-product.md) — enterprise product (PM + PO + BA)

## Builders — 5 (WRITE code)

Author features + refactors. Every builder respects sibling steward + reviewer.

- [`framework-core-builder`](framework-core-builder.md) — non-UI `@stackra/*`
  (container / http / queue / cache / network / ...) + TypeScript Worker services
- [`go-terraform-provider-builder`](go-terraform-provider-builder.md) — Go
  Terraform custom providers + HCL modules + env-root compositions for the
  Cloudflare / Supabase / Doppler stack
- [`heroui-native-builder`](heroui-native-builder.md) — React Native + HeroUI
  Native / Native Pro
- [`heroui-ui-builder`](heroui-ui-builder.md) — React + HeroUI / HeroUI Pro
- [`python-service-builder`](python-service-builder.md) — FastAPI + LangGraph AI
  service

## Reviewers — 9 (READ-only; produce reports)

- [`container-di-architecture-reviewer`](container-di-architecture-reviewer.md)
  — `@stackra/container` DI + framework architecture
- [`data-scientist-reviewer`](data-scientist-reviewer.md) — AI prompt design +
  evaluation harnesses
- [`env-naming-steward`](env-naming-steward.md) — cross-repo env-var + secret
  naming against ADR-0085
- [`frontend-package-auditor`](frontend-package-auditor.md) — every `@stackra/*`
  package against the 20-section checklist
- [`mlops-reviewer`](mlops-reviewer.md) — AI service deploy + observability +
  canary + cost + latency
- [`native-platform-reviewer`](native-platform-reviewer.md) — mobile Metro +
  bundle + deep-links + store readiness
- [`package-api-release-reviewer`](package-api-release-reviewer.md) —
  publishable package surface + tsup + tree-shake
- [`security-compliance-reviewer`](security-compliance-reviewer.md) — PAT +
  JWT + RBAC + tenancy + Doppler + minor consent
- [`ui-design-a11y-reviewer`](ui-design-a11y-reviewer.md) — React/HeroUI design
  taste + theming + component a11y

## Stewards — 6 (WRITE mechanical fixes; never change behaviour)

- [`brand-system-steward`](brand-system-steward.md) — `brand/**` pages +
  assets + 28-slot catalog compliance + new-brand onboarding
- [`code-standards-steward`](code-standards-steward.md) — one-export-per-file +
  folder taxonomy + barrels (frontend)
- [`docs-adr-steward`](docs-adr-steward.md) — ADRs + steering + contract schemas
  (backend)
- [`docs-changesets-steward`](docs-changesets-steward.md) — READMEs + LICENSE +
  changesets + CHANGELOG (frontend)
- [`support-utilities-steward`](support-utilities-steward.md) — migrate native
  calls → `@stackra/support`
- [`workspace-standardization-steward`](workspace-standardization-steward.md) —
  package.json / tsconfig.json / tsup.config.ts / vitest.config.ts

## Engineers — 7 (specialised writers — narrow scope)

- [`analytics-engineer`](analytics-engineer.md) — feature-adoption
  instrumentation + analytics catalogue + dashboards
- [`deploy-engineer`](deploy-engineer.md) — IaC + canary / promote / rollback +
  deployment automation
- [`e2e-test-engineer`](e2e-test-engineer.md) — Playwright (web) + Detox (RN)
  suites
- [`native-test-engineer`](native-test-engineer.md) — Jest + RN Testing
  Library + Detox
- [`observability-engineer`](observability-engineer.md) — Sentry + Grafana +
  tracing + alerts + dashboards
- [`performance-engineer`](performance-engineer.md) — Lighthouse budgets + k6 +
  bundle-size
- [`vitest-test-engineer`](vitest-test-engineer.md) — Vitest v4 + React Testing
  Library

## Writers — 10 (author markdown / text artefacts)

- [`ar-native-reviewer`](ar-native-reviewer.md) — native-MSA Arabic translation
  review + rewrite
- [`code-documentation-writer`](code-documentation-writer.md) — inline
  docblocks + JSDoc across a package
- [`content-designer`](content-designer.md) — voice + terminology + microcopy +
  empty/error/loading/success states
- [`en-copy-editor`](en-copy-editor.md) — English copy editor + brand-voice
  enforcer for `en:` slices + catalogs
- [`market-research-analyst`](market-research-analyst.md) — competitive matrix +
  positioning + pricing intel
- [`product-designer`](product-designer.md) — IA + user flows +
  wireframes-as-markdown + screen contracts
- [`ru-native-reviewer`](ru-native-reviewer.md) — native-Russian translation
  review + rewrite
- [`spec-intake-analyst`](spec-intake-analyst.md) — raw brief → structured
  intake set (Phase 0)
- [`translator`](translator.md) — per-package i18n catalogs (en.json + ar.json)
- [`ux-research-lead`](ux-research-lead.md) — user interviews + personas +
  JTBD + user-research artefacts

## Officers + Governance — 9 (compliance / security / incident / cross-cutting)

- [`accessibility-audit-lead`](accessibility-audit-lead.md) — WCAG 2.2 AA audit
  (axe + screen reader + keyboard)
- [`api-contract-designer`](api-contract-designer.md) — cross-service JSON
  Schema + OpenAPI fragments
- [`data-modeler`](data-modeler.md) — ERDs + column contracts + migration
  order + three-axis enforcement
- [`incident-commander`](incident-commander.md) — SEV-1 / SEV-2 response + war
  room + post-mortem
- [`legal-compliance-officer`](legal-compliance-officer.md) — Phase 7 regime
  evidence + DSAR + erasure + retention
- [`release-manager`](release-manager.md) — version bumps + changelog roll-ups +
  release notes
- [`solution-architect`](solution-architect.md) — pre-code ADRs + cross-cutting
  design + sequencing
- [`support-liaison`](support-liaison.md) — human-in-the-loop between support
  surface + engineering pipeline
- [`threat-modeler`](threat-modeler.md) — STRIDE + attack-tree at Phase 3

## Meta — 5 (built-in system / routing / delegation agents)

These are Kiro-runtime built-in agents rather than product-domain specialists
(no charter file under `.kiro/agents/`):

- **`context-gatherer`** — explores repository structure to identify relevant
  files
- **`custom-agent-creator`** — authors new custom agent charters
- **`general-task-execution`** — fallback for arbitrary delegated tasks
- **`introspect`** — answers questions about Kiro itself (Kiro-specific)
- **`semantic_reviewer`** — reviews code changes at the behavioural level
  (Kiro-specific)

## Cross-references

- [`README.md`](README.md) — invocation model + reviewer non-overlap matrix +
  charter authoring rules
- [`ROUTING.md`](ROUTING.md) — task-class → agent decision tree
- [`../../AGENT_ROSTER.md`](../../AGENT_ROSTER.md) — one-liner-per-agent roster
- [`../../AGENTS.md`](../../AGENTS.md) — universal entry point
- [`../BOOT.md`](../BOOT.md) — session-start orientation
- [`../product/agent-personas.md`](../product/agent-personas.md) —
  human-readable dossier
