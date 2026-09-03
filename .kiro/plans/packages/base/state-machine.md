---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/state-machine"
anchor_adrs: [ADR-0090, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/errors", "@stackra/support"]
---
# `@stackra/state-machine` — implementation plan

## Purpose
Generic typed lifecycle-state engine for domain services. It defines legal states/transitions, guards, transition context and pure evaluation. Persistence, business side effects and domain states remain owned by the service using the package.

## Public API
```ts
interface StateMachine<S extends string,E extends string,C> {
  current(): S;
  can(event:E,ctx:C):boolean;
  transition(event:E,ctx:C):TransitionResult<S>;
  transitions(from?:S):readonly TransitionDefinition<S,E,C>[];
}
interface TransitionDefinition<S,E,C> {
  from:S|readonly S[]; event:E; to:S;
  guard?(ctx:C):boolean;
  validate?(ctx:C):void;
}
interface TransitionResult<S> { from:S; to:S; event:string; changed:boolean; }
```

## Source tree
```text
packages/state-machine/
├── src/core/{state-machine.ts,transition.ts,definition.ts,context.ts,result.ts,errors/,index.ts}
├── src/persistence/{adapter.ts,version-check.ts,index.ts}
├── src/testing/{machine-fixture,transition-matrix,assertions,index.ts}
└── __tests__/{unit,property,integration}/
```

## Semantics
Transition definitions are immutable after machine construction. Guards are deterministic and side-effect free. Invalid transitions return/throw a stable `InvalidTransitionError`. A no-op transition is explicit and cannot accidentally update version state.

## Persistence integration
The package exposes a version/CAS adapter; it does not issue SQL. A service persists current state/version transactionally with its aggregate. Where transition history is needed, the service owns the history table and stores event/context metadata. The package cannot silently persist business state.

## Concurrency
Optimistic version checking is the default. A service may use pessimistic locking outside the package for high-contention transitions. Concurrent transitions against an old version return `ConcurrentTransitionError`. Retried commands must carry a stable idempotency key.

## Effects
Post-transition effects are returned as typed effect descriptors or executed by the owning application service after persistence commit. The state machine itself never performs network/database side effects, preventing partial state/effect inconsistency.

## Serialization
State/event definitions may be serialized as JSON-safe metadata for diagnostics and compatibility. Dynamic executable guards are never serialized or loaded from untrusted data.

## Security/tenancy
The package has no authorization or tenant knowledge by default. Service context can carry tenant/principal metadata for guard decisions. Authorization must happen before invoking a transition unless the service contract explicitly makes it part of a pure guard.

## Errors
`StateMachineDefinitionError`, `InvalidTransitionError`, `TransitionGuardError`, `ConcurrentTransitionError`, `TerminalStateError`, `TransitionSerializationError`. Errors carry state/event/version metadata but not secret payloads.

## Testing
Transition-matrix tests for every state/event pair; invalid transitions; terminal states; guard behavior; optimistic concurrency; idempotency; serialization; property tests over random event sequences; integration with real repository/transaction boundaries.

## Implementation phases
1. Core definition/machine/result types.
2. Guard validation and errors.
3. persistence version/CAS adapter.
4. testing matrix/property utilities.
5. service integration/conformance and performance verification.

## Exit criteria
- Services define lifecycle invariants once with no duplicate state engines.
- Every mutable aggregate documents states/transitions and concurrency semantics.
- No side effects execute inside pure transition evaluation.
- Concurrent stale transitions fail deterministically and safely.
