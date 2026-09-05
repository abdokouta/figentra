# Tenant Service — Events Contract

Stream: `FIGENTRA_TENANT`. Canonical envelope: eventId, type/version, aggregateId/type, tenantId, actor/effective principal, occurredAt, correlationId, causationId, schemaVersion, payload.

Published subjects:
`figentra.tenant.created.v1`
`figentra.tenant.activated.v1`
`figentra.tenant.suspended.v1`
`figentra.tenant.archived.v1`
`figentra.tenant.organization.created.v1`
`figentra.tenant.membership.added.v1`
`figentra.tenant.membership.revoked.v1`
`figentra.tenant.domain.created.v1`
`figentra.tenant.domain.verified.v1`
`figentra.tenant.settings.updated.v1`

All state-changing transactions write outbox rows atomically. Publisher uses event ID as message ID and retries transient failures with bounded backoff; permanent failures go to DLQ.

Consumers process Identity principal lifecycle, IAM-relevant context and Monetization plan/entitlement signals when required by tenant lifecycle. Tenant never writes foreign storage.

Events contain no credentials or secrets. Membership events use opaque principal IDs. Schema evolution is versioned and replay is idempotent. Archived/suspended transitions are never inferred from telemetry; they come from authoritative Tenant state.