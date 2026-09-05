---
status: canonical
document: service-messaging
service: iam
version: v1
---
# IAM Service — Messaging Contract

IAM publishes authorization-model changes through PostgreSQL transactional outbox and NATS JetStream. Authorization checks remain synchronous service/API contracts; eventing distributes model changes, cache invalidation and integration facts.

## Streams and subjects
`IAM_EVENTS` subjects:
- `iam.role.created.v1`, `iam.role.updated.v1`, `iam.role.deleted.v1`
- `iam.permission.catalog.updated.v1`
- `iam.policy.created.v1`, `iam.policy.updated.v1`, `iam.policy.published.v1`, `iam.policy.disabled.v1`
- `iam.grant.created.v1`, `iam.grant.revoked.v1`, `iam.grant.expired.v1`
- `iam.authorization.model-version.changed.v1`

`IAM_COMMANDS` subjects:
- `iam.command.expire-grants.v1`
- `iam.command.rebuild-derived-authorization-state.v1`
- `iam.command.invalidate-resource-context.v1`

`IAM_DLQ` subjects cover grant expiry, tenant/resource synchronization and model rebuild poison work.

## Consumed facts
IAM consumes:
- Tenant lifecycle/membership/resource-context facts required for tenant/resource scoping.
- Identity principal disabled/delegation lifecycle facts when grants/derived caches must invalidate.
- Monetization entitlement change facts only where IAM policy conditions explicitly reference a separately supplied commercial entitlement context; IAM does not own billing.

Consumers use durable names, explicit filter subjects, bounded concurrency, ack-on-success, exponential backoff with jitter, max-delivery limits and DLQ routing. Duplicate event IDs are no-ops through inbox/idempotency storage.

## Envelope
Messages include ID/type/version/time, tenant ID where applicable, principal/actor attribution where applicable, correlation/causation IDs, trace context, producer version and schema version. Policy source may be included only as bounded typed AST data without secrets or executable code.

## Outbox/inbox
Every role/policy/grant mutation and corresponding event commit atomically. `IamOutboxPublisher` publishes with stable message ID and records acknowledgement. Consumers commit inbox receipt + local state mutation + any resulting outbox events in one transaction.

## Cache invalidation
Model-change events carry tenant/model version and affected resource/principal hints. Consumers may over-invalidate but may never under-invalidate security state. Failed invalidation causes authoritative evaluation fallback/fail-closed behavior according to the security contract.

## Registry and testing
Registry projection includes streams, subjects, schemas, durable consumers, DLQs and ownership. Integration tests cover duplicate delivery, ordering-sensitive model version changes, crash after commit/before ack, NATS outage/outbox recovery, DLQ replay, stale invalidation and mixed schema versions.