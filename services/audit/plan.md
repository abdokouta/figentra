# Audit Service — Enterprise Day-1 Plan

## Purpose

The Audit Service is the authoritative durable ledger for security-sensitive,
administrative, authorization, identity, infrastructure, and compliance
actions. It is **not** the technical logging or telemetry service.

## Runtime

- NestJS 12 + Fastify
- PostgreSQL / Supabase PostgreSQL
- MikroORM 7
- NATS for asynchronous audit-event ingestion
- `nestjs-pino` + Pino
- NestJS Observe
- Versioned internal HTTP API
- Terraform-managed database/runtime infrastructure

## Persistence decision — MikroORM

Use **MikroORM 7 + PostgreSQL**.

MikroORM is appropriate here because Audit is a relational, transaction-heavy
service with explicit entities, repositories, Unit of Work, request context,
migrations, and transactional boundaries.

Migrations remain explicit SQL inside MikroORM migration classes. This gives
us exact production DDL without introducing Knex as a second persistence
abstraction.

Use MikroORM for application queries and transactions. Use reviewed raw SQL
only for PostgreSQL-specific primitives such as advisory locks and migration
DDL.

## Record model

Each audit record contains:

- tenant
- actor and actor type
- action
- resource type and resource ID
- outcome
- source service
- upstream event ID
- request/correlation/trace IDs
- client context where policy permits
- non-secret metadata
- occurrence timestamp
- immutable creation timestamp
- logical stream
- previous hash
- record hash

## Integrity

Each tenant/platform stream is hash-chained. A PostgreSQL transaction-scoped
advisory lock serializes writes to one stream so concurrent writes cannot choose
the same predecessor.

This provides tamper evidence. It does not replace database access controls,
backups, PITR, WORM archival, or legal retention.

## API

### `POST /api/v1/audit`

Append an immutable record.

### `GET /api/v1/audit`

Bounded query by tenant, actor, action, resource, outcome, and time window.

### `GET /api/v1/audit/:id`

Read one record.

These endpoints are internal/admin surfaces. They must be protected by service
identity and IAM authorization before production exposure.

## Event ingestion

The next integration is NATS event ingestion through the shared
`@figentra/messaging` abstraction. Event IDs are idempotency keys.

## Retention

Retention/deletion is never a normal CRUD operation. A governed retention job
must handle legal holds, retention classes, archival, and its own audit trail.

## Completed in this implementation batch

- [x] MikroORM PostgreSQL integration.
- [x] Audit entity.
- [x] Explicit SQL migration with up/down.
- [x] Append-only application service.
- [x] Tamper-evident hash chain.
- [x] Tenant/actor/action/resource/outcome/time queries.
- [x] Versioned HTTP API.
- [x] Validation and bounded pagination.
- [x] Pino credential redaction.
- [x] Unit coverage for hash chaining.
- [x] Worker plans created for all three control-plane Workers.

## Remaining production gates

- [ ] NATS audit-event contract.
- [ ] NATS consumer and durable subscription.
- [ ] Event-ID idempotency conflict handling.
- [ ] Internal service-identity authentication.
- [ ] IAM authorization guard/interceptor.
- [ ] PostgreSQL role that cannot UPDATE/DELETE audit rows.
- [ ] Separate read/admin DB role where required.
- [ ] PITR/backup verification.
- [ ] Retention classes and legal-hold policy.
- [ ] WORM/object archival for compliance tiers.
- [ ] Hash-chain verification command/job.
- [ ] Authorized audit export.
- [ ] Full PostgreSQL integration/e2e tests.
- [ ] Retry/DLQ/failure tests.
- [ ] Load/retention-volume tests.
- [ ] Security/penetration tests.
- [ ] Disaster-recovery rehearsal.
