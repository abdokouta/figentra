# Infrastructure Orchestrator — Queues, Workers and Schedules

## Durable subjects/queues

`infra.operation.execute.v1`, `infra.operation.reconcile.v1`, `infra.operation.retry.v1`, `infra.operation.dlq.v1`, `infra.drift.reconcile.v1`.

## Consumers

`operation-executor` claims authorized operations; `reconciler` observes provider/IaC state; `retry-dispatcher` schedules only retry-safe work; `dlq-review` retains terminal poison messages for controlled replay.

Each consumer has durable identity, acknowledgement, bounded concurrency, max delivery count, backoff/jitter, timeout, idempotency, lock handling, poison-message policy and metrics. Acknowledgement occurs only after durable state transition.

## Schedules

Drift reconciliation, stale-operation reconciliation, lock expiry cleanup, execution timeout detection, provider credential/adapter health checks and operational consistency checks. Every schedule is timezone-explicit, overlap-protected and idempotent.

## Recovery

Worker crash leaves operation durable and eligible for recovery. Duplicate delivery is safe. DLQ replay requires authorization and preserves original operation identity.