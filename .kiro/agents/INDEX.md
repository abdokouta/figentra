# Agent INDEX — lean base set (15 agents)

> **Every agent the workspace actively uses lives here.** Aspirational /
> product-specific / review-only agents live in `.ref/agents/` for later
> activation. Promote back into `.kiro/agents/` when the concern lands.

## Writers (bounded — one lane, one kind of edit)

| Agent                               | Lane                                     |
| ----------------------------------- | ---------------------------------------- |
| `framework-core-builder`            | Non-UI `@stackra/*` packages source      |
| `code-standards-steward`            | File/folder standards enforcement        |
| `code-documentation-writer`         | Docblocks + JSDoc                        |
| `docs-adr-steward`                  | ADRs + steering rules                    |
| `docs-changesets-steward`           | READMEs + changesets + CHANGELOGs        |
| `env-naming-steward`                | Env-var naming audit                     |
| `support-utilities-steward`         | @stackra/support helper migration        |
| `vitest-test-engineer`              | Vitest test suites                       |
| `workspace-standardization-steward` | Package manifests + config normalization |

## Reviewers (read-only audits)

| Agent                          | Lane                                  |
| ------------------------------ | ------------------------------------- |
| `package-api-release-reviewer` | Exports, builds, semver, supply chain |
| `security-compliance-reviewer` | Security + privacy audit              |
| `frontend-package-auditor`     | Per-package audit checklist           |

## Aspirational agents → `.ref/agents/`

44 agents covering product-lead, design-lead, quality-lead, mobile-native,
MLOps, incident command, legal/compliance, and other review-only or
product-line-specific concerns live at [`.ref/agents/`](../../.ref/agents/).
Activate when the concern lands.
