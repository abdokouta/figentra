# ADR-0022 — Service-to-Service Communication

## Status

Accepted.

## Decision

Figentra uses HTTP for synchronous external/service APIs and NATS JetStream for
asynchronous events and internal messaging. NestJS `@nestjs/microservices` is
used where Nest transport integration provides value; it is not mandatory for
every service.

Service calls must use authenticated service identity. User tokens are not
blindly forwarded between services.

## Patterns

- Request/response: authenticated HTTP or NATS request/reply when appropriate.
- Events: NATS JetStream.
- Long-running work: event/job/workflow.
- Durable delivery: transactional outbox before publishing.

## Consequences

Communication remains explicit, observable, retryable, and independently
evolvable.
