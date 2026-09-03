---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/router"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/support", "@stackra/link", "@stackra/contracts"]
---
# `@stackra/router` — implementation plan

## Purpose
Typed application route-definition and matching engine. Router owns route semantics, parameter decoding, nested matching, redirects and route lifecycle. `@stackra/link` owns safe external/deep-link representation; `@stackra/navigation` owns stack/tab/modal UX state.

## Public API
```ts
interface RouteDefinition<TParams=unknown,TQuery=unknown> {
  id:string; path:string; children?:readonly RouteDefinition[];
  parseParams(input:Record<string,string>):TParams;
  parseQuery(input:URLSearchParams):TQuery;
  loader?:RouteLoader; guard?:RouteGuard;
}
interface Router {
  match(url:string):RouteMatch|null;
  navigate(to:RouteTarget,options?:NavigateOptions):Promise<NavigationResult>;
  redirect(target:RouteTarget):void;
  subscribe(handler:(state:RouterState)=>void):()=>void;
}
```

## Source tree
```text
packages/router/
├── src/core/{route-definition,matcher,router,params,query,redirects,state,errors,index.ts}
├── src/adapters/{browser,native,desktop,ssr}/
├── src/testing/{router-fixture,match-fixture,navigation-spy,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Matching semantics
Routes are matched deterministically by static specificity, parameter segments and catch-all rules. Duplicate ambiguous patterns fail package validation. Parameter codecs reject malformed/oversized values. Query parsing uses explicit schema codecs and never evaluates arbitrary expressions.

## Guards/auth
Router guards may consume already-established identity/IAM context but do not become an authorization engine. A guard denial is a navigation result; service-side authorization remains authoritative for data/mutations.

## Navigation lifecycle
`idle → navigating → committed | failed | cancelled`. Concurrent navigations use cancellation/version tokens so stale loaders cannot commit after a newer navigation. Redirect loops are detected with a bounded redirect depth.

## Deep links
A deep-link URL first passes through `@stackra/link` normalization/security and then router matching. External links are never routed as internal application routes unless explicitly allowlisted.

## Security
Validate route/query/param lengths and decode safely. Never render path/query content as executable code. Route metadata cannot contain secrets or provider credentials. Authorization decisions are not inferred from client-only guards.

## Observability
Navigation start/commit/failure/cancel, route ID and duration are measurable. Query/param values are excluded from telemetry by default. Errors use canonical error serialization.

## Testing
Nested/parameter/catch-all matching; malformed params; query codecs; redirect loops; navigation cancellation; deep-link handoff; auth-guard composition; SSR/browser/native adapters; strict deterministic route ordering.

## Implementation phases
1. Route definition/codec model.
2. Matcher and navigation state machine.
3. Redirect/guard lifecycle.
4. runtime adapters and link composition.
5. testing/observability/security verification.

## Exit criteria
- Route tree is deterministic and typed.
- Malformed paths/queries fail safely.
- Navigation cancellation prevents stale commits.
- Deep links compose through `@stackra/link`.
- No business service logic or authorization engine is embedded in Router.
