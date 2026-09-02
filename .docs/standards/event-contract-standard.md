# Event Contract Standard

Every event contains:
- event ID
- event type
- schema version
- occurred-at
- producer
- correlation ID
- causation ID
- subject/scope
- payload

Consumers must be idempotent. Breaking changes create a new version.
