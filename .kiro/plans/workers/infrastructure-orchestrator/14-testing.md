# Infrastructure Orchestrator — Testing Contract

## Unit
Operation state transitions, authorization policy, target allowlist, environment rules, idempotency, lock behavior, retry classifier, provider normalization, plan digest verification and reconciliation algorithms.

## Integration
D1/persistence, queue acknowledgement/retry/DLQ, provider adapters, Terraform runner sandbox, secret bindings and Registry publication.

## Contract
API schemas, provider adapter contracts, Terraform runner contract, Registry deployment metadata contract, IAM decision contract and error compatibility.

## Security
Cross-tenant/environment mutation, forged service identity, privilege escalation, plan substitution, arbitrary command injection, arbitrary provider URL/SSRF, secret leakage, replay and unauthorized destroy.

## E2E
Plan → authorize → execute → reconcile → Registry publication; failed provider; timeout; duplicate request; Worker restart; cancellation; rollback; drift detection and recovery.

## Load/resilience
Concurrent operations, queue burst, provider throttling, runner saturation, D1 outage, queue outage, Registry outage and restart. Verify p95/p99, bounded retries, no duplicate unsafe mutation and eventual recovery.

## IaC acceptance
Run real Terraform validation/plan/apply in isolated non-production sandboxes with pinned versions and locked providers. Production tests use controlled canary resources and never unrestricted destructive fixtures.