---
status: canonical
component: service
name: usage
---
# Usage Service — implementation plan

Own metering facts, aggregation windows, quotas/usage counters and billable usage exports. Analytics consumes analytical copies; usage remains authoritative for limits/billing.

## Modules
`meter`, `usage-record`, `counter`, `window`, `aggregation`, `quota`, `export`, `reconciliation`, `persistence`, `http`, `messaging`.

## Runtime
NestJS `api` for usage queries and administration; `consumer` for metering events; `worker` for aggregation/reconciliation; `scheduler` for window close and retention jobs.

## Contracts
Versioned usage commands/events/queries in `@stackra/contracts`; stable event IDs and measurement units are mandatory.

## Persistence/reliability
Append-only raw usage facts with dedupe keys, transactional aggregates, optimistic versions and outbox. At-least-once ingestion, idempotent consumers, bounded retries/DLQ and reconciliation from raw facts.

## Security / tenancy
Tenant isolation at ingestion and query layers; service authentication; usage payload minimization; sensitive identifiers hashed/tokenized where possible.

## Observability/testing
Track ingest rate, duplicate rate, lag, aggregation latency and reconciliation drift with OTel. Test exactly-once effects under at-least-once delivery, concurrency, isolation and migration compatibility.

## Deployment
Dockerized API/worker/scheduler roles, Terraform-managed queues/storage/alerts, readiness and graceful shutdown.

## Exit criteria
Durable, replayable, auditable metering with deterministic aggregates and production-grade backpressure/reconciliation.
