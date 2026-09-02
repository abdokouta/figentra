# AGENT_ROSTER.md — every specialist agent in the workspace

> One-liner per agent + lane + when to invoke. Sourced from each charter's
> frontmatter `description`. For task-class → agent routing decisions, see
> [`.kiro/agents/ROUTING.md`](.kiro/agents/ROUTING.md).

**56 specialist charters** (+ 5 built-in agents), grouped by lane. Each charter
lives at `.kiro/agents/<slug>.md`. Invoke via `invoke_sub_agent(name: "<slug>")`
(Kiro) or reference by charter file in any other agent runtime.

## Leads (advisory, routing, exit-gates) — 10

Advisory only; do NOT invoke for implementation.

| Agent                | Owns                                                                                                                                                                        | Phase         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `chief-orchestrator` | Routing brain — decides which sub-agent picks up which task, exit gates, reviewer non-overlap                                                                               | Cross-phase   |
| `product-lead`       | Front half of the pipeline — raw brief → PRD engineering can act on + customer DPO can sign                                                                                 | Phase 1-2     |
| `design-lead`        | Product design, content, API contracts, IA, accessibility. Manages product-designer/content-designer/api-contract-designer/ui-design-a11y-reviewer/accessibility-audit-lead | Phase 3       |
| `data-lead`          | Shape of every persisted row. Manages data-modeler + data-scientist-reviewer                                                                                                | Phase 3, 7    |
| `security-lead`      | Threat modelling + security reviews + minor-data controls                                                                                                                   | Phase 3, 5, 7 |
| `delivery-lead`      | BUILD across four repos — manages builder/steward/test-writer ensembles                                                                                                     | Phase 4       |
| `quality-lead`       | VERIFY phase — every reviewer/auditor + phase gate                                                                                                                          | Phase 5       |
| `docs-lead`          | Docs where words become contracts — manages docs stewards + translator                                                                                                      | Phase 3, 6    |
| `sre-lead`           | SLIs/SLOs, runbooks, on-call, DR drills                                                                                                                                     | Phase 7       |
| `stackra-product`    | Enterprise product PM/PO/BA — domain modelling, scoping, compliance                                                                                                         | Cross-phase   |

## Builders (write source code) — 5

Invoke for feature work + refactors. Every builder respects the sibling
steward + reviewer in its lane.

| Agent                           | Writes                                                                                          | Stack                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------- |
| `framework-core-builder`        | Non-UI framework packages (container, http, queue, cache, network, ...)                         | TypeScript                            |
| `go-terraform-provider-builder` | Terraform HCL modules + env-root compositions + custom providers for the Cloudflare/Supabase/Doppler stack | Go + Terraform Plugin Framework + HCL |
| `heroui-ui-builder`             | HeroUI + HeroUI Pro React components in `@stackra/ui` + vite-example                            | React 19                              |
| `heroui-native-builder`         | HeroUI Native + Native Pro mobile screens/nav                                                   | React Native + Expo                   |
| `python-service-builder`        | FastAPI endpoints + LangGraph flows + sensitivity-tagged tools                                  | Python + uv                           |

## Reviewers (read-only audits — produce reports) — 9

Every reviewer produces a written report; NEVER modifies code.

| Agent                                | Audits                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `container-di-architecture-reviewer` | @stackra/container DI + framework architecture in stackra-frontend                                     |
| `data-scientist-reviewer`            | AI service prompt design + evaluation harnesses + statistical rigour                                   |
| `env-naming-steward`                 | Cross-repo env-var + secret naming against ADR-0085 + `.kiro/steering/env-naming.md`                   |
| `frontend-package-auditor`           | Every `@stackra/*` frontend package — subpath layering + public API + i18n + dependency classification |
| `mlops-reviewer`                     | AI service deploy footprint, observability, canary + rollback, cost + latency                          |
| `native-platform-reviewer`           | Mobile surface (apps/mobile/\*\*) — Metro resolution, bundle safety, deep-links, store readiness       |
| `package-api-release-reviewer`       | Publishable package surface — exports maps, tsup, tree-shaking, changesets, licensed-postinstall       |
| `security-compliance-reviewer`       | PAT + JWT + RBAC + tenancy isolation + Doppler + minor consent + retention                             |
| `ui-design-a11y-reviewer`            | React/HeroUI UI in stackra-frontend — design taste + theming + accessibility                           |

## Stewards (write MECHANICAL fixes across a codebase) — 6

Move / rename / normalize. NEVER change behaviour.

| Agent                               | Normalises                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `brand-system-steward`              | `brand/**` — pages + assets + catalog compliance + 28-slot discipline + new-brand onboarding |
| `code-standards-steward`            | @stackra/\* packages — one-export-per-file, suffix-per-kind, folder taxonomy, barrels        |
| `docs-adr-steward`                  | ADRs + steering + contract schemas in the backend monorepo                                   |
| `docs-changesets-steward`           | README, LICENSE, changesets, CHANGELOG, steering in stackra-frontend                         |
| `support-utilities-steward`         | Native/third-party utility calls → canonical `@stackra/support` helpers                      |
| `workspace-standardization-steward` | package.json / tsconfig.json / tsup.config.ts / vitest.config.ts against one template        |

