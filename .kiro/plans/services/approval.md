---
status: canonical
component: service
name: approval
---
# Approval Service — implementation plan

## Purpose
Own approval requests, multi-step approvals, delegation, escalation and terminal decisions. Authorization remains IAM/Policy; this service records and executes approval workflows.

## Modules
`src/modules/approval-request`, `src/modules/approval-step`, `src/modules/delegation`, `src/modules/escalation`, `src/modules/decision`, `src/modules/persistence`, `src/modules/http`, `src/modules/messaging`.

## Contracts
All external DTOs, commands, events and errors are versioned in `@stackra/contracts`. Internal ports remain service-local.

## Runtime roles
NestJS `api` for CRUD/decision APIs; `consumer` for approval-triggering events; `worker` for escalation/timeouts; `scheduler` for due approvals. Same source tree and domain modules.

## Persistence
Dedicated service database/schema. Transactional state changes use optimistic versioning and the platform outbox. Migrations are forward-only and tested against a clean and upgraded database.

## Reliability
Idempotency keys on commands; unique decision constraints; bounded retries with exponential backoff; poison messages to DLQ; reconciliation for overdue/inconsistent requests; graceful shutdown drains active work.

## Security / tenancy
Every command carries authenticated principal, actor and tenant/scope context. Cross-tenant access is denied by default. Sensitive approval payloads are allowlisted and redacted from logs/traces.

## Observability
Structured logs, OpenTelemetry traces/metrics, correlation/request/trace propagation, queue lag and approval latency metrics, readiness/liveness and alerts for stuck approvals/DLQ growth.

## Testing
Unit/domain, repository integration, contract, API e2e, consumer/worker retry, concurrency/race, tenant isolation, migration and failure-mode tests.

## Deployment
Immutable Docker image; independent API/worker/scheduler scaling; health-gated rollout; migration gate; rollback-safe schema changes; Terraform-managed runtime and operational resources.

## Exit criteria
All modules, contracts, migrations, role bootstraps, security controls, failure paths, tests and deployment assets are implemented with no architectural placeholders.
