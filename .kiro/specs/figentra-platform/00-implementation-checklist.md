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

## Security

- [ ] authentication
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

## Performance

- [ ] query budget
- [ ] indexes justified
- [ ] cache strategy
- [ ] cache invalidation
- [ ] N+1 prevention
- [ ] pagination limits
- [ ] queue throughput
- [ ] timeout/retry budget

## Observability

- [ ] logs
- [ ] traces
- [ ] metrics
- [ ] correlation IDs
- [ ] health/readiness
- [ ] alerts/runbook

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

## Documentation

- [ ] public API JSDoc
- [ ] non-obvious domain comments
- [ ] ADR links
- [ ] operational runbook
- [ ] architecture diagram
- [ ] dependency matrix
- [ ] ownership matrix
