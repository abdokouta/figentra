---
status: canonical
document: service-data-lifecycle
service: tenant
version: v1
---
# Tenant Service — Data Lifecycle Contract

Tenant lifecycle is explicit: `provisioning -> active -> suspended -> archived`. Illegal reverse transitions are rejected unless an explicit recovery command exists in the implementation contract. Lifecycle version increments atomically with every state change.

Organizations follow active/archive semantics. Memberships follow invited/pending/active/removed/expired where applicable; removed membership cannot silently regain access and any re-add is a new lifecycle action/version. Domain lifecycle is `pending_verification -> verified|failed -> removed`; verification challenges expire and are never reused.

Tenant settings are versioned per key/schema. Security-sensitive settings preserve actor/time/change history and bump tenant-context version where they affect access/runtime behavior.

Archive immediately prevents ordinary mutable operations, triggers downstream lifecycle events, revokes/invalidates membership context through IAM/Identity contracts and starts retention workflows. Archive is not equivalent to immediate physical deletion.

Tenant deletion/erasure is a coordinated, idempotent workflow: validate legal/contractual hold, freeze writes, enumerate Tenant-owned records, emit product-service erasure commands/events through approved contracts, await/reconcile completion, remove/anonymize eligible Tenant data, purge caches, verify domains/invitations/secrets are invalidated, produce completion evidence. Tenant never directly deletes another service database.

Retention classifications are defined per table: active authoritative, historical operational, verification transient, audit-reference. Audit service remains authoritative for governance evidence. Transient challenges/invitations have explicit TTL and cleanup schedule.

Backups restore tenant/organization/membership/domain/settings plus outbox coherently. Restore validation checks unique tenant slugs/domains, lifecycle/context versions and membership integrity before traffic, then clears/rebuilds Redis projections and reconciles downstream subscribers.

Tests cover suspend/archive races, membership remove/re-add, domain challenge expiry, archive retention, legal-hold blocking, idempotent erasure, partial cross-service erasure recovery, restore/context rebuild and prevention of archived tenant resurrection through stale cache/event replay.