# Event Standards

## Envelope

```json
{
  "id": "evt_...",
  "type": "identity.created",
  "version": 1,
  "occurred_at": "...",
  "producer": "identity",
  "correlation_id": "...",
  "causation_id": "...",
  "payload": {}
}
```

## Rules

- immutable
- versioned
- idempotent
- no secrets
- no unnecessary PII
- retryable
- traceable

## Consumer

Consumers store/process event IDs where deduplication is required.

## Breaking changes

Create a new event version.
