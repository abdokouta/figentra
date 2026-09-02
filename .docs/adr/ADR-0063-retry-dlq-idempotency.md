# ADR-0063 — Retry, DLQ and Idempotency

**Status:** Accepted

Delivery is at-least-once. Consumers validate contracts and use event ID as an
idempotency key. Retryable failures use bounded exponential backoff. Poison or
terminal failures go to a durable DLQ preserving original event metadata.
