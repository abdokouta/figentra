---
status: canonical
document: service-migrations-upgrades
service: tenant
version: v1
---
# Tenant Service — Migrations and Upgrade Contract

Tenant uses expand/migrate/contract with mixed-version compatibility for rolling deployment. Destructive changes are separated from the release that stops reading/writing old fields.

Schema changes preserve tenant IDs, lifecycle/context versions, membership/domain uniqueness and referential integrity. New required fields are introduced compatibly, backfilled in bounded restartable batches, validated, then constrained. Large indexes are created online/concurrently where supported. Migrations never call IAM, Identity, DNS, NATS or Registry.

Tenant setting schemas are versioned. A changed setting semantic requires an explicit schema version and migration/translation path; unknown old values cannot be silently coerced into a security-sensitive new meaning.

Event schemas are versioned with overlap for consumers. Lifecycle event breaking changes use new subjects/versions. Context-version semantics are stable; any incompatible derived-context format bumps cache namespace and forces rebuild.

Domain verification migrations preserve challenge ownership/version and cannot accidentally mark pending domains verified. Membership model changes include collision/preflight analysis and authorization regression tests.

Backfills expose checkpoint, processed/remaining/error counts and can pause/resume. Tenant-scale data operations are rate limited to avoid noisy-neighbor impact.

Rollback is allowed only while the previous binary safely reads current schema/event/settings versions. Irreversible lifecycle/data transformations require backup, dry run, approval and roll-forward procedure.

Release verification covers migration on production-shaped data, mixed-version CRUD/lifecycle/membership/domain/settings flows, event compatibility, cache/context rebuild, query plans, lock duration, rollback/roll-forward and Registry manifest/schema version.