---
status: canonical
document: service-events
service: identity
version: v1
transport: nats-jetstream
---
# Identity Service — Events Contract

## Envelope

Every event contains `eventId`, `type`, `version`, `occurredAt`, `producer`, `aggregateId`, `tenantId` when applicable, `principalId` when applicable, `correlationId`, `causationId`, `schemaVersion`, and payload. Consumers must treat delivery as at-least-once and deduplicate by event ID.

## Published events

`identity.principal.created.v1` — canonical Principal created.

`identity.principal.disabled.v1` — Principal disabled with reason.

`identity.identity.linked.v1` / `identity.identity.unlinked.v1` — external identity relationship changed.

`identity.session.created.v1` / `identity.session.revoked.v1` — session lifecycle evidence.

`identity.service_identity.created.v1` / `identity.service_identity.revoked.v1` — non-human identity lifecycle.

`identity.delegation.created.v1` / `identity.delegation.revoked.v1` — actor/effective-subject context lifecycle.

`identity.provider_event.accepted.v1` — authenticated provider event normalized into the platform.

Authentication success/failure telemetry is operational telemetry, not automatically a durable business event; security-significant evidence is routed to Audit through the canonical audit/event contract.

## NATS

Stream: `FIGENTRA_IDENTITY`.

Subjects:
`figentra.identity.principal.created.v1`
`figentra.identity.principal.disabled.v1`
`figentra.identity.identity.linked.v1`
`figentra.identity.identity.unlinked.v1`
`figentra.identity.session.created.v1`
`figentra.identity.session.revoked.v1`
`figentra.identity.service-identity.created.v1`
`figentra.identity.service-identity.revoked.v1`
`figentra.identity.delegation.created.v1`
`figentra.identity.delegation.revoked.v1`
`figentra.identity.provider-event.accepted.v1`

Retention is configured to satisfy replay, audit, and recovery requirements; durable event records also exist in the outbox until publication is confirmed.

## Consumption

Identity consumes only contracts required for its own lifecycle reconciliation, including verified provider-event delivery and relevant Tenant lifecycle signals. Consumer handlers are idempotent and never mutate foreign service storage.

## Transactional publication

Domain mutation and outbox insert occur in one database transaction. A publisher claims pending outbox rows, publishes with message ID/event ID, records success, and retries transient failures with bounded exponential backoff. Permanent failures enter the service DLQ/operational remediation path.

## Schema evolution

Payloads are versioned. Additive changes remain within a version only when consumers tolerate unknown fields. Removing/renaming fields requires a new event version and a compatibility window. Consumers must reject unsupported schema versions safely and expose telemetry.

## Security

Events contain no passwords, access tokens, refresh tokens, secrets, or unnecessary provider payloads. Tenant and principal IDs are included only where needed. Sensitive metadata is redacted before publication.

## Replay

Replay is an operator-controlled operation. Consumers must be deterministic/idempotent, and replay cannot bypass current authorization or security checks. Provider events are never replayed as trusted external payloads without signature verification.