# `@stackra/audit` — platform capability specification

**Status:** Canonical platform capability

## Ownership

`@stackra/audit` defines canonical audit-event contracts, recording semantics, actor/principal and tenant context, classification, redaction, integrity metadata, and producer-side durable handoff interfaces.

The deployable Audit service owns durable audit storage/query/export. The Audit worker owns asynchronous ingestion, enrichment, indexing, retention, archival, reconciliation, and replay.

## Boundary

Audit is not logging, OpenTelemetry observability, domain events, behavioral tracking, analytics, or authorization. Those concerns may reference audit IDs but retain their own ownership.

## Required properties

- Immutable event identity and schema version.
- Tenant isolation.
- Actor/principal/resource/action/outcome context.
- Correlation/request/trace linkage.
- Explicit sensitive-field allowlisting/redaction.
- At-least-once delivery with idempotent persistence.
- Append-only finalized records.
- Retention and export controls.
- Optional cryptographic integrity verification for compliance deployments.

## Runtime model

Core package is runtime-neutral. Node/NestJS integrates with service persistence/control APIs; Workers integrate with durable queues/events and explicit execution context.

## Observability

Audit processing itself is observable through canonical logs, traces, and metrics without copying sensitive audit payloads into telemetry.

## Conformance

Implementation must follow the Enterprise Day-One Plan Standard, global security/tenancy/reliability standards, and the Audit package/service/worker plans.
