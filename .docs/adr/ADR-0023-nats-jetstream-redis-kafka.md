# ADR-0023 — NATS JetStream, Redis and Kafka

## Status

Accepted.

## Context

Figentra needs synchronous service APIs, durable asynchronous business events, worker execution, caching and future high-volume analytical streaming without operating multiple competing technologies by default.

## Decision

Figentra standardizes on:

- **HTTPS + OpenAPI** for the default synchronous service contract.
- **NATS** as the internal messaging fabric.
- **NATS JetStream** for durable service-to-service events and asynchronous commands/jobs requiring persistence, acknowledgement, replay or redelivery.
- **Redis** for cache, rate limiting, short-lived coordination and bounded distributed locks.
- **Kafka** is not deployed by default and may be introduced only through a separate ADR when measured streaming requirements make JetStream insufficient.

Durable publication follows transactional outbox semantics.

## Rules

1. Redis Pub/Sub is not an authoritative durable event bus.
2. Services do not directly poll databases as a substitute for messaging.
3. Durable consumers must be idempotent.
4. Event contracts are versioned and owned through `@stackra/contracts`.
5. Service identities authenticate internal calls; browser/user credentials are not reused as service credentials.
6. A second message broker requires an ADR defining ownership, schemas, retention, security, operations, cost and failure behavior.

## Consequences

The default platform operates one primary durable message backbone, reducing operational and architectural duplication while retaining Redis for acceleration and Kafka as a deliberate future option. JetStream retention, replay and consumer semantics become part of service reliability design.

## Supersedes/clarifies

This ADR supersedes any repository language that presents Kafka as the default asynchronous transport. Existing service specifications must follow this decision.
