---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/state-machine` — explicit domain state and transition engine

**Status:** Planned  
**Anchor ADRs:** ADR-0091, ADR-0090, ADR-0012  
**Reference:** Laravel Model States concepts adapted to TypeScript  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/events`, `@stackra/orm`  
**Design effort:** 12 days across 7 phases

## Purpose

Provide an explicit, typed state graph with legal transitions, guards, actions, entry/exit hooks, durable history and idempotent transition execution. State-machine state is domain state; it is distinct from UI state and server query/cache state.

## Non-goals

- Workflow orchestration, timers or human approvals (`@stackra/workflow`).
- Database connection management.
- UI state management.

## Manager pattern

No driver Manager. `StateMachineFactory` constructs immutable definitions; `StateRegistry` indexes definitions.

## Subpath layout

```text
packages/state-machine/
├── src/core/
│   ├── definitions/              # StateDefinition, TransitionDefinition
│   ├── engine/                   # StateMachine, TransitionExecutor
│   ├── guards/                   # composable guards/policies
│   ├── actions/                  # entry/exit/transition actions
│   ├── history/                  # StateHistory + repository contract
│   ├── registries/
│   ├── decorators/
│   ├── errors/
│   └── index.ts
├── src/nestjs/
├── src/worker/
├── src/testing/
└── __tests__/
```

## Contracts split

`@stackra/contracts/state-machine` owns `IState`, `IStateMachine`, `ITransition`, `IStateContext`, `IStateHistory`, guard/action contracts and `STATE_MACHINE` tokens.

## Public API — locked

```ts
interface IStateMachine<TState extends string> {
  state(): TState;
  can(transition: string, context?: IStateContext): Promise<boolean>;
  transition(name: string, context?: IStateContext): Promise<ITransitionResult<TState>>;
  history(): Promise<readonly IStateHistory[]>;
}
```

Transitions are graph-defined and fail closed. A transition may not mutate state before guards pass. Actions run in deterministic order: guard → exit → mutation/version increment → entry → event publication. Idempotency keys prevent duplicate execution.

## Discovery / registry

`@StateMachine(name)` discovers definitions; `StateRegistry` validates unique names and graph reachability. Invalid graphs, unreachable terminal states and duplicate transitions fail at bootstrap.

## Configuration / validation

Definitions declare states, initial state, terminal states, transitions, guards and optimistic versioning. Unknown transition names are errors. Configuration cannot weaken a guard at runtime.

## Security / tenancy

Guards receive explicit actor/tenant context. Tenant boundaries are enforced before state mutation. History metadata is redacted and bounded. Privileged transitions require explicit policy checks.

## Errors / recovery

Use stable errors for invalid transition, guard rejection, stale version, already-completed transition and action failure. Action failure rolls state back when the persistence boundary supports transactions; otherwise the state remains unchanged and a recovery event is emitted. Retries require idempotent action contracts.

## Observability

Emit `state.transition.started`, `.completed`, `.rejected`, `.failed` with entity type/id, transition, duration and correlation identifiers. Never emit secrets or full entity snapshots.

## Persistence / compatibility

Current state and monotonic version are persisted through ORM. History is append-only. State names and transition names are versioned vocabulary; renames require explicit migration mapping. Historical records are never rewritten silently.

## Testing / conformance

Test legal/illegal graphs, guards, action order, retries, idempotency, optimistic locking, history integrity, tenant isolation and concurrent transitions. Provide an in-memory persistence fixture and deterministic clock.

## Dependencies / exports / versioning

Core runtime-neutral exports only. Nest/Worker/testing are subpaths. ORM integration is behind an adapter boundary. Public graph/API changes require semver and Changesets.

## Phases

1. Contracts/scaffold (2d).
2. State/transition definitions and registry (2d).
3. Execution engine/guards/actions (2d).
4. Persistence/history/locking (2d).
5. Runtime adapters and events (1d).
6. Conformance/security/concurrency tests (2d).
7. Docs/release (1d).

## Exit criteria

- Illegal transitions are impossible through the public API.
- Concurrent stale updates are rejected deterministically.
- History is append-only and auditable.
- Every transition is idempotent when supplied an idempotency key.

## Cross-references

- `2026-09-03-orm-package.md`
- `2026-09-03-events-package.md`
- `2026-09-03-workflow-package.md`
- ADR-0091.
