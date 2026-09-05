---
status: canonical
document: service-migrations-upgrades
service: integrations
version: v1
---
# Integrations Service — Migrations and Upgrade Contract

Integrations uses expand/migrate/contract for database, provider adapter, mapping, webhook and sync schema evolution. Rolling deployment must allow previous/current workers to coexist without corrupting connection/checkpoint state.

## Database
Add schema/indexes compatibly, backfill bounded/restartably, validate, then tighten constraints. Large indexes use online/concurrent creation where supported. Migrations never call provider APIs, secret manager, NATS, IAM, Tenant or Registry. Credential values are never migrated through DB rows; only secret references/metadata.

## Provider adapter upgrades
Each adapter has implementation version and capability/schema version. Breaking configuration, webhook normalization, pagination/checkpoint or mapping changes introduce a new version. Existing active connections are preflight-validated and migrated explicitly; no adapter deploy silently reinterprets old configuration/credentials.

Provider API version upgrades include contract fixtures/sandbox verification, old/new response compatibility, rate-limit/idempotency changes, webhook event-version overlap and rollback path. When the external provider removes old API support, Figentra still uses an explicit migration/reconciliation rollout rather than runtime guesswork.

## Mapping/checkpoint evolution
Published mappings are immutable versions. Sync checkpoints record mapping/adapter/entity/direction schema versions. Incompatible changes invalidate/reseed checkpoints through an explicit migration job after dry-run analysis; stale checkpoints cannot be consumed by a new incompatible worker.

## Event/API evolution
Integration events/commands are versioned; breaking changes use new subjects and overlap. Public `/v1` remains compatible; provider-specific raw fields do not leak into stable APIs. Webhook public endpoints may accept multiple provider event/API versions during a controlled overlap.

## Secret/authorization migration
Credential rotation/provider reauthorization is a controlled workflow with overlap only where safe, health validation, atomic active-reference switch and old-secret revocation. Rollback never restores a known-revoked credential.

## Rollback/release verification
Rollback requires old binary compatibility with current DB/mapping/checkpoint/provider configuration versions. Run provider sandbox/fixture contract suites, mixed-version sync/webhook processing, checkpoint resume, credential rotation, event compatibility, query plans, migration lock duration and Registry manifest/provider version comparison before promotion.