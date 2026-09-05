---
status: canonical
document: service-resilience
service: audit
version: v1
---
# Audit Service — Resilience and Failure Contract

Audit prioritizes evidence integrity over availability. It never acknowledges accepted evidence before durable commit and never marks export/integrity/archive work successful without verification.

| Failure | Required behavior |
|---|---|
| PostgreSQL unavailable | consumer/API readiness false; NATS retains inbound durable messages; no false append acknowledgement |
| NATS unavailable | consumer role degraded; API/admin operations continue where independent; Audit-owned outbox accumulates |
| Object storage unavailable | export/archive jobs retry/fail explicitly; ingestion/query continue if independent |
| IAM unavailable | protected reads/exports/admin fail closed |
| Redis unavailable | bypass eligible cache; if distributed lock invariant cannot be preserved, defer/reject relevant maintenance job |
| Registry/OTel unavailable | continue with retry/degraded telemetry |

## Append safety
Audit append transaction locks/coordinates the chain partition head, validates expected sequence/previous hash, inserts record and advances head atomically. Concurrent append conflicts retry boundedly. Duplicate source event ID returns existing record identity without adding a second chain element.

## Retry/backoff
Consumer ingestion, export, integrity, archive and delete jobs use bounded exponential backoff+jitter with stable job IDs. Non-idempotent artifact publication uses deterministic object keys/temp-to-final promotion/checksum to avoid duplicate completed artifacts.

## Backpressure
Per-partition append queues/concurrency, inbound consumer max pending, query/export limits, integrity/archive batch sizes and object-storage concurrency are bounded. Saturation leaves work durable in JetStream/job state instead of unbounded memory.

## Recovery
Chain-head rebuild verifies records from last trusted checkpoint; archive restore verifies manifests/checksums/hash continuity; unfinished exports are resumed or marked failed deterministically; retention deletion rechecks holds/policy; DLQ/quarantine replay requires authorization/reason/audit-of-audit.

## Disaster behavior
After DB restore, Audit remains non-ready until chain heads, duplicate-source indexes, legal holds, outbox and archive references pass integrity verification. A corrupted partition is isolated and alerted; records are never silently rehashed to hide corruption.

## Chaos tests
Kill DB during append, crash consumer after commit before ack, duplicate/out-of-order source events, object-store partial write, concurrent legal-hold/delete, NATS redelivery storm, hash mismatch, restore from backup, Registry/IAM outages and forced shutdown during chain append/export/archive.