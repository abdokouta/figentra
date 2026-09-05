# Infrastructure Orchestrator — Environments and Topology

## Isolation

`development`, `staging`, and `production` are separate trust boundaries. Each has independent cloud accounts/projects where practical, Terraform state, provider credentials, Worker bindings, Registry environment metadata, domains and network policies.

## Promotion

Artifact and IaC identities move forward; mutable production configuration is not copied from lower environments. A production deployment references an immutable artifact/plan digest and the target production environment explicitly.

## Target validation

The request's tenant/application/environment/target is resolved server-side. Cross-environment targeting is rejected even when the caller supplies a valid ID. Production destructive operations require privileged IAM policy.

## Topology metadata

Registry records application/service deployment metadata; Infrastructure Orchestrator records operation/deployment status; Terraform state remains authoritative for managed infrastructure. No component treats another component's status cache as cloud truth.