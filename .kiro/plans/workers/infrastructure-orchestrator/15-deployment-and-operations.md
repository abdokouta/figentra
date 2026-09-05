# Infrastructure Orchestrator — Deployment and Operations

## Worker deployment

Wrangler-managed isolated development/staging/production Workers, bindings, domains and secrets. Deployment itself is performed through reviewed CI/CD IaC; the Orchestrator does not self-authorize its own production deployment.

## IaC deployment

Terraform runs from a controlled CI/runner environment with pinned Terraform/provider versions, committed lock files, remote state, state locking, artifact provenance, plan artifact retention and policy checks. Apply requires exact approved plan digest.

## Rollout

Validate → unit/contract/security → Terraform plan → policy → staging apply → E2E/smoke → production authorization → canary/controlled apply → reconciliation → Registry metadata → SLO verification.

## Rollback

Application/Worker rollback uses immutable release. Infrastructure rollback uses an explicit reviewed Terraform change or known-safe previous configuration; never blindly reverses state after an unknown provider mutation. Provider state is reconciled before remediation.

## Runbooks

Provider outage/throttling; stuck operation; state lock; failed plan; failed apply; unknown mutation; drift; credential rotation; compromised artifact; Registry outage; queue/DLQ recovery; D1 recovery; emergency production freeze.