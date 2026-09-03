---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/state` — reactive local application state

**Status:** Planned  
**Anchor ADRs:** ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/storage`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 13 days across 7 phases

## Purpose

Cross-runtime reactive local state with typed stores, selectors, actions, persistence, hydration and subscriptions. It is deliberately separate from server state (`@stackra/query`) and domain state machines.

## Non-goals

- Remote fetching/caching.
- Domain transition graphs.
- Global mutable singleton state.

## Manager pattern

`StateStoreFactory` creates isolated stores; `StateRegistry` is optional and scoped to an application container. Stores can be singleton, request or component scoped explicitly.

## Subpath layout

```text
packages/state/
├── src/core/{state.module.ts,store/,selectors/,actions/,persistence/,hydration/,registry/,errors/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{provider/,hooks/,index.ts}
├── src/worker/{state.module.ts,index.ts}
├── src/testing/{state-harness.ts,fixtures/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/state` owns `IStateStore`, `IStateSelector`, `IStateAction`, persistence/hydration contracts and `STATE_STORE` token.

## Public API — locked

```ts
interface IStateStore<T> {
  get(): T;
  set(next: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
  select<R>(selector: (state: T) => R): R;
  reset(): void;
}
```

Updates are synchronous and ordered; subscribers observe committed state only. Selectors must be pure. Persistence is asynchronous and cannot block the state mutation path.

## Configuration / security

Stores declare serializable state before enabling persistence. Size limits, debounce intervals and storage quotas are enforced. Secrets must use secure storage contracts rather than ordinary persisted state.

## Errors / recovery / observability

Persistence failures do not corrupt in-memory state; they surface a typed persistence error and enter a recoverable status. Metrics cover update rate, subscriber count, persistence latency/failure and hydration duration.

## Runtime / tenancy

React/RN adapters use `useSyncExternalStore`-compatible subscriptions. Worker state is request/execution scoped unless an explicit durable adapter is provided. State stores cannot implicitly cross tenant contexts.

## Testing / conformance

Test selector stability, subscription ordering, reset, hydration, corrupt persisted state, quota errors and concurrent updates. Runtime tests verify React Strict Mode and RN lifecycle behavior.

## Dependencies / exports / versioning

Core is runtime-neutral. Storage is injected. React/native/Worker/testing are subpaths. Public store contracts are semver-governed.

## Phases

1. Contracts/scaffold (2d); 2. store engine (3d); 3. selectors/actions (2d); 4. persistence/hydration (2d); 5. runtime adapters (2d); 6. security/tests/observability (1d); 7. docs/release (1d).

## Exit criteria

State is isolated, reactive and deterministic; persistence cannot corrupt committed memory state; no server/domain state is duplicated into this package.

## Cross-references

`2026-09-03-query-package.md`, `2026-09-03-sync-package.md`, `2026-09-03-storage-package.md`, ADR-0091.
