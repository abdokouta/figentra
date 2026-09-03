# 13 — Events

**Status: FOUNDATION**

## Event categories

```text
Domain Event
Platform Event
Integration Event
Audit Event
```

## Outbox

```text
DB transaction
 ├── state
 └── outbox event
        ↓
relay
        ↓
transport
        ↓
consumer
```

## Event envelope

Required:

```text
event_id
event_type
version
occurred_at
producer
correlation_id
causation_id
payload
```

## Rules

- immutable events
- schema versioning
- idempotent consumers
- retry
- DLQ
- replay where safe
- no secrets in events

## Transport

Workload-specific:

- Cloudflare Queues
- AWS messaging
- Kafka/MSK for real streaming requirements