## Engineers (specialised writers — narrow scope) — 7

Own a specific deliverable class; write code within their lane.

| Agent                    | Ships                                                                           |
| ------------------------ | ------------------------------------------------------------------------------- |
| `analytics-engineer`     | Feature adoption instrumentation + analytics catalogue + tenant-safe dashboards |
| `deploy-engineer`        | Infrastructure-as-code + canary/promote/rollback + deployment automation        |
| `e2e-test-engineer`      | Playwright (web) + Detox (RN) suites against canary envs                        |
| `native-test-engineer`   | Jest + RN Testing Library + Detox tests for mobile                              |
| `observability-engineer` | Sentry + Grafana + tracing pipelines + alert configs + dashboards               |
| `performance-engineer`   | Lighthouse budgets + k6 load tests + bundle-size limits                         |
| `vitest-test-engineer`   | Vitest v4 + React Testing Library on frontend                                   |

## Writers (documents + copy) — 10

Author markdown / text artefacts. Do not modify feature code.

| Agent                       | Writes                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ar-native-reviewer`        | Native-MSA review + rewrite of Arabic translations in the academorix landing app — reports at `.kiro/reports/ar-native-review-<date>-<slug>.md`; rewrites `ar:` slices in-place in opt-in mode      |
| `code-documentation-writer` | Inline code documentation across frontend packages — top-of-file + JSDoc on every public export                                                                                                     |
| `content-designer`          | Voice, terminology, microcopy, empty/error/loading/success states across every surface                                                                                                              |
| `en-copy-editor`            | English copy editor + Academorix brand-voice enforcer for `en:` slices + `en/*.json` catalogs                                                                                                       |
| `market-research-analyst`   | Competitive matrix, positioning, pricing intelligence                                                                                                                                               |
| `product-designer`          | IA, user flows, wireframes-as-markdown, screen contracts                                                                                                                                            |
| `ru-native-reviewer`        | Native-Russian review + rewrite of Russian translations in the academorix landing app — reports at `.kiro/reports/ru-native-review-<date>-<slug>.md`; rewrites `ru:` slices in-place in opt-in mode |
| `spec-intake-analyst`       | Raw brief → structured intake set (Phase 0)                                                                                                                                                         |
| `translator`                | Per-package i18n catalogs — en.json + ar.json under `src/core/i18n/`                                                                                                                                |
| `ux-research-lead`          | User interviews, personas, jobs-to-be-done, user-research artefacts                                                                                                                                 |

## Officers + Governance (compliance, security, incident) — 9

Cross-cutting authority; produce documents + reports.

| Agent                        | Owns                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `accessibility-audit-lead`   | WCAG 2.2 AA audit — axe-core, screen-reader passes, keyboard-only drills            |
| `api-contract-designer`      | Cross-service JSON Schema contracts + OpenAPI fragments                             |
| `data-modeler`               | ERDs, column contracts, migration order, three-axis attribution enforcement         |
| `incident-commander`         | SEV-1/SEV-2 response — war room, post-mortem, corrective actions                    |
| `legal-compliance-officer`   | Phase 7 regime evidence — GDPR, FERPA, COPPA, CCPA, PCI-DSS, WCAG, SOC 2, ISO 27001 |
| `release-manager`            | Version bumps + changelog roll-ups + release notes (Phase 6)                        |
| `solution-architect`         | Pre-code ADRs + cross-cutting design decisions + sequencing plans                   |
| `support-liaison`            | Human-in-the-loop between support surface + engineering pipeline                    |
| `threat-modeler`             | STRIDE + attack-tree passes at Phase 3                                              |

## Meta (built-in agents — about the workspace itself) — 5

| Agent                    | Purpose                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| `general-task-execution` | Fallback sub-agent with access to all tools for arbitrary delegated tasks       |
| `context-gatherer`       | Explores repository structure to identify relevant files for a user issue       |
| `custom-agent-creator`   | Authors new custom agent charters                                               |
| `introspect`             | Answers questions about Kiro itself (Kiro slash commands, .kiro/ config)        |
| `semantic_reviewer`      | Reviews code changes at the behavioural level — narrative-organized, cross-file |

## Cross-references

- [`AGENTS.md`](AGENTS.md) — the universal AI-agent entry point.
- [`.kiro/BOOT.md`](.kiro/BOOT.md) — session-start orientation.
- [`.kiro/agents/ROUTING.md`](.kiro/agents/ROUTING.md) — task-class → agent
  routing table.
- [`.kiro/agents/INDEX.md`](.kiro/agents/INDEX.md) — every agent grouped by lane
  (same lanes as above, alphabetical within lane).
- [`.kiro/agents/README.md`](.kiro/agents/README.md) — invocation model +
  session-wide guardrails.
