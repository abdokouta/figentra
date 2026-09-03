---
status: canonical
component: service
name: workflow
---
# Workflow Service — implementation plan

Own durable workflow definitions, executions, steps, timers, retries, compensation and execution state. Business capabilities remain in their owning services.

## Modules
`definition`, `execution`, `step`, `timer`, `activity`, `retry`, `compensation`, `persistence`, `http`, `messaging`.

## Runtime
NestJS `api` for definition/execution control; `consumer` for workflow commands/events; `worker` for activities/timers; `scheduler` for due timers and recovery.

## Contracts
Versioned workflow commands/events/status contracts in `@stackra/contracts`; activities use explicit service-owned ports and never import another service implementation.

## Reliability
Durable state transitions with optimistic versions, idempotency keys, lease/heartbeat for workers, bounded retries, DLQ for unrecoverable messages, timeout/compensation semantics and recovery/reconciliation after crashes.

## Security / tenancy
Definitions and executions are tenant-scoped; activity authorization is rechecked at execution time; secrets are references only; payload logging is allowlisted.

## Observability/testing/deployment
Trace execution/activities, measure queue lag, step latency, retries and stuck executions. Test crash recovery, duplicate delivery, ordering, compensation, concurrency, isolation and migrations. Docker roles + Terraform, readiness and graceful shutdown.

## Exit criteria
Durable workflow state machine and execution engine are replay/recovery safe, contract-compliant and deployable without architectural redesign.
