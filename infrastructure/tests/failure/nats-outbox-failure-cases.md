# NATS / Outbox failure cases

The production test suite must exercise these cases:

1. NATS unavailable at service startup.
2. NATS connection lost after startup.
3. NATS reconnect during an RPC request.
4. NATS publish succeeds and the process crashes before marking the outbox row.
5. NATS publish fails repeatedly until the retry ceiling is reached.
6. Event moves to the service-owned dead-letter table.
7. Duplicate event delivery is received by a consumer.
8. Consumer handler fails after side effects begin.
9. JetStream acknowledgement is delayed.
10. NATS TLS certificate rotation.
11. Service credential rotation.
12. IAM token expiry during a long-running workflow.

Expected guarantees:

- business mutation + outbox row are atomic;
- event delivery is at-least-once;
- consumers are idempotent by event id;
- poison events reach a DLQ instead of blocking unrelated events;
- service credentials can be rotated without code changes.
