# 00 — Figentra Implementation Checklist

This file is the execution checklist for implementing the component specs. It is intentionally generic so every component can be audited against the same standard.

## Scaffold

- [ ] package.json/workspace identity
- [ ] TypeScript config
- [ ] tsup/Vite/Wrangler build config
- [ ] Vitest config
- [ ] Oxlint config
- [ ] Prettier config
- [ ] environment/config schema
- [ ] README
- [ ] CHANGELOG/Changeset policy
- [ ] Docker/cloud manifest where deployable

## Domain

- [ ] ownership statement
- [ ] aggregates/entities/value objects
- [ ] lifecycle/state machine
- [ ] relations
- [ ] invariants
- [ ] tenant/scope semantics
- [ ] actor attribution

## Persistence

- [ ] MikroORM entities
- [ ] repositories
- [ ] indexes
- [ ] constraints
- [ ] migrations from empty DB
- [ ] deterministic seeders
- [ ] RLS where applicable
- [ ] transaction boundaries
- [ ] outbox transaction when events are emitted

## API

- [ ] controllers
- [ ] DTOs
- [ ] validation
- [ ] OpenAPI/Swagger
- [ ] pagination/filter/sort
- [ ] error codes
- [ ] idempotency
- [ ] authorization
- [ ] examples

## Async

- [ ] commands
- [ ] domain events
- [ ] integration events
- [ ] audit events
- [ ] event versioning
- [ ] outbox
- [ ] retry
- [ ] DLQ
- [ ] idempotent consumer
- [ ] replay procedure

## Identity and authorization

- [ ] authentication provider integration
- [ ] principal normalization
- [ ] identity context
- [ ] service identity
- [ ] tenant resolution
- [ ] scope resolution
- [ ] IAM decision
- [ ] policy decision
- [ ] entitlement decision
- [ ] RLS defense in depth
- [ ] secrets redaction
- [ ] webhook verification
- [ ] abuse/rate-limit behavior

## Signal ownership

- [ ] logs owned by logger
- [ ] OTel traces/metrics/context owned by observability
- [ ] operational monitoring owned by infrastructure/operations
- [ ] audit owned by audit boundary
- [ ] product/ad tracking owned by tracking
- [ ] analytical ingestion/aggregation/query owned by analytics
- [ ] campaign/audience/activation owned by marketing
- [ ] billable usage owned by usage/metering
- [ ] domain facts owned by events
- [ ] notification delivery owned by notifications

## Observability

- [ ] structured logs
- [ ] OpenTelemetry traces
- [ ] OpenTelemetry metrics
- [ ] W3C trace context propagation
- [ ] request/correlation/causation IDs
- [ ] resource attributes/service identity
- [ ] log ↔ trace correlation
- [ ] HTTP instrumentation
- [ ] DB/ORM instrumentation
- [ ] NATS/queue instrumentation
- [ ] external provider instrumentation
- [ ] bounded telemetry buffers
- [ ] exporter failure isolation
- [ ] redaction before export
- [ ] health/readiness
- [ ] SLO/SLI definitions
- [ ] alerts/runbook

## Tracking / analytics / marketing

- [ ] tracking event schemas
- [ ] consent/suppression policy
- [ ] campaign/ad attribution context
- [ ] ad impression/click/conversion events
- [ ] tracking deduplication/offline buffering
- [ ] analytics ingestion/deduplication
- [ ] analytics aggregation/read models
- [ ] versioned attribution models
- [ ] marketing audiences/eligibility
- [ ] campaign scheduling/journeys
- [ ] server-side activation
- [ ] conversion forwarding/reconciliation
- [ ] provider credentials isolated server-side
- [ ] tenant/privacy/deletion policy

## Performance

- [ ] query budget
- [ ] indexes justified
- [ ] cache strategy
- [ ] cache invalidation
- [ ] N+1 prevention
- [ ] pagination limits
- [ ] queue throughput
- [ ] timeout/retry budget
- [ ] telemetry CPU/memory overhead budget
- [ ] tracking/analytics ingestion throughput

## Tests

- [ ] unit
- [ ] integration
- [ ] migration
- [ ] repository
- [ ] contract/OpenAPI
- [ ] event compatibility
- [ ] E2E
- [ ] security
- [ ] load/performance where justified
- [ ] tenant isolation
- [ ] trace/context propagation
- [ ] telemetry redaction
- [ ] exporter outage/recovery
- [ ] tracking consent/privacy
- [ ] analytics determinism/rebuild
- [ ] marketing idempotency/retry/reconciliation

## Documentation

- [ ] public API JSDoc
- [ ] non-obvious domain comments
- [ ] ADR links
- [ ] operational runbook
- [ ] architecture diagram
- [ ] dependency matrix
- [ ] ownership matrix
- [ ] signal ownership matrix
- [ ] telemetry data-flow diagram
- [ ] retention/privacy policy
