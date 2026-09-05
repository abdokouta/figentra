---
status: canonical
document: service-data-lifecycle
service: audit
version: v1
---
# Audit Service — Data Lifecycle Contract

Audit data is append-only governance evidence. Ordinary update/delete APIs for `AuditRecord` do not exist. Corrections are represented by new records referencing prior evidence where policy permits; history is never silently rewritten.

## Record lifecycle
Accepted source event -> validated/canonicalized -> appended -> integrity-linked -> retained hot -> archived if policy requires -> deleted only when retention permits and no legal hold applies. Every transition is explicit, idempotent and auditable.

## Integrity
Each chain partition has stable sequence ordering and `previousHash`; record hash is derived from canonical record bytes/schema version/previous hash using the configured algorithm. Canonicalization/hash version is stored with the record. Integrity checks are read-only verification operations producing immutable check results/findings.

## Retention
Retention policy is versioned by tenant/data class/event class. Effective retention is the maximum required by applicable policy/legal hold. Retention changes never retroactively delete held records. Deletion eligibility is computed deterministically and rechecked immediately before deletion.

## Legal holds
Hold lifecycle: `active -> released`. Scope may target tenant, principal, resource/event class, time range or case reference according to schema. Active holds block archive deletion/purge for matching evidence. Release never immediately deletes; normal retention eligibility process resumes.

## Exports
Export lifecycle: requested -> authorized snapshot/filter resolved -> generating -> completed|failed -> expired/purged. Export artifact is encrypted, checksummed, access-controlled and short-lived according to classification. Export generation does not mutate source audit records.

## Archive
Archive batches are immutable objects with manifest, record range, chain metadata, checksums, schema/hash versions and encryption metadata. Archive completion is verified before hot-data deletion becomes eligible. Restore/re-hydration verifies manifest and chain integrity before records are queryable.

## Privacy/erasure
Audit may retain evidence when lawful governance basis overrides ordinary erasure. Where minimization is permitted/required, the policy uses approved pseudonymization/redaction transformations represented as governed lifecycle operations; evidence integrity and legal basis are documented. Audit does not follow source-service erasure blindly.

## Backup/restore
Backups include records, chain heads/partitions, policies, holds, integrity/export metadata and outbox. Restore must validate chain continuity, sequence uniqueness and archive references before readiness.

## Tests
Tests cover append immutability, chain tamper detection, concurrent append ordering, retention/hold precedence, release then deletion eligibility, archive verification before purge, export expiry, restore integrity, duplicate source event and privacy-policy edge cases.