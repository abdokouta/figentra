---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# Analytics Service — implementation plan

## Ownership

Analytics owns durable analytical ingestion, normalization, deduplication, facts/dimensions/measures, aggregation, attribution and analytical query/read models. Product tracking collection remains an SDK concern of `@stackra/tracking`; analytics does not become a tracking SDK.

## Runtime roles

- `api`: authorized analytical queries, report/read-model access and administrative controls.
- `consumer` / `worker`: tracking/domain-event ingestion, deduplication, aggregation, attribution, backfills, retention and reconciliation.
- Optional scheduler for analytics-owned retention/aggregation jobs.

All roles use the same `services/analytics` source tree and domain modules.

## Contracts

External consumers use versioned `@stackra/contracts/analytics`. Tracking payloads, domain events and provider-specific data are validated at ingestion boundaries. No consumer imports analytics implementation code.

## Implementation requirements

Implement the complete analytics bounded context with durable ingestion, idempotency/deduplication, late-event handling, tenant isolation, analytical storage/read models, retention/backfill/replay, bounded worker concurrency, NATS/queue integration, audit where required, structured logs, OpenTelemetry, health/readiness, graceful shutdown, security, contract/integration/load tests and production deployment.

## Boundary rule

Tracking collects behavioral events. Analytics determines statistical/analytical meaning. Marketing consumes analytical outputs to make activation decisions. Operational telemetry remains owned by observability.
