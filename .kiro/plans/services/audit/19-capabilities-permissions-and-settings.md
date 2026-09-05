---
status: canonical
document: service-capabilities-permissions-settings
service: audit
version: v1
---
# Audit Service — Capabilities, Permissions and Settings Catalog

## Capabilities
`audit.record.ingest`, `audit.record.query`, `audit.export.manage`, `audit.integrity.verify`, `audit.retention.manage`, `audit.legal-hold.manage`, `audit.archive.manage`, `audit.quarantine.manage`.

## IAM permission keys
- `audit.record.read`
- `audit.export.create`, `audit.export.read`, `audit.export.download`
- `audit.integrity.read`, `audit.integrity.run`
- `audit.retention.read`, `audit.retention.update`
- `audit.legal-hold.read`, `audit.legal-hold.create`, `audit.legal-hold.release`
- `audit.archive.read`, `audit.archive.manage`
- `audit.quarantine.read`, `audit.quarantine.replay`

Service ingestion uses explicit authenticated service identity/capability, not an ordinary tenant user permission. Permission keys are immutable catalog entries.

## Resource types
`audit-record`, `audit-export`, `audit-integrity-check`, `audit-retention-policy`, `audit-legal-hold`, `audit-archive`, `audit-quarantine-item`.

## Settings
Chain: partition strategy, canonicalization/hash versions, checkpoint interval.
Query/export: max range, page size, export rows/bytes, formats, encryption, signed-reference TTL.
Integrity: batch size, cadence, concurrency, verification depth/checkpoint rules.
Retention/archive: policy bounds, archive age/batch, delete batch, recheck interval, legal-hold precedence.
Ingestion: accepted schema size limits, quarantine threshold, consumer concurrency/ack/retry.
Security/operations: rate limits, assurance level, object storage/KMS, idempotency, scheduler locks, notifications/realtime limits, OTel/Registry.

No setting may disable immutability, bypass legal hold, permit unverifiable deletion, accept arbitrary unversioned evidence or expose restricted record data.

## Registry
Registry receives capability/permission/resource catalogs, accepted event schema metadata, chain/archive format versions and settings schema. It never receives record payloads, hold contents, export artifacts or secret values.

## Tests
Catalog uniqueness, route/command permission coverage, source-ingestion capability enforcement, setting safety bounds, hold/retention precedence invariants and Registry projection drift are CI gates.