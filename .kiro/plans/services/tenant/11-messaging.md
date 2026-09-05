---
status: canonical
document: service-messaging
service: tenant
version: v1
---
# Tenant Service — Messaging Contract

Tenant uses PostgreSQL transactional outbox + NATS JetStream for all durable asynchronous publication. Tenant lifecycle and membership/domain changes are authoritative facts consumed by other services; no consumer writes Tenant tables directly.

## Streams and subjects
`TENANT_EVENTS`:
- `tenant.created.v1`, `tenant.updated.v1`, `tenant.activated.v1`, `tenant.suspended.v1`, `tenant.archived.v1`
- `tenant.organization.created.v1`, `tenant.organization.updated.v1`, `tenant.organization.archived.v1`
- `tenant.membership.added.v1`, `tenant.membership.updated.v1`, `tenant.membership.removed.v1`
- `tenant.domain.created.v1`, `tenant.domain.verification.requested.v1`, `tenant.domain.verified.v1`, `tenant.domain.failed.v1`, `tenant.domain.removed.v1`
- `tenant.settings.updated.v1`
- `tenant.context.version.changed.v1`

`TENANT_COMMANDS`:
- `tenant.command.verify-domain.v1`
- `tenant.command.expire-domain-challenge.v1`
- `tenant.command.reconcile-context.v1`
- `tenant.command.archive-cleanup.v1`

`TENANT_DLQ` contains domain-verification, lifecycle-reconciliation and cleanup poison work.

## Consumers
Tenant consumes Identity principal lifecycle facts needed to mark invalid memberships and IAM/Monetization facts only where the Tenant contract explicitly requires projection/invalidation. Consumers have durable names, explicit subject filters, bounded concurrency, ack-on-success, exponential backoff+jitter, max deliveries, DLQ and inbox/idempotency.

## Envelope and guarantees
Every message carries event ID/type/version/time, tenant/organization/principal/actor IDs where applicable, correlation/causation IDs, trace context and schema version. Delivery is at-least-once; handlers are idempotent. Ordering is required per tenant aggregate/version, not globally. State mutation + outbox is atomic. Consumer state + resulting outbox uses inbox/UoW transaction.

## Registry/testing
Registry projects every stream/subject/schema/consumer/DLQ. Tests cover duplicate/out-of-order lifecycle events, crash after DB commit before ack, NATS outage/outbox recovery, replay, DLQ exhaustion and tenant-context version convergence.