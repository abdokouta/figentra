---
status: canonical
document: service-runtime-manifest
service: audit
version: v1
---
# Audit Service — Canonical Runtime Manifest

## Runtime roles
`api`, `consumer`, `worker`, `scheduler` from one NestJS source tree.

## Controllers
`AuditQueryController`, `AuditExportController`, `IntegrityController`, `RetentionController`, `LegalHoldController`, approved internal ingestion/admin controller if required, `HealthController`.

## Application workflows
Ingest/normalize/append audit record; query/filter/page records; request/get/download export; run/get integrity check; get/update retention; create/list/release legal hold; quarantine inspect/replay; archive/delete eligible records; restore/rehydrate archive where supported by operations.

## Messaging/consumers
All inbound approved auditable event subjects and Audit-owned subjects in `11-messaging.md`. Each durable consumer has schema validation, classification enforcement, inbox/dedupe, chain append transaction, retry/quarantine/DLQ and metrics.

## Workers/schedules
Audit event ingestion; export generation; integrity verification; archive eligible batches; deletion eligible batches with immediate hold recheck; export expiry cleanup; quarantine reconciliation; chain checkpoint verification; outbox publisher; controlled DLQ replay. Schedulers only trigger occurrence-keyed bounded jobs.

## Notifications/realtime
Every key/channel in `12-notifications-and-realtime.md`: export status, integrity findings/failures, retention/legal-hold changes, quarantine/archive alerts and protected status channels.

## Framework inventory
Middleware: request/correlation, proxy/security/body limit, principal/tenant/access-log context.
Guards: auth, service identity, IAM, tenant boundary, assurance, export access.
Pipes: validation, UUID, pagination, filters, time range, export format, retention, hold scope.
Interceptors: context, tracing, metrics, query telemetry, idempotency, serialization, timeout, redaction.
Filters: domain, validation, authz, integrity, export, dependency, rate-limit, unknown.
Observers: normalizer, chain append, quarantine, export status, integrity findings, retention/hold eligibility, archive state, outbox.

## Infrastructure
PostgreSQL repositories/UoW/chain-head/outbox/inbox; NATS; encrypted object storage/KMS; optional Redis locks/cache; IAM/Tenant contracts; Notifications output; Registry/OTel.

## Health
DB is critical. NATS is critical for consumer role. Object storage is operation-specific and worker readiness-critical for export/archive role. Registry/OTel degradable. Chain/canonicalization configuration integrity is always readiness-critical.

## Zero-hidden-runtime rule
No mutable audit-record endpoint, no undocumented accepted event subject, no direct email/Slack provider, no unbounded export/query, no deletion outside retention+legal-hold engine, no silent rehash, no unregistered worker/schedule/settings/dependency.