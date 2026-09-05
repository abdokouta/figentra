---
status: canonical
document: service-migrations-upgrades
service: iam
version: v1
---
# IAM Service — Migrations and Upgrade Contract

IAM uses expand/migrate/contract for schema and model evolution. Mixed-version rolling deployment must preserve safe authorization semantics; if compatibility cannot be proven, rollout is serialized with explicit maintenance/traffic controls rather than risking false allow.

Database migrations add columns/tables/indexes compatibly, backfill in bounded resumable batches, validate, then tighten constraints in a later step. Permission catalog migrations are idempotent and reject semantic key reuse. Policy AST schema migrations require dual-read/evaluate support or an explicit version translator during the overlap window.

Published policy versions are immutable. New evaluator behavior is released behind an evaluator/model version, tested against stored policy corpus, shadow-evaluated where appropriate, and promoted only after decision-diff analysis confirms intended changes. Any changed authorization result set is treated as a security change and reviewed.

Events are versioned; breaking schema changes create new subject/version and consumers support overlap. Cache namespaces include evaluator/model schema version and are bumped on incompatible changes. Old cache entries must never be interpreted by a new evaluator without compatibility proof.

Large indexes use online/concurrent creation where supported. No migration calls Identity/Tenant/NATS/Registry or evaluates policies over the network. Backfills expose progress, rate, remaining estimate and errors.

Rollback is allowed only if the prior binary can safely interpret the current schema/model version. Security-sensitive evaluator changes may require roll-forward rather than rollback; this is documented per release. Irreversible migrations require backup and restore drill.

Release verification includes mixed-version authorization checks, deny-precedence/property suite, production policy corpus replay, cache namespace behavior, event compatibility, grant expiry, migration lock duration, query plans, rollback/roll-forward and Registry manifest version checks.