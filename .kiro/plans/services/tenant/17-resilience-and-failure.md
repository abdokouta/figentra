---
status: canonical
document: service-resilience
service: tenant
version: v1
---
# Tenant Service — Resilience and Failure Contract

Tenant must never fabricate tenancy or membership state during dependency failure.

| Failure | Required behavior |
|---|---|
| PostgreSQL unavailable | readiness false; reject authoritative tenant operations |
| Redis unavailable | bypass/rebuild derived context from PostgreSQL; never cross-tenant fallback |
| NATS unavailable | committed mutations retain unpublished outbox rows; consumers degrade |
| IAM unavailable | protected operations fail closed/dependency error |
| Identity unavailable | principal-validation operations fail explicitly; existing opaque references are not rewritten |
| DNS/resolver unavailable | domain verification remains pending and retryable; no false verified result |
| Notifications unavailable | lifecycle/membership truth remains committed; durable notification request retries asynchronously |
| Registry/OTel unavailable | continue with retry/degraded telemetry |

Every dependency has connect/total timeout. Only safe/idempotent calls automatically retry with exponential backoff and jitter. Domain verification uses bounded attempts and deterministic challenge/version so stale DNS responses cannot verify a superseded challenge.

Optimistic concurrency/version checks protect tenant lifecycle, memberships, domains and settings. Idempotency keys protect tenant creation, invitation, membership mutation and lifecycle transitions. Duplicate NATS messages are inbox-deduped.

Backpressure limits tenant creation, membership/domain bulk operations, resolver calls, context rebuild and cleanup jobs. Scheduler overlap is forbidden through distributed locking/idempotent occurrence keys.

Recovery: outbox resumes; durable consumers redeliver safely; domain verification rescans pending challenges; membership/context reconciliation rebuilds derived state; DLQ replay is authorized/audited; cache invalidation can over-invalidate but not leak across tenant namespaces.

Chaos tests cover DB disconnect mid-transaction, Redis loss, NATS outage, IAM/Identity timeouts, resolver timeout/stale answer, duplicate lifecycle event, process crash after commit before ack, concurrent suspend/member mutation/domain verification and shutdown during worker batches.