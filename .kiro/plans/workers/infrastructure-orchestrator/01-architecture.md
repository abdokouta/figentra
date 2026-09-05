# Infrastructure Orchestrator — Architecture

## Decision

Independent Cloudflare Worker + Hono control plane. It coordinates approved infrastructure operations but does not replace Terraform, Kubernetes controllers, cloud provider control planes or business Workflow.

## Ownership

Owns deployment requests, execution intents, provider/resource/action allowlists, environment policy, operation state, asynchronous dispatch, approval gates where required by infrastructure policy, reconciliation, drift status, deployment metadata and operational audit hooks.

Terraform/IaC owns declarative infrastructure desired state and resource definitions. Cloud providers own actual infrastructure state. The Orchestrator never becomes a second source of truth for infrastructure definitions.

## Supported model

Git/IaC artifact → validated plan → authorized execution intent → durable execution → Terraform/provider adapter → observed state → reconciliation → Registry deployment metadata → Audit evidence.

## Runtime

Cloudflare Worker + Hono for control API. Durable state is external to process memory. Async execution uses durable queues. Provider credentials are never exposed to callers.

## Boundaries

No arbitrary shell commands, arbitrary Terraform text, arbitrary provider endpoints, user-supplied credentials, unrestricted cloud API, business workflows or business data. Every resource/action is allowlisted and environment-scoped.

## Environments

Development, staging and production have separate accounts/projects, state backends, credentials, Worker bindings and policy. Production operations require stronger IAM permissions and immutable artifact/IaC identity.

## Control flow

Request → authenticate → authorize → validate target/environment/action → idempotency → create operation → enqueue → execute approved artifact/provider action → persist result → reconcile → publish deployment metadata → audit.

## Safety

Plan/apply separation, immutable artifact digest, state-locking, concurrency control, explicit destructive-operation policy, bounded execution, approval policy for privileged actions and automatic prevention of cross-environment targeting.

## Availability

API remains stateless. Operations survive Worker restart. Queue delivery and durable operation state provide recovery. A provider outage does not cause duplicate unsafe mutation; reconciliation determines actual state before another attempt.

## Acceptance

No arbitrary infrastructure execution, complete operation lifecycle, Terraform/IaC authority preserved, least privilege, durable state, safe retries, drift reconciliation, production environment isolation and full audit/observability.