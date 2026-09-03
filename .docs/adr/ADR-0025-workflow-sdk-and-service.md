# ADR-0025 — Workflow SDK + Durable Workflow Service

## Status

Accepted

## Decision

Figentra uses a hybrid workflow architecture:

- `@stackra/workflow` is the reusable workflow definition/execution-client SDK boundary.
- The Workflow service is the durable orchestration control plane and owns execution state.
- Business services own the business meaning and define workflows using the SDK; they do not implement independent workflow engines.
- Workflow executes cross-service actions only through versioned `@stackra/contracts` and approved service APIs/events.
- Approval is a Workflow human-task primitive, not a separate service.

## Responsibilities

### SDK

Owns workflow DSL/types, typed inputs/outputs, step definitions, retry/timeout/compensation declarations, signals, timers, execution client and context propagation.

### Workflow service

Owns workflow definitions/versions, execution state, step state, leases, scheduling, retries, timers, signals, compensation, cancellation, replay/recovery and execution history.

### Business services

Own domain state and business operations. They expose commands/events that workflows invoke. They never delegate ownership of their domain state to Workflow.

## Runtime

Workflow API handles management and execution queries. Worker/scheduler roles perform durable execution from the same NestJS source tree. NATS JetStream is the durable transport; PostgreSQL stores workflow state.

## Consequences

This avoids both a duplicated workflow engine per service and a central workflow service becoming a distributed business monolith. Workflows are reusable definitions while execution remains centrally durable and observable.
