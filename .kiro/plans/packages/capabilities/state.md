---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# `@stackra/state` — reactive local application state

**Status:** Canonical implementation plan

## Ownership

Owns ephemeral reactive application state, selectors, actions, subscriptions, hydration and optional persistence. It is not remote query state, not a domain state machine and not durable business state.

## Subpaths

```text
@stackra/state
@stackra/state/react
@stackra/state/react-native
@stackra/state/worker
@stackra/state/testing
```

## Source layout

```text
src/core/{store,selectors,actions,registry,persistence,hydration,errors,index.ts}
src/react/{provider,hooks,index.ts}
src/react-native/{provider,hooks,index.ts}
src/worker/{scope,index.ts}
src/testing/{harness,fixtures,assertions,index.ts}
__tests__/{unit,integration,conformance,runtime,security}/
```

## Locked API

```ts
interface IStateStore<T> {
  get(): T;
  set(next: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
  select<R>(selector: (state: T) => R): R;
  reset(): void;
}
```

Updates are synchronous and ordered; selectors are pure; persistence never blocks the mutation path. Store scope is explicit and no hidden process-global current-tenant/user state is allowed.

## Persistence / security

Persistence is opt-in, schema-versioned and quota-bounded. Secrets use secure storage contracts and never ordinary state persistence. Corrupt persisted state is discarded or migrated according to an explicit version policy.

## Runtime / tenancy

React and React Native adapters use external-store subscription semantics. Worker stores are request/execution scoped unless an explicitly durable adapter is injected. Tenant-specific state cannot cross tenant contexts accidentally.

## Errors / observability

Persistence failures preserve committed memory state and surface typed errors/status. Metrics cover update rate, subscribers, persistence latency/failure and hydration duration without exposing state contents.

## Testing / phases / exit

Test ordering, selectors, reset, hydration, quota errors, corrupt state, subscription cleanup and runtime lifecycle semantics. Implementation order: contracts → store engine → selectors/actions → persistence → runtime subpaths → conformance/security/observability → release. Exit requires deterministic state updates and a strict separation from query/domain state.
