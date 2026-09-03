---
status: canonical
component: package
package: "@stackra/nats"
---
# `@stackra/nats` — implementation plan

NATS transport adapter for request/response and event messaging. Business contracts live in `@stackra/contracts`; NATS is transport only.

## API
Connection manager, request/publish/subscribe, queue-group consumers, headers/metadata, durable consumer configuration where supported, drain/close lifecycle and typed transport errors.

## Reliability
Explicit ack/redelivery semantics, bounded concurrency, backpressure, timeouts, cancellation, retry/DLQ policy owned by the consumer role, graceful drain and reconnect behavior.

## Security
TLS, credentials from secret manager, subject allowlists and tenant/context propagation. No payload logging by default.

## Versioning/testing
Use current NATS Node transport (`@nats-io/transport-node` through NestJS integration where applicable). Provider conformance, disconnect/reconnect, duplicate delivery, queue scaling and trace propagation tests.

## Exit criteria
One NATS abstraction and one production transport policy with no legacy transport duplication.
