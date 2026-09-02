# ROUTING.md — task-class → agent decision tree

> **Read this before invoking any sub-agent.** For any new task, find the row in
> the table below that matches — it names the ONE agent that owns it.

If a task doesn't match any row cleanly, walk the decision tree at the bottom.
Never route the same task to two agents in parallel unless the roster (§Reviewer
non-overlap, `.kiro/agents/README.md`) explicitly permits.

## Common task classes

### "Add / modify / test code"

| Task                                                           | Agent                           | Repo       |
| -------------------------------------------------------------- | ------------------------------- | ---------- |
| Add a backend service feature (Cloudflare Worker, TypeScript)  | `framework-core-builder`        | backend    |
| Add a `@stackra/*` non-UI framework package                    | `framework-core-builder`        | frontend   |
| Add a React component in `@stackra/ui` or apps                 | `heroui-ui-builder`             | frontend   |
| Add a React Native screen or navigation                        | `heroui-native-builder`         | mobile     |
| Add a FastAPI endpoint or LangGraph flow                       | `python-service-builder`        | ai         |
| Author a custom Terraform provider resource in Go              | `go-terraform-provider-builder` | terraform  |
| Author or update an HCL module under `terraform/modules/`      | `go-terraform-provider-builder` | terraform  |
| Compose an env root under `terraform/envs/<env>/`              | `go-terraform-provider-builder` | terraform  |
| Write Vitest / RTL tests                                       | `vitest-test-engineer`          | frontend   |
| Write Jest / Detox tests for React Native                      | `native-test-engineer`          | mobile     |
| Write Playwright end-to-end tests                              | `e2e-test-engineer`             | web/mobile |

### "Author documentation / plans / decisions"

| Task                                                         | Agent                       |
| ------------------------------------------------------------ | --------------------------- |
| Author a new ADR                                             | `docs-adr-steward`          |
| Draft a design ADR that precedes code                        | `solution-architect`        |
| Author or update a steering doc                              | `docs-adr-steward`          |
| Author a changeset + CHANGELOG bump                          | `docs-changesets-steward`   |
| Author a README for a package                                | `docs-changesets-steward`   |
| Author inline docblocks + JSDoc across a package             | `code-documentation-writer` |
| Scaffold i18n catalogs (`src/core/i18n/en.json` + `ar.json`) | `translator`                |
| Draft a PRD                                                  | `stackra-product`           |
| Draft an intake brief from a raw PDF / DOCX                  | `spec-intake-analyst`       |
| Author user personas + JTBD                                  | `ux-research-lead`          |
| Draft a competitive matrix + pricing intel                   | `market-research-analyst`   |
| Author IA + wireframes-as-markdown                           | `product-designer`          |
| Author copy decks (empty states, errors, microcopy)          | `content-designer`          |
| Draft a JSON Schema contract or OpenAPI fragment             | `api-contract-designer`     |
| Draft an ERD or column contract                              | `data-modeler`              |
| Draft a STRIDE threat model                                  | `threat-modeler`            |

### "Audit / review / verify"

| Task                                                               | Agent                                |
| ------------------------------------------------------------------ | ------------------------------------ |
| Audit a `@stackra/*` frontend package                              | `frontend-package-auditor`           |
| Audit DI / container / framework architecture                      | `container-di-architecture-reviewer` |
| Audit React Native platform (Metro, bundle, deep-links)            | `native-platform-reviewer`           |
| Audit UI design + component-level accessibility                    | `ui-design-a11y-reviewer`            |
| Full WCAG 2.2 AA audit (axe, keyboard, screen reader)              | `accessibility-audit-lead`           |
| Audit security + privacy + minor consent + PAT + JWT               | `security-compliance-reviewer`       |
| Audit AI service deploy + observability + canary                   | `mlops-reviewer`                     |
| Audit prompt design + eval harnesses                               | `data-scientist-reviewer`            |
| Audit package API surface (tsup, exports, tree-shake)              | `package-api-release-reviewer`       |
| Audit env-var + secret naming across every workspace repo          | `env-naming-steward`                 |
| Semantic review of code changes (narrative-organized, cross-file)  | `semantic_reviewer`                  |

### "Mechanical fixes across a codebase"

Stewards WRITE code — mechanical moves + renames + normalizations. Never change
behaviour.

| Task                                                                                               | Agent                               |
| -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Move / rename / split source files to hit one-export-per-file                                      | `code-standards-steward`            |
| Normalize every package's `package.json` / `tsconfig.json` / `tsup.config.ts` / `vitest.config.ts` | `workspace-standardization-steward` |
| Migrate native / third-party utility calls → `@stackra/support` helpers                            | `support-utilities-steward`         |
| Author or update ADRs / steering / contract schemas (backend)                                      | `docs-adr-steward`                  |
| Author or update READMEs / LICENSE / changesets / CHANGELOG (frontend)                             | `docs-changesets-steward`           |

### "Ship / deploy / operate"

| Task                                                                | Agent                      |
| ------------------------------------------------------------------- | -------------------------- |
| Version bumps + changelog roll-ups + release-note authoring         | `release-manager`          |
| Author IaC + canary / promote / rollback plans + deployment scripts | `deploy-engineer`          |
| Wire SLIs / SLOs / runbooks / on-call rotations                     | `sre-lead`                 |
| Author observability config (Sentry / Grafana / tracing)            | `observability-engineer`   |
| Author analytics catalogue + dashboards                             | `analytics-engineer`       |
| Author performance budgets + k6 load tests                          | `performance-engineer`     |
| Lead a SEV-1 / SEV-2 incident + write post-mortem                   | `incident-commander`       |
| Triage support tickets → engineering intakes                        | `support-liaison`          |
| DSAR / erasure / retention / regime evidence                        | `legal-compliance-officer` |

