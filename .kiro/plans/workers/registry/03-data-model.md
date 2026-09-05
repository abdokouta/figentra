# Registry — Data Model

D1 is authoritative. Tables are control-plane metadata only.

## Core tables

`applications(id, tenant_id, slug, name, status, created_at, updated_at)`; `application_versions(id, application_id, version, artifact_digest, manifest_hash, schema_version, created_at)`; `environments(id, application_id, name, slug, status, domain, created_at)`; `publications(id, application_id, environment_id, version_id, manifest_hash, status, idempotency_key, published_at)`.

## Projection tables

`services`, `routes`, `resources`, `actions`, `permissions`, `capabilities`, `events`, `consumers`, `workers`, `schedules`, `configuration_schemas`, `integrations`, `webhooks`, `realtime_channels`, `reports`, `search_definitions`, `branding_metadata`, `deployment_metadata`, `compatibility_rules`.

Every projection references application/version/environment and publication revision. Foreign keys and unique constraints prevent cross-application collisions. Tenant ID is mandatory wherever tenancy applies.

## Constraints

Unique `(application_id, slug)`; `(application_id, environment_id, version)`; `(application_id, environment_id, version, manifest_hash)`; publication idempotency per application/environment/key. Version reuse with another hash is rejected. No secrets or opaque credential values are persisted.

## Indexes

Indexes cover application slug, tenant/application, environment, version, publication status, manifest hash, route host/path, capability name, permission key, event subject, worker name and schedule identifier. Indexes are selected from actual resolution queries and verified with D1 query plans.

## Lifecycle

Application → registered → active → suspended/archived. Versions/publications are immutable. Projections may be superseded but are never silently rewritten. Retention preserves deployment/audit references while obsolete cache entries are disposable. D1 backups/export and restore procedures are required.

## Migration

Forward-compatible schema migrations, additive-first changes, index creation with production-safe locking semantics, migration version tracking and rollback/recovery procedures. KV never requires migration authority.