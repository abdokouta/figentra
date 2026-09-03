---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/navigation` — cross-runtime navigation contract

**Status:** Planned  
**Anchor ADRs:** ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/link`, `@stackra/router`, `@stackra/errors`  
**Design effort:** 12 days across 7 phases

## Purpose

One navigation API for web, React Native and desktop: navigate, replace, back, reset, deep-link handling and typed route payloads. Router owns matching; link owns URL generation.

## Non-goals

- Route definitions/matching.
- Platform-specific navigation library internals.

## Manager pattern

`NavigationManager` delegates to an injected `INavigationAdapter`; no platform global is accessed by core.

## Subpath layout

```text
packages/navigation/src/core/{navigation.module.ts,manager/,actions/,deep-links/,guards/,errors/,index.ts}
packages/navigation/src/react/{adapter.tsx,hooks/,index.ts}
packages/navigation/src/native/{adapter.ts,navigation-container.ts,hooks/,index.ts}
packages/navigation/src/desktop/{adapter.ts,deep-links/,index.ts}
packages/navigation/src/testing/{navigation-harness.ts,index.ts}
```

## Contracts split

`@stackra/contracts/navigation` owns `INavigation`, `INavigationAdapter`, `INavigationTarget`, deep-link and history contracts and `NAVIGATION` token.

## Public API — locked

```ts
interface INavigation { navigate<T>(target: T, options?: INavigationOptions): Promise<void>; replace<T>(target:T):Promise<void>; back():void; reset<T>(target:T):Promise<void>; handleLink(url:string):Promise<boolean>; }
```

Navigation targets are typed and serialized before crossing a runtime boundary. Back/replace/reset semantics are explicit and deterministic.

## Security / errors / observability

Only registered routes may be opened. External URLs require an allowlist. Deep links are normalized and protected against path injection. Navigation failures use canonical errors and emit route-level metrics without recording sensitive payloads.

## Runtime / persistence

Adapters own browser history, RN navigation containers and desktop deep-link integration. State persistence is optional and versioned by adapter; core never persists platform objects.

## Testing

Test action ordering, back-stack behavior, typed payload serialization, malformed links, external URL rejection and lifecycle unmount/remount. Adapter contract tests are mandatory.

## Phases

1. Contracts/scaffold (2d); 2. manager/actions (2d); 3. deep links/security (2d); 4. React/RN/desktop adapters (3d); 5. errors/observability (1d); 6. conformance (1d); 7. docs/release (1d).

## Exit criteria

All supported runtimes implement the same navigation contract; unsafe links are rejected; router and link responsibilities remain separate.

## Cross-references

`2026-09-03-router-package.md`, `2026-09-03-link-package.md`, ADR-0091.
