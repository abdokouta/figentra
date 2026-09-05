# Infrastructure Orchestrator — API Contract

## Operations

`POST /v1/operations`; `GET /v1/operations/:id`; `POST /v1/operations/:id/cancel`; `POST /v1/operations/:id/retry` (only when policy permits); `GET /v1/operations`.

## Deployments

`POST /v1/deployments`; `GET /v1/deployments/:id`; `POST /v1/deployments/:id/promote`; `POST /v1/deployments/:id/rollback`; `GET /v1/deployments`.

## IaC

`POST /v1/iac/plans`; `GET /v1/iac/plans/:id`; `POST /v1/iac/executions`; `GET /v1/iac/executions/:id`; `POST /v1/reconcile`.

Every mutation requires authentication, IAM permission, explicit environment/target, artifact digest or approved IaC reference, idempotency key and request context. Destructive operations require the configured privileged permission/approval policy. API never accepts arbitrary Terraform source or shell commands.

Stable errors: `INVALID_REQUEST`, `UNAUTHENTICATED`, `FORBIDDEN`, `TARGET_NOT_ALLOWED`, `ENVIRONMENT_POLICY_VIOLATION`, `IDEMPOTENCY_CONFLICT`, `PLAN_REQUIRED`, `LOCKED`, `EXECUTION_RUNNING`, `PROVIDER_FAILURE`, `DRIFT_DETECTED`, `TIMEOUT`, `CANCELLED`, `INTERNAL_ERROR`.