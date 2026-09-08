---
name: figentra-async-design
description: Design or implement queues, NATS JetStream consumers, transactional outbox, retries, DLQs, idempotency, background workers, and schedulers in Figentra.
---

# Figentra Async Design

Use NATS JetStream for durable asynchronous work. Use a transactional outbox whenever a database transaction must atomically produce a durable message.

For every message define:
- stable subject/event name and version;
- producer and authoritative owner;
- payload schema and correlation/causation identifiers;
- delivery semantics and acknowledgement behavior;
- idempotency key and deduplication strategy;
- timeout, retry count, backoff and jitter;
- poison-message classification and DLQ/recovery path;
- ordering requirements and concurrency limits;
- observability and audit requirements;
- replay and operational recovery procedure.

Consumers belong to the module that interprets the message. A worker runtime is not a new business service. Scheduled jobs belong to the owning module; the scheduler only dispatches them.

Do not use Redis as the durable event bus. Do not publish to NATS directly from a transaction without an outbox when atomicity is required. Do not make consumers depend on in-memory state for correctness.