# ADR-0022 — Service-to-Service Communication

## Status

Accepted.

## Decision

Figentra uses **HTTPS + OpenAPI** for the default synchronous service API and **NATS + JetStream** as the canonical internal messaging platform.

- HTTPS + OpenAPI + typed SDK: default synchronous service-to-service calls.
- NATS request/reply: allowed for explicitly justified internal low-latency interactions.
- NATS JetStream: durable events and asynchronous commands/jobs requiring acknowledgement, replay or redelivery.
- Transactional outbox: required before durable event publication.
- Redis: cache, rate limiting, short-lived coordination and bounded locks only.
- Kafka: not default; requires a dedicated ADR based on measured requirements.

Service calls authenticate the **calling service identity**. User/browser tokens are not blindly forwarded as service credentials.

## Reliability rules

Consumers must be idempotent, have bounded retries/backoff, explicit terminal failure handling, correlation/trace propagation, readiness and graceful shutdown. Durable event contracts are versioned in `@stackra/contracts`.

## Consequences

Figentra has one canonical durable messaging backbone rather than competing NATS/Kafka/Redis event architectures. Redis remains useful for acceleration and coordination. Kafka remains available as a specialized future data-streaming technology without imposing its operational cost and semantics on every bounded context.
