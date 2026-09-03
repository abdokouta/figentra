# Messaging Standard

**Status:** Normative

## Canonical choices

1. HTTPS + OpenAPI is the default synchronous service contract.
2. NATS is the canonical internal messaging fabric.
3. NATS JetStream is the canonical durable asynchronous transport.
4. Redis is cache/coordination infrastructure, not the durable business event bus.
5. Kafka is optional and requires an ADR based on measured requirements.

## Required behavior

Durable events use transactional outbox. Event contracts are versioned in `@stackra/contracts`. Consumers are idempotent and implement bounded retries, terminal failure handling and reconciliation/DLQ semantics.

## Security

Service-to-service traffic is authenticated with service identities and scoped credentials. TLS is required for non-local environments. Secrets are externalized and never logged.

## Reliability

Every consumer has bounded concurrency, timeout/cancellation, explicit acknowledgement, retry policy, readiness and graceful shutdown. Event IDs are immutable dedupe keys.

## Naming

Subjects and event types are owned by the producing bounded context and versioned. Consumers must not infer schemas from implementation classes or database tables.

## Forbidden

Redis Pub/Sub for durable business events, unbounded retries, direct database polling as a message bus, unversioned events, and a second message broker without an ADR.
