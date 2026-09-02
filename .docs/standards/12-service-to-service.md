# Service-to-Service Communication Standard

## Default

Do not call another service's database.

Do not import another service's domain entities.

Do not expose Nest TCP ports as the platform API.

Use one of:

1. Internal HTTPS for synchronous request/response when an HTTP contract is
   genuinely useful.
2. NATS through `@nestjs/microservices` for internal commands/events.
3. Kafka only for durable, high-volume event streams that require log/replay
   semantics.

## Nest integration

`@nestjs/microservices` is a transport abstraction, not the architecture
itself. The application code should depend on a Figentra internal messaging
port/adapter rather than directly constructing `ClientProxy` throughout domain
code.

The Nest documentation provides `ClientProxy`, `ClientsModule`, `send()` for
request-response, and `emit()` for event publication. citeturn0search0

## Security

Every internal message carries:
- message id
- correlation id
- causation id
- producer service
- audience
- principal/service identity
- tenant/scope context when applicable
- schema version
- timestamp

Authentication is service identity, not a shared static secret.

Authorization remains an IAM decision.

## Reliability

Consumers must be idempotent.

Commands require:
- timeout
- bounded retry
- idempotency key
- explicit failure semantics

Events require:
- durable publication/outbox
- consumer retry
- dead-letter handling
- replay strategy where supported

## Raw TCP

Nest's TCP transporter remains available for specialized cases and TLS can be
configured, but it is not the Figentra default. citeturn0search0
