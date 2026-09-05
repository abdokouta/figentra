---
status: canonical
document: service-messaging
service: integrations
version: v1
---
# Integrations Service — Messaging Contract

Integrations uses PostgreSQL transactional outbox and NATS JetStream for durable sync, webhook, reconciliation and connection lifecycle work. Authentication providers are excluded; Supabase Auth belongs to Identity.

## Streams and subjects
`INTEGRATIONS_EVENTS`:
- `integrations.integration.registered.v1`, `integrations.integration.updated.v1`
- `integrations.connection.created.v1`, `integrations.connection.authorized.v1`, `integrations.connection.failed.v1`, `integrations.connection.revoked.v1`
- `integrations.credential.reference.updated.v1`
- `integrations.webhook.received.v1`, `integrations.webhook.accepted.v1`, `integrations.webhook.rejected.v1`
- `integrations.sync.requested.v1`, `integrations.sync.started.v1`, `integrations.sync.completed.v1`, `integrations.sync.failed.v1`
- `integrations.reconciliation.started.v1`, `integrations.reconciliation.completed.v1`, `integrations.reconciliation.failed.v1`
- `integrations.mapping.updated.v1`

`INTEGRATIONS_COMMANDS`:
- `integrations.command.sync.v1`
- `integrations.command.reconcile.v1`
- `integrations.command.refresh-authorization.v1`
- `integrations.command.process-webhook.v1`
- `integrations.command.rotate-credential-reference.v1`

`INTEGRATIONS_DLQ` covers webhook processing, provider sync, reconciliation, refresh and outbound delivery poison work.

## Consumers
Durable consumers process accepted webhook work, scheduled/manual sync commands, provider credential/authorization refresh, tenant lifecycle disable/archive facts, and product-service integration commands/events declared by contract. Each consumer declares durable name, filter subject, queue group if parallel, concurrency, ack wait, max ack pending, backoff, max deliveries, DLQ and inbox/idempotency behavior.

## Envelope
All messages carry IDs/type/version/time, tenant, connection/integration/provider IDs, principal/actor where relevant, correlation/causation, trace context and schema version. Raw OAuth tokens, API keys, webhook secrets and provider credentials are forbidden; messages use CredentialRef/connection IDs.

## Provider work semantics
Provider calls are never made inside the source business transaction. A sync/reconciliation job persists intent/state, then worker executes provider requests with explicit idempotency/retry policy. Result state and emitted event commit atomically.

## Webhook intake
HTTP verifies provider signature/timestamp/replay requirements, persists raw-body digest + bounded normalized metadata and durable processing state, acknowledges according to provider contract, then processing occurs asynchronously. Duplicate provider event IDs/digests are no-ops. Invalid signatures never enter trusted domain-event flow.

## Registry/testing
Registry projects all subjects/schemas/consumers/DLQs and provider capability ownership. Tests cover duplicate/out-of-order webhooks, crash after commit before ack, provider 429/5xx/timeouts, NATS outage/outbox recovery, credential refresh races, DLQ replay and schema compatibility.