# Infrastructure Orchestrator — Execution and State

## Operation state machine

`accepted → authorized → queued → running → awaiting-provider → reconciling → succeeded` with terminal `failed`, `cancelled`, or `rejected`. Invalid transitions are rejected. Every transition records timestamp, actor/service identity, attempt, reason and correlation ID.

## Durable record

Operation ID, idempotency key, tenant/application/environment, resource/action, artifact digest, plan digest, provider/resource identifiers, requested/observed state summary, policy decision, attempt count, timestamps, error code and terminal result. Secrets are excluded.

## Concurrency

One conflicting mutating operation per protected resource/environment is allowed through durable locking. Locks have leases and recovery semantics. Duplicate requests map to the original operation.

## Cancellation

Cancellation is cooperative and policy-controlled. If provider execution cannot safely cancel, state remains running/awaiting-provider until reconciliation determines actual state; no false success/cancellation is reported.

## State authority

Execution records describe orchestration history. Terraform/provider state remains infrastructure authority. Reconciliation updates status based on observed truth.