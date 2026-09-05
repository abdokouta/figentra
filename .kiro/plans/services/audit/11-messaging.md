---
status: canonical
document: service-messaging
service: audit
version: v1
---
# Audit Service — Messaging Contract

Audit ingests durable governance facts from versioned service outbox events over NATS JetStream and publishes only Audit-owned operational/governance lifecycle events. It is not the business event bus, logger, analytics stream or authorization engine.

## Inbound streams/subjects
Audit subscribes to approved auditable event subjects across all services through durable consumers grouped by source/domain. Each accepted event is validated against `@stackra/contracts`, normalized to `AuditRecord`, deduplicated by source event ID, canonicalized and appended with integrity linkage. Unknown/unversioned schemas are rejected to quarantine/DLQ, not stored as trusted audit evidence.

## Audit-owned subjects
`AUDIT_EVENTS`:
- `audit.record.appended.v1`
- `audit.export.requested.v1`, `audit.export.completed.v1`, `audit.export.failed.v1`
- `audit.integrity_check.started.v1`, `audit.integrity_check.completed.v1`, `audit.integrity_check.failed.v1`
- `audit.retention.updated.v1`
- `audit.legal_hold.created.v1`, `audit.legal_hold.released.v1`
- `audit.archive.completed.v1`

`AUDIT_COMMANDS`:
- `audit.command.generate-export.v1`
- `audit.command.run-integrity-check.v1`
- `audit.command.archive-eligible.v1`
- `audit.command.delete-eligible.v1`

`AUDIT_DLQ`: source-ingestion quarantine, export, integrity and archive/delete poison work.

## Consumer semantics
Durable consumer identity includes source+schema version. Ack occurs only after committed audit append/dedup state. At-least-once delivery is expected; duplicate source event IDs are no-ops. Ordering is preserved per configured audit chain partition (for example tenant/partition) by sequence coordination; no false global ordering assumption.

## Event envelope and evidence
Inbound metadata preserved includes source event ID/type/version/time, producer/version, tenant, principal/actor, correlation/causation, trace context and payload classification. Audit adds ingestion time, canonical schema version, chain partition, sequence, previous hash and record hash. Secrets/credentials are rejected/redacted according to schema policy before evidence acceptance.

## Quarantine/DLQ
Schema-invalid, signature/integrity-invalid or classification-violating events are quarantined with reason metadata and alerting. Replay requires authenticated/authorized administrative action, immutable reason and audit-of-audit record. Replayed data retains original source identity and new ingestion attempt metadata.

## Registry/testing
Registry publishes inbound subject patterns, Audit subjects, durable consumers, chain partition strategy, DLQs and schemas. Tests cover duplicate/out-of-order delivery, consumer crash after append before ack, schema mismatch, malformed/secret payload rejection, partition ordering, NATS outage/recovery, DLQ replay and hash-chain continuity.