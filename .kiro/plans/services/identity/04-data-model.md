---
status: canonical
document: service-data-model
service: identity
version: v1
storage: postgresql
---
# Identity Service — Data Model

## Database ownership

Identity owns its PostgreSQL schema. No other service reads these tables directly. Cross-service references use opaque IDs and versioned contracts. Every tenant-associated row carries `tenant_id` where the domain operation is tenant-scoped.

## Tables

### principals
`id uuid PK`, `type`, `status`, `display_name`, `created_at`, `updated_at`, `version bigint`. Unique ID. Type is constrained to `human|service|integration|system|agent`; status is `active|disabled|pending|deleted`.

### identities
`id uuid PK`, `principal_id FK principals`, `provider`, `external_subject`, `verification_state`, `assurance`, bounded `metadata jsonb`, timestamps, `version`. Unique `(provider, external_subject)` and index `(principal_id, status)`.

### sessions
`id uuid PK`, `principal_id`, `provider`, `provider_session_ref`, `refresh_ref_hash`, `issued_at`, `last_seen_at`, `expires_at`, `revoked_at`, `revocation_reason`, `assurance`, `version`. Never store raw access/refresh tokens. Unique provider session reference where supported.

### credential_refs
`id uuid PK`, `principal_id`, `kind`, `secret_reference`, `status`, `created_at`, `rotated_at`, `expires_at`. Secret reference only; secret value is external to PostgreSQL.

### service_identities
`id uuid PK`, `principal_id`, `name`, `status`, `credential_ref_id`, `allowed_audience`, `created_at`, `updated_at`, `revoked_at`, `version`. Name unique among active records.

### identity_links
`id uuid PK`, `principal_id`, `identity_id`, `link_type`, `verified_at`, `created_at`. Unique `(principal_id, identity_id)`.

### delegations
`id uuid PK`, `actor_principal_id`, `effective_principal_id`, `tenant_id`, `scope jsonb`, `purpose`, `starts_at`, `expires_at`, `status`, `created_at`, `revoked_at`, `version`. Index actor/effective subject/tenant/time.

### provider_events
`id uuid PK`, `provider`, `external_event_id`, `event_type`, `received_at`, `verified_at`, `processed_at`, `status`, bounded payload, `error_code`. Unique `(provider, external_event_id)`.

### outbox
Standard platform outbox with event ID, aggregate ID/type, event type/version, tenant, payload, occurred-at, published-at, attempt count, next attempt, last error. Unique event ID.

## Integrity

Foreign keys are enforced inside the Identity database. State transitions are transactional. Optimistic versioning prevents lost updates. Provider events and resulting state mutations commit with their outbox records in one transaction.

## Retention

Sessions and provider-event payloads follow explicit retention policies and minimize stored provider data. Revoked sessions retain only the security evidence needed for replay/revocation controls. Credential references survive only while operationally required.

## Encryption and classification

Identifiers and normal metadata use standard database encryption at rest. Credential references, provider metadata and security-sensitive fields are classified restricted. Raw credentials, tokens and passwords are prohibited. Application-level encryption is used where platform data-classification policy requires it.

## Migrations

Migrations are ordered, forward-compatible with rolling deployments, and use expand/contract for breaking changes. Every migration has an automated upgrade test and rollback/recovery procedure. Destructive changes require prior compatibility removal and verified backup/recovery.

## Query/index rules

Indexes support principal lookup, provider subject verification, active session lookup, service-identity lifecycle, delegation validity, and webhook deduplication. Queries must always constrain tenant-scoped data when `tenant_id` exists. Unbounded scans are forbidden in request paths.

## Backup/recovery

PostgreSQL backup, point-in-time recovery, restore verification and retention are platform responsibilities executed against this schema. Identity documents the required RPO/RTO and validates restore compatibility before release.