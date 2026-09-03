---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/router` — typed application routing

**Status:** Planned  
**Anchor ADRs:** ADR-0091, ADR-0092  
**Depends on:** `@stackra/contracts`, `@stackra/link`, `@stackra/errors`, `@stackra/container`  
**Design effort:** 16 days across 8 phases

## Purpose

Typed route definitions, nested layouts, params/search params, loaders/actions, guards, redirects, 404/403/500 boundaries, lazy modules and route metadata. Routing owns matching/navigation policy; `@stackra/link` owns URL generation.

## Non-goals

- HTTP server routing.
- Deep-link transport adapters.
- Business authorization policy implementation.

## Manager pattern

`RouterRegistry` stores immutable route trees; `Router` executes matching and navigation through an injected history adapter.

## Subpath layout

```text
packages/router/src/core/{router.module.ts,definitions/,matcher/,loaders/,actions/,guards/,errors/,registry/,index.ts}
packages/router/src/react/{provider/,hooks/,components/,index.ts}
packages/router/src/native/{adapter/,hooks/,index.ts}
packages/router/src/testing/{router-harness.ts,index.ts}
```

## Contracts split

`@stackra/contracts/router` owns `IRoute`, `IRouteMatch`, `IRouter`, `IRouteLoader`, `IRouteAction`, navigation result and `ROUTER` token.

## Public API — locked

```ts
interface IRouter { current(): IRouteMatch | null; match(url: string): IRouteMatch | null; navigate(to: string|IRouteTarget, options?: INavigateOptions): Promise<void>; back(): void; }
```

Routes are declared once, validated for duplicate names/pattern ambiguity and versioned when public. Guards run before loaders that require authorization; loaders receive immutable route context and AbortSignal.

## Security / errors / observability

Open redirects, unsafe dynamic route patterns and untrusted redirect targets are rejected. 404/403/500 errors map through `@stackra/errors`. Metrics cover route match failures, loader latency and navigation errors; traces carry route name, never sensitive params.

## Persistence / runtime

No persistence. React uses history/browser APIs; Native integrates with navigation/deep-link adapters; Worker/Nest integration is only for route metadata where needed and never leaks browser globals into core.

## Testing / conformance

Test nested matching, params, ambiguity, redirects, guard ordering, cancellation, lazy loading and malformed URLs. Browser/native adapters have runtime-specific suites.

## Dependencies / exports / versioning

Root is runtime-neutral. React/native/testing are subpaths. History/router vendors are adapter peers. Public route contract changes require semver.

## Phases

1. Contracts/scaffold (2d); 2. route tree/matcher (3d); 3. loaders/actions/guards (3d); 4. React adapter (2d); 5. Native adapter (2d); 6. security/errors/observability (1d); 7. conformance (2d); 8. docs/release (1d).

## Exit criteria

Route matching is deterministic, typed and secure; loader cancellation works; routing remains separate from link generation.

## Cross-references

`2026-09-03-link-package.md`, `2026-09-03-navigation-package.md`, `2026-09-03-errors-package.md`, ADR-0091.
