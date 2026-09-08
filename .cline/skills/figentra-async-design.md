# Figentra Async Design

Use for NATS JetStream, transactional outbox, queue consumers, retries, DLQ, idempotency, workers and schedulers.

Every async contract must define owner, versioned payload, subject, correlation/causation, acknowledgement, idempotency, timeout, retry/backoff, DLQ/recovery, concurrency/order requirements, observability and replay strategy.

Consumers and scheduled jobs belong to the owning module. Worker/scheduler runtime is not a new business service. Redis is not the durable event bus.

Use `.kiro/skills/figentra-async-design/SKILL.md` as the canonical detailed procedure.