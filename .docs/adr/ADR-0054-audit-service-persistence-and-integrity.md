# ADR-0054 — Audit Service Persistence and Integrity

## Status

Accepted.

## Decision

The Audit Service is a full NestJS domain service backed by PostgreSQL and
MikroORM 7.

### ORM

Use MikroORM for:

- entity mapping
- repositories
- Unit of Work
- request context
- transaction boundaries
- application queries
- migration orchestration

Use reviewed raw PostgreSQL SQL only where the database primitive is part of
the security/integrity design, including migration DDL and transaction-scoped
advisory locks.

Knex is not introduced because it would create a second persistence abstraction
for a service that already benefits from MikroORM's Unit of Work and
transaction model.

### Integrity

Audit entries are append-only at the application layer and hash-chained per
tenant/platform stream. A PostgreSQL advisory transaction lock serializes writes
to the same stream.

Database roles must additionally prevent ordinary service credentials from
performing UPDATE/DELETE operations on the audit ledger.

### Transport

Business services emit audit facts through the transactional outbox. NATS
delivers versioned audit events to the Audit Service. The event ID is the
idempotency key.

### Access

The audit API is an internal/admin surface. Service identity authentication and
IAM permissions are mandatory before production exposure:

- `audit.write`
- `audit.read`

### Retention

Retention, legal hold, archival, and export are governed operations. They are
not CRUD operations and must themselves be auditable.

## Consequences

The Audit Service can provide durable compliance records without conflating
technical telemetry with audit history. PostgreSQL remains the authoritative
query store, while future WORM/object archival can provide stronger compliance
retention tiers.
