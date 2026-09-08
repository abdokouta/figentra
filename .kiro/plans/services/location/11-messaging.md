# Location Service — Messaging

## Broker

NATS JetStream is the default internal broker. NestJS transport abstraction is used; raw TCP is not a service contract.

## Commands

Commands are explicit and versioned, for example:

- `location.geofence.evaluate.v1`
- `location.tracking.process.v1`
- `location.provider.refresh.v1`

## Events

Events are documented in `05-events.md`. Producers publish through the outbox pattern. Consumers acknowledge only after durable processing.

## Retry/DLQ

Transient errors retry with bounded exponential backoff. Poison messages move to a dead-letter stream with original metadata and failure reason. Reprocessing is an explicit operator action.

## Schema evolution

Additive changes are preferred. Consumers must tolerate unknown fields. Breaking changes require a new schema version/subject.
