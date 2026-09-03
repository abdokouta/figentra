# ADR-0018 — Figentra service-to-service messaging

## Status

Accepted.

## Decision

Figentra uses NestJS `@nestjs/microservices` as the transport abstraction and
NATS as the default internal transport.

- HTTP/Fastify remains the normal synchronous service interface.
- NATS request/reply is used for internal RPC where crossing a service boundary
  is required.
- NATS events are used for normal asynchronous domain/platform events.
- Kafka is reserved for high-volume durable streams, long retention, replay, and
  analytics pipelines.
- Redis is not the canonical event bus; it is reserved for cache, locks, rate
  limiting, and coordination.
- Business/application code depends on ports/adapters rather than `ClientProxy`
  directly.

NestJS 12's NATS transport uses the NATS v3 driver `@nats-io/transport-node`.

## Security

NATS transport credentials/TLS authenticate the transport. Figentra service
identity JWTs authenticate the application caller. IAM authorizes the requested
operation.

## Consequence

Every service can expose HTTP and an internal NATS listener in one process when
both are needed. Dedicated consumers may use a separate worker entrypoint when
independent scaling is required.
