---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/navigation"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/router", "@stackra/link", "@stackra/storage", "@stackra/contracts"]
---
# `@stackra/navigation` — implementation plan

## Purpose
Cross-platform navigation state/composition. Router owns URL/route semantics; Navigation owns stack, tab, modal, history composition, state persistence/restoration and navigation UX events.

## Public API
```ts
interface NavigationContainer {
  state():NavigationState;
  dispatch(action:NavigationAction):void;
  navigate(target:RouteTarget,options?:NavigateOptions):Promise<void>;
  goBack():Promise<void>;
  reset(state:NavigationState):Promise<void>;
  subscribe(handler:(state:NavigationState)=>void):()=>void;
}
type NavigationAction = Push|Pop|Replace|Reset|PresentModal|DismissModal|SelectTab;
```

## Source tree
```text
packages/navigation/
├── src/core/{container,state,actions,stack,tabs,modal,history,restore,errors,index.ts}
├── src/adapters/{browser,native,desktop}/
├── src/persistence/{serializer,storage,index.ts}
├── src/testing/{navigation-fixture,action-trace,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## State model
Navigation state is serializable, versioned and immutable from consumers. Each route entry has stable key, route ID, params/query encoded through Router codecs and restoration metadata. Modal/tab/stack relationships are explicit; arbitrary object graphs are forbidden.

## Transition semantics
Actions are reduced deterministically. Invalid pop/dismiss/select operations produce typed navigation errors. Concurrent navigation requests are serialized/versioned; stale requests cannot overwrite newer committed state.

## Router composition
Navigation delegates route matching/target normalization to `@stackra/router` and safe external link handling to `@stackra/link`. It does not duplicate route pattern matching.

## Persistence/restore
Optional state persistence uses `@stackra/storage` with a versioned snapshot and migration chain. Sensitive route state is excluded by explicit field classification. Restore validates schema before replacing live state; malformed snapshots are discarded with diagnostics rather than crashing startup.

## Runtime adapters
Browser integrates History API; native integrates platform navigation containers; desktop integrates window/deep-link lifecycle. Adapters map platform lifecycle events into core actions and report unsupported capabilities explicitly.

## Security/privacy
Route params may contain identifiers but must follow Router codecs and access policy. Tokens/secrets must never be persisted as navigation state. Client navigation is not an authorization boundary.

## Observability
Navigation action count, transition latency, restoration failures and redirect/cancel outcomes are measured. Telemetry records route IDs, not sensitive parameter values.

## Testing
Reducer transition matrix; stack/tab/modal interactions; nested containers; concurrency/stale actions; restore/migration; malformed snapshots; browser history/back/forward; native/desktop adapters; deep-link routing composition.

## Implementation phases
1. Immutable state/actions/reducer.
2. stack/tab/modal container.
3. Router/link composition.
4. persistence/restore.
5. platform adapters and testing/observability.

## Exit criteria
- Navigation state is deterministic and versioned.
- Restore is schema-validated and migration-safe.
- Platform adapters do not leak business logic.
- No route-matching logic is duplicated from Router.
