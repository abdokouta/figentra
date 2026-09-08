# Figentra Agent Index

This directory contains the project's active Kiro agent profiles. The Figentra enterprise platform roster is authoritative for the current modular-application architecture. Legacy/package-specific agents remain available where their technical lane still applies.

## Enterprise platform agents

| Agent | Primary responsibility |
|---|---|
| `figentra-delivery-orchestrator` | classify work, select specialists, coordinate handoffs, enforce completion evidence |
| `figentra-architecture-guardian` | architecture, boundaries, ADRs, dependency direction |
| `figentra-module-builder` | vertically complete module implementation |
| `figentra-api-contract-designer` | HTTP/OpenAPI and async contract design |
| `figentra-database-engineer` | PostgreSQL, migrations, transactions, indexes |
| `figentra-messaging-engineer` | NATS, outbox, consumers, retries, DLQ, idempotency |
| `figentra-workflow-scheduler` | workflow, timers, schedules, human tasks |
| `figentra-security-reviewer` | authentication, IAM, tenancy, secrets, SSRF, webhook security |
| `figentra-observability-engineer` | OpenTelemetry, logs, metrics, traces, SLOs |
| `figentra-infrastructure-engineer` | AWS ECS, Terraform, Cloudflare, networking, secrets, CI/CD |
| `figentra-frontend-agent` | SPA, Registry-driven UI, SDUI, accessibility, performance |
| `figentra-integration-engineer` | OAuth, providers, webhooks, sync/reconciliation |
| `figentra-data-analytics-agent` | Usage, Tracking, Analytics, Reporting, Search |
| `figentra-test-engineer` | unit/integration/contract/e2e/security/load/architecture tests |
| `figentra-release-operations` | release, deployment, rollback, SLO/runbook gate |
| `figentra-docs-governance` | specs, plans, ADRs, docs, routing consistency |

## Required reading

Every agent starts with:

1. `AGENTS.md`
2. `.kiro/specs/figentra-platform/ARCHITECTURE.md`
3. `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
4. `ROUTING.md`
5. the selected agent charter
6. the applicable package/service/worker plan
7. the relevant skill under `.kiro/skills/`

Do not load the entire repository into context by default. Use indexes and task-specific retrieval.

## Skills

The reusable Kiro skills under `.kiro/skills/` are:

- `figentra-feature-delivery` — production vertical feature delivery.
- `figentra-module-contract` — module contract definition before implementation.
- `figentra-async-design` — NATS/outbox/consumer/retry/DLQ/scheduler design.
- `figentra-security-review` — security and trust-boundary review.
- `figentra-production-review` — evidence-based production readiness review.
- `figentra-release-gate` — deployment and release gate.

Skills are on-demand instruction packages; agents explicitly load them through `skill://` resources as required by Kiro's custom-agent model.

## Multi-agent rule

Agents may work in parallel only when ownership is disjoint. The same files or business concern must not be edited by multiple agents simultaneously. Reviewers report; the owning builder fixes.

## Runtime rule

A domain module is not automatically a deployment service. API, worker and scheduler are runtime roles. Queue consumers and scheduled jobs remain owned by the module that owns the business behavior.

## Completion rule

No agent may claim production completion from a plan, scaffold, generated files, or a green typecheck alone. Completion requires applicable architecture, contract, data, security, async, test, observability, deployment, rollback and documentation evidence.