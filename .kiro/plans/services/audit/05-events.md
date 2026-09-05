# Audit Service — Events Contract

Stream: `FIGENTRA_AUDIT`. Standard envelope with event ID/type/version, aggregate, tenant, actor/effective subject, time, correlation/causation and schema version.

Published: `figentra.audit.recorded.v1`, `figentra.audit.export.created.v1`, `figentra.audit.export.completed.v1`, `figentra.audit.integrity.failed.v1`, `figentra.audit.legal-hold.created.v1`, `figentra.audit.legal-hold.released.v1`.

Ingestion consumes security/governance events from Identity, IAM, Tenant and all participating domain services through their canonical contracts. Audit validates schema, tenant, event identity and deduplicates before append.

Outbox publication is transactional. Consumer delivery is at-least-once; deduplication is mandatory. Poison events enter DLQ and remain visible for operator remediation.

Audit events contain only required evidence and must not expose credentials, tokens or secrets. Replay re-runs validation and cannot mutate existing records. Schema changes use versioned events.