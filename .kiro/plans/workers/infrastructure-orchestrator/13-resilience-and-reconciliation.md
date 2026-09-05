# Infrastructure Orchestrator — Resilience and Reconciliation

Provider timeout/5xx → bounded retry only when operation is known retry-safe. Unknown mutation outcome → do not retry blindly; poll/reconcile provider/IaC state first. Queue duplicate → idempotent operation lookup. Worker crash → durable operation recovery. Lock expiry → reconcile before re-execution. Terraform state lock → report locked and retry under bounded policy.

## Drift reconciliation

Read actual state → normalize → compare with approved IaC/artifact identity → record drift → optionally create an authorized remediation operation referencing reviewed IaC. Never repair drift with undocumented imperative mutation.

## Recovery jobs

Stale execution scanner, pending-operation recovery, provider-status poller, cache/Registry metadata reconciliation and DLQ recovery. Every job is idempotent and observable.

## Disaster recovery

Restore durable operation metadata from backup; verify Terraform state/backend independently; rebuild Registry deployment projections; reconcile all nonterminal operations against actual provider state before resuming mutations.