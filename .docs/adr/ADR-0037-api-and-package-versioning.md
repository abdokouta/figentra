# ADR-0037 — API, Webhook, Event and Package Versioning

## Status
Accepted.

## Decision
Public APIs, webhooks, events and package exports have explicit versioning
contracts. Breaking API changes require a new major API version or explicitly
versioned contract. Additive compatible changes may remain within the current
major version.

Every externally consumable webhook/event has a schema version independent of
the transport protocol.

## Consequences
Consumers can migrate deliberately and old contracts can be retired with
documented deprecation windows.
