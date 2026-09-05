# Infrastructure Orchestrator — IaC and Terraform Contract

## Authority

Terraform configuration/state is the declarative infrastructure source of truth. Git/IaC repositories hold reviewed configuration. The Orchestrator holds execution metadata and status, not a competing desired-state database.

## Pipeline

Commit/artifact → format/validate → security/policy scan → dependency/provider lock verification → `terraform plan` in isolated runner → plan artifact digest → policy evaluation → authorization → apply approved exact plan → provider state observation → reconcile.

## State

Remote state is isolated per environment/workspace/account. State locking is mandatory. State access is never exposed through the public API. Sensitive state remains in the IaC backend with least-privilege access.

## Execution

Terraform runner uses pinned Terraform version, provider lock file, immutable artifact, isolated network/workspace and environment-specific credentials. The Orchestrator records command intent and artifact/plan digest, not secrets. Logs redact plan-sensitive values.

## Destructive changes

Destroy/replacement operations are detected from the plan and require explicit policy permission and production controls. An apply must correspond to an authorized plan digest; changed plans require a new authorization.

## Drift

Scheduled/manual refresh compares actual state with expected IaC state. Drift creates a durable reconciliation record. Remediation applies only through reviewed IaC, never by ad-hoc cloud mutation.