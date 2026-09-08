# Figentra Agent Index

This directory contains the project's active Kiro agent profiles. The current Figentra platform agents below are authoritative for the 2026 modular-application architecture. Legacy/package-specific agents remain available where their scope still applies.

## Figentra enterprise platform agents

| Agent | Primary responsibility |
|---|---|
| `figentra-architecture-guardian` | architecture, boundaries, ADRs, dependency direction |
| `figentra-module-builder` | vertical module implementation |
| `figentra-api-contract-designer` | HTTP/OpenAPI and async contract design |
| `figentra-database-engineer` | PostgreSQL, migrations, transactions, indexes |
| `figentra-messaging-engineer` | NATS, outbox, consumers, retries, DLQ, idempotency |
| `figentra-workflow-scheduler` | workflow, timers, schedules, human tasks |
| `figentra-security-reviewer` | auth, IAM, tenancy, secrets, threat/security review |
| `figentra-observability-engineer` | OpenTelemetry, logs, metrics, traces, SLOs |
| `figentra-infrastructure-engineer` | AWS ECS, Terraform, Cloudflare, networking, secrets, CI/CD |
| `figentra-frontend-agent` | SPA, Registry-driven UI, SDUI, accessibility, performance |
| `figentra-integration-engineer` | OAuth, providers, webhooks, sync/reconciliation |
| `figentra-data-analytics-agent` | Usage, Tracking, Analytics, Reporting, Search |
| `figentra-test-engineer` | unit/integration/contract/e2e/security/load/architecture tests |
| `figentra-release-operations` | release, deployment, rollback, SLO/runbook gate |
| `figentra-docs-governance` | specs, plans, ADRs, docs, routing consistency |

## Existing specialized agents

The existing package, frontend, native, documentation, release, and review agents remain available when their specific lane applies. Route platform architecture and backend runtime work through the Figentra enterprise agents above first.

## Required reading

- `AGENTS.md`
- `.kiro/specs/figentra-platform/ARCHITECTURE.md`
- `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
- `ROUTING.md`
- `.clinerules/`

## Multi-agent rule

Agents may work in parallel only when ownership is disjoint. The same files or business concern must not be edited by multiple agents simultaneously. Reviewers report; the owning builder fixes.
