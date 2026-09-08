# Figentra Feature Delivery

Use this skill for bounded production implementation.

- Read `AGENTS.md`, canonical architecture, relevant `.kiro/plans/**`, and the owning agent charter.
- Classify the owning module before coding.
- Keep domain/application/infrastructure/presentation/messaging/jobs/schedules together inside the owner.
- Use HTTPS/OpenAPI for synchronous contracts and NATS JetStream + transactional outbox for durable async.
- Define idempotency, retries, DLQ, timeout, tenancy, IAM, audit and observability behavior.
- Add unit, integration, contract, architecture and failure tests as applicable.
- Run repository standards and production-readiness checks before completion.
- Never create a new service/package/broker/runtime boundary without architecture review.