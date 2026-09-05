# Identity Service — Jobs & Scheduling

## Runtime roles
`api` serves synchronous auth APIs. `consumer` processes provider/lifecycle events. `worker` performs bounded background work. `scheduler` only creates durable job executions; business logic remains in workers.

## Jobs
- `ProcessProviderEvent`: verify, deduplicate, normalize, apply lifecycle mutation, emit outbox. Retry 5 times with exponential backoff; permanent failures to DLQ.
- `ReconcileProviderIdentities`: compare authoritative provider state with local bindings in bounded pages; idempotent; checkpointed; no destructive action without verified provider state.
- `ExpireSessions`: revoke locally expired sessions in batches; safe to rerun.
- `ExpireDelegations`: close elapsed delegations and emit revocation evidence.
- `RotateServiceCredential`: execute only from an authorized rotation request; never log secret material.
- `ReplayProtectionCleanup`: compact expired replay/security markers according to retention.

## Scheduling
Provider reconciliation runs hourly; session/delegation expiry runs every five minutes; cleanup runs daily. Scheduler occurrence IDs are deterministic by job name and time bucket so duplicate scheduler execution creates one durable execution.

## Reliability
Every job has timeout, attempt count, backoff, idempotency key, checkpoint and DLQ behavior. External provider mutations are not automatically retried unless the provider operation is explicitly idempotent. Worker concurrency is bounded per provider and per tenant.

## Recovery
Operators can retry a DLQ item after correcting the dependency. Reconciliation can resume from its checkpoint. A failed job never marks business state successful before its transaction commits.

## Security
Jobs execute with service identity, least privilege, tenant context where applicable, and current authorization policy. Scheduler input cannot directly execute arbitrary job names or payloads.

## Observability
Metrics include executions, success/failure, duration, retries, DLQ depth, provider latency and checkpoint age. Each execution has an OTel span and correlation ID; credentials are excluded.