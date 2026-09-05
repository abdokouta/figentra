# Audit Service — Data Model

PostgreSQL is the authoritative durable audit store. No service updates audit rows directly.

`audit_records`: `id`, `tenant_id`, `sequence`, `schema_version`, `event_type`, `occurred_at`, `recorded_at`, `actor_principal_id`, `effective_principal_id`, `action`, `resource_type`, `resource_id`, `outcome`, `source`, bounded `metadata`, `previous_hash`, `record_hash`, `correlation_id`, `causation_id`. Immutable after insert. Unique `(tenant_id, sequence)` and `record_hash`.

`audit_exports`: id, tenant, requester, filter specification, format, status, object reference, created/completed/expired timestamps, checksum.

`retention_policies`: tenant, retention duration, archive policy, deletion policy, version, updated by/time.

`integrity_checks`: id, tenant, range, status, checked count, failure count, started/completed, error summary.

`legal_holds`: id, tenant, selector, reason, created/released by/time, status.

`ingestion_dedup`: event ID, producer, received/processed state and timestamps.

`outbox`: canonical platform outbox for audit lifecycle events.

## Integrity
Record hash is `H(schemaVersion || canonicalRecord || previousHash)`. Canonical serialization is deterministic. Sequence is monotonic per tenant. Insert transaction validates the previous chain head. Any mismatch stops the affected append path and raises an operational integrity alert.

## Retention
Legal hold overrides deletion. Archive precedes deletion where configured. Retention never deletes held records. Exports have independent expiry and do not alter source retention.

## Indexes
Tenant/time, tenant/actor/time, tenant/resource/time, event type/time, correlation ID and sequence. Indexes never permit cross-tenant reads.

## Migrations
Expand/contract only. Immutable historical rows are never rewritten by migrations. Hash-chain schema changes require explicit versioning and compatibility handling.