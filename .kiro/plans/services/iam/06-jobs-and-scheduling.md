# IAM Service — Jobs & Scheduling

## Jobs
`ExpireGrants` — batch-expire time-bounded grants; deterministic and idempotent.

`RebuildDecisionCache` — rebuild versioned cache entries after controlled invalidation; never creates authorization state absent from PostgreSQL.

`CompactDecisionEvidence` — apply configured retention to decision evidence.

`ReconcileAuthorizationIndexes` — verify derived/index/cache consistency and report discrepancies without changing source-of-truth policy unexpectedly.

## Schedule
Grant expiry every minute in bounded batches; cache reconciliation every five minutes; evidence compaction daily; integrity reconciliation hourly. Scheduler occurrences use deterministic job keys and a distributed lock/lease so duplicate scheduler instances do not double-execute.

## Reliability
Every job has timeout, bounded retries, backoff, idempotency and DLQ where failure cannot be safely retried. Authorization itself is never dependent on a background job having completed; cache failure falls back to authoritative evaluation.

## Security
Jobs run under service identity with least privilege. Tenant batches are isolated and bounded. Job payloads are validated schemas, not executable expressions.

## Operations
Expose execution count, duration, retry count, backlog, oldest item, DLQ depth and last successful occurrence. Operators can replay failed work after remediation; replay is safe to repeat.