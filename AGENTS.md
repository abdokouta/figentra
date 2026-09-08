# AGENTS.md — Figentra universal AI-agent entry point

This repository is the Figentra platform. Every AI coding agent must treat this file, the canonical architecture, and the relevant implementation contracts as the source of truth.

## First-read sequence

1. `AGENTS.md`
2. `.kiro/specs/figentra-platform/ARCHITECTURE.md`
3. `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
4. `.kiro/agents/ROUTING.md`
5. `.kiro/agents/INDEX.md`
6. Relevant `.kiro/plans/` service/package/worker documents
7. Relevant `.clinerules/` and `.cline/skills/`

Do not load every document at startup. Use indexes and task-specific retrieval to preserve context.

## Current architecture

Figentra is designed as a modular enterprise application with strong ownership boundaries. A domain module is not automatically a deployment service. API, worker, and scheduler are runtime roles that execute the same ownership model and may scale independently.

Canonical domain ownership:

- Identity — authentication, identities, principals, credentials/references, sessions, service identities.
- Tenant — tenants, organizations, domains, membership/context and tenant lifecycle.
- IAM — roles, permissions, policies and authorization.
- Monetization — plans, subscriptions, billing, payments, discounts/credits and commercial entitlements.
- Usage — meters, usage facts, aggregation, quotas and billable usage.
- Workflow — durable workflow state, timers, signals, retries, compensation and human tasks.
- Notifications — templates, preferences, channels, deliveries and provider attempts.
- Audit — durable governance/audit records and integrity/retention/export.
- Files — file metadata, upload sessions, object references, versions and lifecycle.
- Integrations — provider connections, OAuth, credentials references, webhooks, mappings, sync and reconciliation.
- Search — indexes, mappings, projections and search contracts.
- Reporting — report definitions, executions, schedules and exports.
- Analytics — analytical facts, dimensions, metrics, aggregation and attribution.
- Marketing — audiences, segments, campaigns, journeys, activation and conversions.

## Runtime topology

```text
Internet
  ↓
Cloudflare DNS/WAF/CDN
  ↓
Gateway Worker + Hono
  ↓
AWS ECS
  ├── API runtime
  ├── Worker runtime
  └── Scheduler runtime
  ↓
PostgreSQL + Redis + NATS JetStream + S3
```

Independent Cloudflare control-plane workers are Gateway, Application Registry, and Infrastructure Orchestrator. Registry is metadata/discovery/control-plane projection; services remain the source of business truth.

## Engineering laws

- One authoritative owner per business domain.
- Capability → package; provider/runtime/framework/testing integrations → package subpaths unless an independent lifecycle boundary exists.
- No cross-owner database writes or foreign keys.
- No direct import of another module's infrastructure/repositories.
- HTTPS/OpenAPI for normal synchronous contracts.
- NATS JetStream + transactional outbox for durable async work.
- Redis is cache/coordination, not the durable event bus.
- Queue consumers are module-owned; schedulers execute module-owned jobs.
- Authentication ≠ authorization ≠ commercial entitlement.
- Gateway is defense-in-depth; services re-establish authoritative security context.
- OpenTelemetry is the technical telemetry contract.
- Audit, Tracking, Analytics, Usage, Events, Logs, and Notifications are distinct signals.
- No fake production drivers, placeholder providers, target shims, or deferred architecture.
- Every production path needs failure, recovery, observability, security, migration, and test coverage appropriate to its contract.

## Agent routing

Use `.kiro/agents/ROUTING.md`. The current Figentra specialists include architecture, module implementation, API contracts, database, messaging, workflow/scheduling, security, observability, infrastructure, frontend, integrations, data/analytics, testing, release operations, and documentation governance.

Cline uses the same contracts through `.clinerules/`, `.cline/skills/`, and `.clinerules/workflows/`. Cline read-only subagents are for reconnaissance; implementation remains with the owning agent/task.

## AI development model

Kimi K2.5 on AWS Bedrock may be the default implementation model. Claude/GPT-class models may be used for difficult architecture, security, concurrency, debugging, or independent review. Models are replaceable; repository contracts and automated tests are authoritative.

Do not add `@cline/sdk` to product runtime solely for coding. Use Cline CLI/IDE for normal development. Adopt the SDK only for an explicit engineering automation product or CI orchestration system.

## Completion gate

Before claiming completion, verify: architecture ownership, typecheck, lint, tests, API/async contracts, database migrations, security/tenancy, idempotency, retries/DLQ, scheduling safety, health/readiness, logs/metrics/traces, configuration/secrets, deployment/rollback, documentation, and relevant production runbooks.