### "Explore / understand / route"

| Task                                                 | Agent                    |
| ---------------------------------------------------- | ------------------------ |
| Explore an unfamiliar codebase area                  | `context-gatherer`       |
| Answer "who owns this? which agent picks it up?"     | `chief-orchestrator`     |
| Answer "what does Kiro do here?" (about Kiro itself) | `introspect`             |
| Delegate an arbitrary well-defined subtask           | `general-task-execution` |
| Author a new custom agent charter                    | `custom-agent-creator`   |

## Decision tree — if no row matches

1. **Is the task ABOUT code (add / change / fix)?**
   - **Yes, backend TypeScript Worker** → `framework-core-builder`
   - **Yes, frontend React (web)** → `heroui-ui-builder` (if UI) OR
     `framework-core-builder` (if non-UI framework)
   - **Yes, mobile RN** → `heroui-native-builder`
   - **Yes, AI service Python** → `python-service-builder`
   - **Yes, Terraform / Go provider** → `go-terraform-provider-builder`
   - **Yes, tests** → matching `*-test-engineer` for the runtime
   - No → continue.

2. **Is the task ABOUT documentation / decisions?**
   - **Yes, an ADR or design decision** → `solution-architect` (draft) OR
     `docs-adr-steward` (author / update)
   - **Yes, a plan / roadmap** → `stackra-product` (product PRD) OR
     `chief-orchestrator` (cross-agent plan)
   - **Yes, in-source documentation** → `code-documentation-writer`
   - **Yes, i18n catalog** → `translator`
   - No → continue.

3. **Is the task ABOUT AUDITING / REVIEWING?**
   - Match the subject to a specific reviewer above.
   - If no specific reviewer fits, fall back to `semantic_reviewer`
     (behavioural).

4. **Is the task ABOUT OPERATING (deploy / incident / observability)?**
   - Match the subject in the "Ship / deploy / operate" table.

5. **Is the task ABOUT UNDERSTANDING or ROUTING the work itself?**
   - Match in the "Explore / understand / route" table.

6. **Still no fit?**
   - **`chief-orchestrator`** — the routing brain decides which agent picks it
     up. It's advisory only; it doesn't write code but it produces a plan.

## Multi-agent workflows

Common patterns where TWO OR MORE agents cooperate in sequence.

### Build a feature (backend + tests + docs)

```
1. framework-core-builder      → implement the Worker service feature (TypeScript)
2. vitest-test-engineer        → add + strengthen the Vitest suite
3. code-standards-steward      → sweep the new files for steering compliance
4. docs-adr-steward            → author the ADR if a design decision was made
5. docs-changesets-steward     → add the changeset for the package version bump
```

### Ship a UI change (frontend + tests + a11y + docs)

```
1. heroui-ui-builder           → author the component / page
2. code-standards-steward      → enforce the one-export-per-file + folder layout
3. vitest-test-engineer        → add tests
4. ui-design-a11y-reviewer     → review design + component-level a11y
5. accessibility-audit-lead    → full WCAG audit at Phase 5
6. code-documentation-writer   → docblocks + JSDoc on every new export
```

### Ship a mobile feature

```
1. heroui-native-builder       → author screens + navigation + deep-links
2. native-test-engineer        → Jest + Detox tests
3. native-platform-reviewer    → review Metro / bundle / permissions / store readiness
```

### Ship an AI-service feature

```
1. python-service-builder      → FastAPI endpoint + LangGraph flow + tools
2. data-scientist-reviewer     → eval harness + statistical sanity
3. mlops-reviewer              → deploy footprint + canary strategy
```

### Author a cross-service contract

```
1. api-contract-designer       → JSON Schema + OpenAPI fragment
2. data-modeler                → ERD + column contract (row-attribution)
3. solution-architect          → ADR wrapping the design decision
4. framework-core-builder      → implement server-side Worker + TypeScript client per contract
```

### Phase 5 verify sweep (parallel)

Fire in parallel — each writes its own report; no lane overlaps.

```
- container-di-architecture-reviewer
- package-api-release-reviewer
- frontend-package-auditor          (one invocation per @stackra/* package)
- native-platform-reviewer
- ui-design-a11y-reviewer
- security-compliance-reviewer
- env-naming-steward
- performance-engineer
- accessibility-audit-lead
- e2e-test-engineer
- vitest-test-engineer    (frontend)
- native-test-engineer    (mobile)
```

## Anti-patterns

Do not:

- Invoke a **reviewer** to write code. Reviewers produce reports; builders write
  code.
- Invoke a **lead** to write code. Leads are advisory + routing.
- Invoke two agents on the same task in parallel unless they own DIFFERENT
  concerns (per the reviewer non-overlap matrix).
- Fall back to `general-task-execution` when a specialised agent exists.

## Related

- [`AGENTS.md`](../../AGENTS.md) — universal AI-agent entry point.
- [`AGENT_ROSTER.md`](../../AGENT_ROSTER.md) — one-liner per agent.
- [`INDEX.md`](INDEX.md) — every agent grouped by lane (alphabetical).
- [`README.md`](README.md) — invocation model + reviewer non-overlap matrix +
  charter authoring rules.
- [`../BOOT.md`](../BOOT.md) — session-start orientation.
