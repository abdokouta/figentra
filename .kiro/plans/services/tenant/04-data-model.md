# Tenant Service — Data Model

PostgreSQL is owned exclusively by Tenant. Other services use IDs/events/contracts, never Tenant tables.

## Tables
`tenants(id, key, name, status, plan_ref, created_at, updated_at, version)` unique key; lifecycle constrained to `provisioning|active|suspended|archived`.

`organizations(id, tenant_id, key, name, status, timestamps, version)` unique `(tenant_id,key)`.

`tenant_memberships(id, tenant_id, principal_id, organization_id, status, joined_at, left_at, version)` unique active `(tenant_id,principal_id,organization_id)`.

`tenant_domains(id, tenant_id, hostname, verification_status, challenge, verified_at, expires_at, timestamps, version)` unique normalized hostname.

`tenant_settings(tenant_id, key, value, version, updated_at)` unique `(tenant_id,key)`; schema validates allowed settings.

`tenant_lifecycle(id, tenant_id, from_status, to_status, reason, actor_principal_id, occurred_at)` append-only transition evidence.

`outbox(...)` canonical transactional outbox.

## Invariants
Tenant key and domain hostname are normalized and unique. Archived tenants cannot receive ordinary mutations. Suspend/activate/archive transitions follow the explicit state machine. Membership principal IDs are opaque Identity IDs. Settings cannot contain unbounded arbitrary data or secrets.

## Transactions
Lifecycle mutation, affected state and outbox/audit fact commit atomically. Membership and organization mutations use optimistic versioning.

## Indexes
Tenant status/key; organization tenant/key; membership tenant/principal/status; domains normalized hostname/status; settings tenant/key; lifecycle tenant/time.

## Migration/retention
Expand/contract rolling migrations. Lifecycle evidence follows audit/retention policy; verification challenges expire and are never reused. Backups/PITR are tested.