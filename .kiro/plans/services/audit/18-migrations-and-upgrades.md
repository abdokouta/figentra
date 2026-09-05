---
status: canonical
document: service-migrations-upgrades
service: audit
version: v1
---
# Audit Service — Migrations and Upgrade Contract

Audit schema evolution must preserve evidentiary integrity across rolling deployment. Expand/migrate/contract is mandatory; destructive changes are isolated from the release that stops using old structures.

## Record/hash evolution
Canonicalization and hash algorithms are versioned per record. Existing records are never rehashed in place merely because a new version is introduced. New records may use a new canonicalization/hash version after migration/validation, while integrity verification understands all supported historical versions.

Chain partition or sequencing changes require a migration design that preserves historical chain proof, explicit bridge/checkpoint metadata and independently verifiable before/after ranges. No migration silently rewrites `previousHash`, sequence or source event identity.

## Database migrations
Additive schema/index changes first, bounded restartable backfills second, constraints last. Large indexes use online/concurrent creation where possible. Migrations do not call NATS, object storage, IAM, Registry or source services inside DB transactions. Every backfill has progress/error metrics and can resume.

## Retention/legal-hold changes
Policy schema upgrades preserve existing effective policy decisions. Any migration affecting deletion eligibility runs a dry-run eligibility report before enabling deletion workers. Legal holds are migrated before retention cleanup can run.

## Event/API compatibility
Inbound source event versions are explicitly allowlisted; adding a new accepted version does not remove old support in the same rollout. Audit-owned event breaking changes use new versions/subjects. API filters/export formats remain backward compatible within `/v1`; breaking semantics require new version.

## Archive format evolution
Archive manifests include format/schema/hash/canonicalization versions. New archive writers do not invalidate old archive readers; restore tooling supports all retained formats or includes a verified offline migration path that never destroys the original artifact before verification.

## Rollback
Rollback is permitted only when the previous binary can read current DB/record/archive versions. Integrity-related irreversible changes are roll-forward only and require backup/restore drill, staging verification and explicit approval.

## Release verification
Run mixed-version ingestion/query/export/integrity tests, historical hash verification, retention/hold dry run, archive round-trip, query plans/lock durations, restore verification and Registry manifest version checks before production promotion.