---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# `@stackra/audit` — implementation plan

## Purpose

Provide the canonical immutable business/security audit-event contract and recording API. Audit is distinct from operational logs, OpenTelemetry telemetry, domain events, and analytics tracking.

## Ownership

`@stackra/audit` owns audit contracts, event normalization, actor/tenant/resource context, integrity metadata, retention/export interfaces, and producer-side recording semantics. The Audit service owns durable audit records and query APIs. The Audit worker owns asynchronous ingestion, enrichment, indexing, retention, export, and reconciliation.

## Non-goals

- Application logging.
- Distributed tracing or metrics.
- Behavioral analytics/tracking.
- Authorization policy evaluation.
- Replacing domain events.

## Canonical audit event

Every record has a stable event ID, timestamp, actor/principal identity, tenant identity when applicable, action, resource type/id, outcome, source/service, correlation/request/trace IDs, before/after or change-set references where permitted, reason/context, schema version, integrity metadata, and classification.

Sensitive values are never recorded by default. Producers explicitly select approved fields or references.

## Architecture

```text
application/service
   -> @stackra/audit contract + recorder
   -> outbox / durable queue boundary
   -> Audit worker
   -> Audit service storage/index
   -> query/export/compliance consumers
```

Audit events must be durable and replayable. Delivery is at-least-once with deterministic event IDs and idempotent persistence.

## Security and integrity

- Tenant isolation is mandatory.
- Append-only semantics for audit records.
- No ordinary update/delete API for finalized events.
- Cryptographic integrity metadata/hash chaining is supported for compliance-sensitive deployments.
- Access is policy-controlled and itself auditable.
- Export is authenticated, authorized, rate-limited, and recorded.

## Observability

Audit pipeline metrics include accepted/rejected events, queue depth, processing latency, duplicates, failures, DLQ depth, storage latency, export volume, and retention activity. Operational logs/traces contain references to audit IDs, never duplicate sensitive audit payloads.

## Testing

Contract/conformance tests, schema-version tests, tenant-isolation tests, idempotency tests, ordering guarantees where required, replay/DLQ tests, tamper/integrity tests, authorization tests, retention/export tests, and failure-injection tests.

## Implementation phases

1. Define contracts and schema/versioning.
2. Implement recorder, validation, redaction, context propagation, and durable handoff.
3. Implement worker ingestion/enrichment/idempotency/DLQ.
4. Implement Audit service persistence/query/export APIs.
5. Add indexing, retention, archival, integrity verification, and reconciliation.
6. Integrate every security-sensitive control-plane mutation.

## Exit criteria

Audit is a first-class platform capability with package, service, and worker implementations; durable, tenant-isolated, replayable, queryable, integrity-aware, and independently observable.
