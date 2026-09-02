# ADR-0024 — Transactional Outbox

## Status
Accepted.

## Decision
Services that publish business events use a transactional outbox. The business
mutation and outbox record are committed atomically in the service database.
A relay publishes committed records to NATS JetStream and tracks attempts.

The relay provides retry, exponential backoff, dead-letter handling and
idempotency. At-least-once delivery is expected; exactly-once processing is not
assumed.

## Consequences
Database state and published intent cannot silently diverge because of a
publish failure.
