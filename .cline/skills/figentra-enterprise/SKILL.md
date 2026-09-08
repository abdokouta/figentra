---
name: figentra-enterprise
description: Apply Figentra's enterprise day-one architecture, module ownership, async runtime, security, observability, testing, and production-completion rules when planning or implementing platform changes.
---

# Figentra Enterprise Engineering Skill

## Source of truth

Read `AGENTS.md`, then the canonical platform architecture and the relevant `.kiro/plans/` contract. Existing source code is evidence, not authority, when it conflicts with a locked architecture decision.

## Boundary law

- A domain capability is a module/ownership boundary; it is not automatically a deployable service.
- API, worker, and scheduler are runtime roles, not business ownership boundaries.
- A module may expose HTTP handlers, commands, queries, event consumers, jobs, schedules, repositories, and adapters while retaining one owner.
- Extract a deployable only when independent scaling, lifecycle, security, deployment, data ownership, or organizational ownership materially requires it.
- Never create a new boundary to hide poor internal modularity.

## Module structure

Prefer vertical ownership:

```text
modules/<capability>/
  domain/
  application/
  infrastructure/
  presentation/
  messaging/
  jobs/
  schedules/
  module.ts
```

Do not scatter one capability across global `repositories/`, `queues/`, `jobs/`, and `controllers/` directories.

## Async execution

- Synchronous client/service calls use HTTPS/OpenAPI and typed contracts.
- Durable asynchronous work uses NATS JetStream and transactional outbox.
- Redis is for cache, rate limiting, locks, and ephemeral coordination; it is not the durable event bus.
- Every consumer is idempotent.
- Every retry policy has a bounded retry count, backoff, jitter, poison-message handling, and DLQ/recovery path.
- Schedulers trigger module-owned jobs; they do not own business state.
- API, worker, and scheduler runtimes can scale independently without duplicating module ownership.

## Security

Identity answers who. IAM answers whether an action is authorized. Tenant owns tenant context and membership. Monetization owns commercial entitlement. Gateway is defense-in-depth and never replaces service-side verification.

Never trust client-supplied identity, role, permission, tenant, or authorization headers. Never put secrets in Registry metadata, manifests, logs, source code, images, or Terraform variables where avoidable.

## Observability

Use OpenTelemetry for traces and metrics, structured logs for operational facts, Audit for durable governance records, Tracking for behavioral collection, Analytics for interpretation, and Usage for metering. Preserve request/correlation/trace identity across Gateway → API → worker → downstream calls.

## Verification

Before completion, verify typecheck, lint, unit tests, integration/contract tests where applicable, migration safety, security boundaries, idempotency, retry/DLQ behavior, observability, health/readiness, documentation, and production configuration. Never claim production-ready with TODO architecture or fake providers.
