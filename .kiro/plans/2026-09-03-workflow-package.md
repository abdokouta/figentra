---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/workflow` — durable workflow orchestration

**Status:** Planned  
**Anchor ADRs:** ADR-0086, ADR-0013, ADR-0024, ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/state-machine`, `@stackra/events`, `@stackra/queue`, `@stackra/orm`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 22 days across 10 phases

## Purpose

Durable, resumable application workflows composed of state transitions, jobs, timers, approvals and compensation. A workflow survives process/isolate restarts and records enough state to resume deterministically.

## Non-goals

- Generic cron scheduler.
- Distributed 2PC.
- UI workflow builder.

## Manager pattern

`WorkflowManager extends MultipleInstanceManager<IWorkflowRuntime>` for named workflow engines/execution stores. Definitions are immutable and versioned.

## Subpath layout

```text
packages/workflow/
├── src/core/{workflow.module.ts,definitions/,runtime/,steps/,timers/,approvals/,compensation/,persistence/,registry/,errors/,index.ts}
├── src/nestjs/{workflow.module.ts,decorators/,health/,index.ts}
├── src/worker/{workflow.module.ts,waituntil/,index.ts}
├── src/react/{hooks/,components/,index.ts}
├── src/testing/{workflow-harness.ts,clock.ts,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/workflow` owns `IWorkflowDefinition`, `IWorkflowExecution`, `IWorkflowStep`, `IWorkflowStore`, timer/approval/compensation contracts and `WORKFLOW_MANAGER`.

## Public API — locked

```ts
interface IWorkflowRuntime {
  start<T>(definition: string, input: T, options?: IWorkflowStartOptions): Promise<IWorkflowExecution>;
  resume(id: string): Promise<IWorkflowExecution>;
  signal(id: string, name: string, payload?: unknown): Promise<void>;
  cancel(id: string, reason?: string): Promise<void>;
}
```

Every step has a deterministic identity. External effects require idempotency keys. Durable state is committed before the execution advances.

## Discovery / lifecycle

Workflow definitions are discovered and version-validated at bootstrap. Runtime execution is stored through ORM/database; queue workers resume pending executions; Worker adapters use explicit execution context and `waitUntil` only for bounded background work.

## Security / tenancy

Workflow inputs and signals are tenant-scoped. Approval steps require actor authorization. Sensitive input is encrypted/minimized in persistence. Cross-tenant signal delivery is rejected.

## Errors / recovery

Transient step failures retry through queue policy. Non-retryable failures transition to a terminal failed state and execute declared compensation. Resume is idempotent. Timers use persisted due-at timestamps, not in-memory timers as the source of truth.

## Observability

Metrics include active executions, step latency/failure, retry counts, stuck executions, compensation and timer lag. Trace IDs follow execution records. Audit events record approvals, cancellations and privileged signals.

## Persistence / compatibility

Definitions are versioned; running executions pin a definition version. State schema migrations are explicit and backward-readable for executions in flight. No silent rewrite of historical execution state.

## Testing / conformance

Deterministic clock, fake queue and disposable DB tests cover crash/resume, duplicate delivery, timer recovery, compensation, approval races and tenant isolation. At least one real queue + DB integration path is mandatory.

## Dependencies / exports / versioning

Core is runtime-neutral. Queue/ORM implementations are injected. Nest/Worker/React are subpaths. Definition schema changes require compatibility review and semver.

## Phases

1. Contracts/scaffold (2d); 2. definition DSL (3d); 3. execution runtime (3d); 4. persistence/resume (3d); 5. queue/timers (3d); 6. state-machine integration (2d); 7. approvals/compensation (2d); 8. Nest/Worker/UI (1d); 9. security/conformance/observability (2d); 10. docs/release (1d).

## Exit criteria

A workflow can crash at every step and resume without duplicate effects; in-flight versions remain readable; timers and approvals survive restart; tenant boundaries are enforced.

## Cross-references

`2026-09-03-state-machine-package.md`, `2026-09-03-queue-package.md`, `2026-09-03-orm-package.md`, ADR-0086/0013/0024.
