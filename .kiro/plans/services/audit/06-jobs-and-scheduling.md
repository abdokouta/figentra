# Audit Service — Jobs & Scheduling

`ProcessAuditEvent` validates/deduplicates incoming durable events and appends records atomically.

`GenerateAuditExport` streams an authorized bounded query into an encrypted export destination, calculates checksum, updates status and emits completion evidence.

`RunIntegrityCheck` verifies hash continuity and sequence ranges; failures stop silent corruption and alert operators.

`ArchiveAuditRecords` moves eligible records to the configured durable archive while preserving hash/evidence.

`DeleteExpiredAuditRecords` deletes only records past retention and not covered by legal hold, with batch checkpoints.

Schedules: continuous event consumption; integrity checks hourly; retention evaluation daily; export execution from queue; archive/delete daily in bounded batches.

All jobs have deterministic IDs, leases, timeout, retry/backoff, checkpoint and DLQ. Deletion is never retried blindly after ambiguous transaction outcome; the job re-reads authoritative state first.

Metrics include ingestion lag, integrity failures, export backlog, archive/delete counts, oldest eligible record and DLQ depth.