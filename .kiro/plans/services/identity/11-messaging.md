---
status: canonical
document: service-messaging
service: identity
version: v1
runtime: nestjs
---
# Identity Service — Messaging Contract

## 1. Purpose

This document defines every asynchronous transport contract owned or consumed by Identity. Identity uses NATS JetStream for durable asynchronous delivery and PostgreSQL transactional outbox for atomic publication. No controller or domain handler publishes directly to NATS inside the database transaction.

## 2. Streams and subjects

### `IDENTITY_EVENTS`
Subjects:
- `identity.principal.created.v1`
- `identity.principal.updated.v1`
- `identity.principal.disabled.v1`
- `identity.identity.linked.v1`
- `identity.identity.unlinked.v1`
- `identity.session.created.v1`
- `identity.session.revoked.v1`
- `identity.session.family_revoked.v1`
- `identity.service_identity.created.v1`
- `identity.service_identity.rotated.v1`
- `identity.service_identity.revoked.v1`
- `identity.delegation.created.v1`
- `identity.delegation.revoked.v1`
- `identity.provider_event.accepted.v1`
- `identity.provider_event.rejected.v1`

Retention: limits-based, file storage, replicated according to environment production standard. Event retention must be long enough for downstream replay and recovery; Audit remains the durable governance record, not JetStream.

### `IDENTITY_COMMANDS`
Subjects:
- `identity.command.reconcile-provider-identity.v1`
- `identity.command.expire-sessions.v1`
- `identity.command.rotate-service-credential.v1`
- `identity.command.revoke-session-family.v1`

Commands are internal platform contracts and require authenticated service identity metadata.

### `IDENTITY_DLQ`
Subjects:
- `identity.dlq.provider-webhook.v1`
- `identity.dlq.reconciliation.v1`
- `identity.dlq.session-maintenance.v1`

## 3. Event envelope

Every published message includes `eventId`, `eventType`, `eventVersion`, `occurredAt`, `producer`, `producerVersion`, `tenantId?`, `principalId?`, `actorPrincipalId?`, `correlationId`, `causationId`, `traceparent`, `schemaVersion`, and payload. Secrets, access tokens, refresh tokens, raw credentials, provider SDK objects and password material are forbidden.

## 4. Publishers

`IdentityOutboxPublisher` is the only production publisher. Domain/application transactions append outbox rows atomically. The publisher claims rows with bounded batches, publishes with message ID equal to the outbox/event ID, waits for JetStream acknowledgement, then marks the row published. Failure leaves the row retryable.

## 5. Consumers

### `identity-provider-webhook-consumer`
Consumes validated provider webhook work after HTTP signature verification and durable intake. Durable name: `identity-provider-webhook-v1`. Concurrency is bounded. Duplicate provider event IDs are no-ops. Poison payloads enter `identity.dlq.provider-webhook.v1` after bounded exponential backoff.

### `identity-tenant-lifecycle-consumer`
Consumes tenant suspension/archive events required to revoke or constrain affected active sessions according to the Identity/Tenant contract. It does not modify Tenant state.

### `identity-iam-security-consumer`
Consumes IAM security-sensitive invalidation facts when identity assurance or delegation must be re-evaluated. Authorization state is never copied into Identity as a second source of truth.

## 6. Delivery guarantees

- At-least-once delivery.
- Idempotent handlers mandatory.
- Ordering is required only per aggregate where explicitly declared; global ordering is not assumed.
- Message IDs are stable UUIDs.
- Consumer state mutations and resulting events use inbox/idempotency + transactional outbox in one database transaction.
- Retries use bounded exponential backoff with jitter.
- DLQ is operationally visible and replay requires an audited administrative command.
- Consumer shutdown stops fetching, drains in-flight messages, commits successful work, and leaves uncompleted messages unacked.

## 7. Request/reply

Identity does not use NATS request/reply as a substitute for the canonical synchronous HTTPS API. Authentication/token verification calls remain synchronous HTTP/service contracts unless an ADR changes the transport.

## 8. Registry projection

The NestJS Registry integration publishes all streams, subjects, event schemas, command schemas, durable consumers, queue groups, DLQ subjects, runtime roles and ownership metadata defined here. Registry projection is descriptive; JetStream configuration remains infrastructure-owned and source-of-truth definitions remain in code/contracts and IaC.

## 9. Testing gate

Contract tests verify every schema against `@stackra/contracts`; integration tests run real JetStream, duplicate delivery, redelivery after crash, ordering where required, DLQ exhaustion, replay, outbox restart recovery, graceful shutdown, and schema-version compatibility. No undocumented subject or consumer may exist in production.