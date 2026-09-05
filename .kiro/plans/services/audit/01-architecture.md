---
status: canonical
component: service
service: audit
version: v1
runtime: nestjs
---
# Audit Service — Architecture

## Mission
Audit is the durable governance evidence plane. It records security-, authorization-, administration- and compliance-relevant facts that must remain queryable and tamper-evident.

Audit answers: **what significant action occurred, who/what initiated it, against what resource, when, with what outcome, and can the record be verified?**

## Boundary

Audit is not:

- application logging
- OpenTelemetry/tracing
- behavioral tracking
- analytics
- authorization/policy evaluation
- notifications
- generic event storage

Logs belong to Logger. Telemetry belongs to Observability. Behavioral data belongs to Tracking/Analytics. Authorization belongs to IAM. Durable governance evidence belongs here.

## Ownership

Audit owns the audit record lifecycle, append semantics, query/export, integrity verification, retention/archive policy and legal-hold enforcement. Producing services remain responsible for determining which business/security actions are auditable and emit canonical contracts.

## Trust model

Audit accepts records from authenticated service identities and explicitly authorized administrative producers. Producers publish through transactional outbox so an audited business mutation cannot successfully commit without its audit fact being durably scheduled for delivery.

Audit is append-only. Corrections are new records referencing the original record; existing records are never edited in place.

## Integrity

Records use canonical serialization and a hash chain within the defined tenant/event stream. Integrity verification detects altered, missing or reordered records where sequence information exists. Hashing supplements database/object-store controls; it is not presented as a substitute for immutable infrastructure or access control.

## Tenancy

Audit records are tenant-scoped unless the event is explicitly platform-scoped. Tenant isolation is mandatory for query/export. Cross-tenant platform operators require system identity plus IAM authorization.

## Data lifecycle

```text
received → validated → appended → queryable → retained → archived → eligible for deletion
```

Retention is policy-driven. Legal hold blocks destructive retention operations. Archive and deletion are bounded, resumable and evidenced.

## Runtime

One NestJS source tree exposes:

```text
api       → query/export/administration
consumer  → durable audit ingestion
worker    → export/integrity/archive operations
scheduler → retention and legal-hold evaluation
```

## Dependencies

- `@stackra/contracts` — canonical audit/event contracts
- `@stackra/events` — event semantics
- `@stackra/database` / `@stackra/orm` — persistence
- `@stackra/storage` / Files service — archive/export objects
- Identity — principal context
- IAM — query/export/admin authorization
- Observability — telemetry only

## Failure principles

Audit never acknowledges an unpersisted record. Duplicate delivery is safe. Poison messages are isolated in DLQ. Query availability is independent of ingestion lag where possible. Export/integrity jobs checkpoint progress.

## Acceptance criteria

- Audit records are immutable after append.
- Every record has actor/subject/resource/request correlation where applicable.
- Ingestion is durable and idempotent.
- Query/export is tenant- and IAM-protected.
- Integrity checks are reproducible.
- Retention and legal holds are enforceable.
- Audit is never used as a substitute for logs, telemetry, tracking or analytics.
