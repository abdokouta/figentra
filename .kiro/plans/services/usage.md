---
status: canonical
component: service
service: usage
version: v1
runtime: nestjs
---
# Usage Service — implementation-complete plan

## Mission
Authoritatively meter billable/limited usage. Usage records facts, maintains period counters, enforces quotas, exports billable usage and reconciles aggregates. Analytics consumes copies; Monetization consumes billable usage for commercial decisions.

## Models
`UsageRecord(id,tenantId,subjectId,meterKey,quantity,unit,occurredAt,receivedAt,eventId,dedupeKey,metadata)`; `UsageCounter(id,tenantId,subjectId,meterKey,windowStart,windowEnd,consumed,version)`; `Quota(id,tenantId,subjectId,meterKey,limit,window,startsAt,endsAt)`; `UsageExport(id,tenantId,period,status,cursor,checksum)`; `ReconciliationJob(id,tenantId,period,status,drift,checkpoint)`.

## API/DTOs
`POST /v1/usage/records/batch`; `GET /v1/usage`; `POST /v1/usage/check`; `GET /v1/usage/counters`; `GET /v1/usage/exports`; `POST /v1/usage/reconciliation`. DTOs include meter key, unit, quantity, event timestamp, subject and idempotency key; all quantities have unit validation and numeric bounds.

## Interfaces
`MeteringService.record/batch/check`; `CounterService.consume/get`; `QuotaService.create/update/check`; `UsageExportService.export/status`; `ReconciliationService.start/run/status`.

## Ingestion
At-least-once events are accepted through NATS/HTTP. Dedupe by stable event ID or producer idempotency key. Raw usage is append-oriented; aggregate updates are transactional. Counter consumption uses atomic version/row locking so concurrent requests cannot oversubscribe a quota.

## Cross-service calls
Identity supplies principal context. IAM authorizes administrative quota/meter/export actions. Monetization may query effective allowance and consume billable exports; Analytics receives asynchronous copies. Usage never reads another service database.

## Persistence
PostgreSQL with partitioned `usage_records`, `usage_counters`, `quotas`, `usage_exports`, `reconciliation_jobs`, `outbox`. Index `(tenant_id,meter_key,occurred_at)`, `(tenant_id,subject_id,meter_key,window_start)` and unique dedupe keys. Retention is explicit by meter classification.

## Workers/scheduler
Consumer normalizes metering events; worker aggregates/reconciles and exports; scheduler closes windows, expires quotas and runs bounded reconciliation. Retry/DLQ is explicit; poison records are quarantined.

## Reliability/security
Exactly-once effect is achieved through idempotent writes, not transport guarantees. Quantity overflow, invalid units and tenant mismatch are terminal validation errors. Usage payloads minimize PII and sensitive identifiers may be tokenized.

## Observability
Metrics for ingestion rate, duplicates, lag, quota denials, counter conflicts, export lag and reconciliation drift. Traces include request/correlation/causation IDs without payload secrets.

## Testing
Concurrent quota consumption, duplicate events, late events, window boundaries/time zones, counter recovery, reconciliation determinism, export checksums, tenant isolation, migration compatibility and load/backpressure tests.

## Completion gate
Usage limits are authoritative here; no billing or analytics component mutates counters directly; every meter has unit, precision, retention, dedupe and aggregation semantics.