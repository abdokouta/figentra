# ADR-0023 — Event Contracts and Versioning

## Status
Accepted.

## Decision
All platform events use a versioned envelope containing event ID, event type,
schema version, occurred-at timestamp, producer, correlation ID, causation ID,
subject/scope metadata, and payload.

Events are immutable contracts. Breaking changes require a new major event
version/type. Consumers must be idempotent.

## Naming
Events use stable domain-oriented names rather than transport-specific names.

## Consequences
Events can be replayed, traced, audited, and consumed by independently
deployed services.
