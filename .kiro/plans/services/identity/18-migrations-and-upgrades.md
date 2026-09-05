---
status: canonical
document: service-migrations-upgrades
service: identity
version: v1
---
# Identity Service — Migrations and Upgrade Contract

## 1. Database evolution
All schema evolution uses expand/migrate/contract. Deployments must remain compatible with the immediately previous running service version during rolling rollout. Destructive column/table changes are forbidden in the same release that removes application use.

## 2. Migration rules
- Every migration has deterministic up behavior and documented rollback/recovery behavior.
- Schema migrations run once under an advisory/distributed migration lock before application rollout proceeds.
- Large indexes use non-blocking/concurrent creation where supported.
- New non-null fields are introduced nullable/defaulted, backfilled in bounded batches, validated, then constrained in a later compatible step.
- Backfills are restartable, checkpointed, observable and rate-limited.
- No migration calls Supabase, NATS, IAM, Tenant or another network service inside a database transaction.
- Identity uniqueness/security constraints are database-enforced after backfill validation.

## 3. Event and message evolution
Event schemas are versioned. Producers may add backward-compatible optional fields within a version only when contract rules allow it; breaking changes create a new event version/subject. Consumers support the overlap window necessary for rolling deployment. Old consumers are retired only after Registry/telemetry proves no active dependency.

## 4. API evolution
`/v1` changes remain backward compatible. Breaking request/response semantics require a new API version and explicit deprecation schedule. Authentication/security bugs may require emergency tightening without preserving unsafe behavior; such changes require release/security notes and coordinated clients.

## 5. Provider mapping upgrades
Changes to Supabase claim mapping, issuer/audience rules, assurance mapping or provider subject normalization use dual-read/verification rollout where necessary. Existing Identity rows are never bulk-rewritten without preflight collision analysis, dry-run report, backup and reconciliation plan.

## 6. Cache/version upgrades
Cache keys include schema/version namespace. Deployments that alter cached representation bump namespace to prevent old/new binary incompatibility. Security-relevant cache entries always carry authoritative version/expiry metadata.

## 7. Rollback
Rollback is permitted only while the database/event/API state remains readable by the previous version. Irreversible migrations are isolated from application rollout and require backup, restore drill, approval and roll-forward recovery procedure.

## 8. Release verification
Pre-production verifies migration against a production-shaped copy/synthetic equivalent, lock duration, query plans, index usage, backfill throughput, rollback/roll-forward, mixed-version API/event compatibility and provider reconciliation. Post-deploy verifies constraints, outbox health, authentication success/failure baseline, consumer lag and Registry manifest version.