---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# Notifications Service — implementation plan

## Ownership

Notifications is a deployable NestJS bounded context. All notification domain implementation lives in `services/notifications/src/modules`. There is no separate `@stackra/notifications` domain implementation package and no mirrored `workers/notifications` application.

## Runtime roles

- `api`: notification management, templates/preferences/status and authorized control-plane operations.
- `consumer` / `worker`: consumes notification jobs/events through NATS/queue and performs provider delivery, retry, DLQ and reconciliation.
- Optional scheduler role only for notification-owned scheduling.

All roles are built from this same service source tree and share domain modules.

## Contracts

External consumers use versioned `@stackra/contracts/notifications` DTOs, schemas, commands, events and errors. Provider SDK types, persistence entities and internal interfaces never cross the boundary.

## Implementation requirements

Implement the full service specification with module ownership, provider adapters, durable delivery state, idempotency, bounded concurrency, retry budgets, DLQ/replay/reconciliation, tenant isolation, IAM/policy enforcement, audit integration, structured logs, OpenTelemetry, health/readiness, graceful shutdown, contract/integration/e2e tests and production deployment.

## Boundary rule

Marketing may request notification delivery through the contract/transport boundary. Notifications owns delivery; Marketing owns campaigns/audiences. Analytics owns analytical processing. Audit owns durable audit records.
