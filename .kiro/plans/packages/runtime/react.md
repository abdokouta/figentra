---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/react"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/container", "@stackra/events", "@stackra/observability", "react"]
---
# `@stackra/react` — implementation plan

## Purpose
React integration layer for platform packages and application UI. It owns providers, hooks, lifecycle-safe subscriptions, async resource helpers, disposal helpers and error boundaries. It never owns business state or domain logic.

## Public API
```ts
function RuntimeProvider(props:{container:Container; children:ReactNode}):ReactElement;
function ContainerProvider(props:{container:Container; children:ReactNode}):ReactElement;
function RequestContextProvider(props:{context:RequestContext; children:ReactNode}):ReactElement;
function useInject<T>(token:Token<T>):T;
function useRequestContext():RequestContext;
function useEvent<T>(event:string,handler:(payload:T)=>void|Promise<void>,deps?:unknown[]):void;
function useAsyncResource<T>(loader:()=>Promise<T>,options?:AsyncResourceOptions):AsyncResource<T>;
function useDisposable<T extends Disposable>(factory:()=>T,deps:readonly unknown[]):T;
```

## Source tree
```text
packages/react/
├── src/core/{providers,contexts,hooks,lifecycle,errors,index.ts}
├── src/events/{use-event.ts,event-provider.ts,index.ts}
├── src/async/{use-async-resource.ts,use-cancellable.ts,index.ts}
├── src/errors/{error-boundary.ts,index.ts}
├── src/testing/{render-fixture,hook-fixture,mock-container,index.ts}
└── __tests__/{unit,integration,strict-mode,conformance}/
```

## Provider semantics
Providers are explicit composition boundaries. `ContainerProvider` exposes the application DI container; request context is immutable and may be nested only when a child request is intentionally created. Providers must not keep mutable tenant/principal state globally.

## Hook lifecycle
All subscriptions/timers/listeners are registered through React effects and disposed in cleanup. Strict Mode double mount/unmount must not duplicate subscriptions. `useEvent` delegates to `@stackra/events`; cross-tab relay remains the coordinator concern.

## Async resources
`useAsyncResource` supports abort signals, stale-result suppression and explicit loading/success/error/cancel state. A newer invocation invalidates the previous invocation's completion. No hook retries network calls implicitly.

## Error boundaries
`ErrorBoundary` catches render/lifecycle errors and renders a typed fallback. It does not swallow errors from event handlers or asynchronous tasks; those use explicit error channels. Error details sent to UI are safe serialized errors.

## Runtime composition
React DOM uses `@stackra/browser`; React Native uses `@stackra/react-native`. Shared hooks depend on neutral contracts wherever possible. Browser/native differences stay in runtime adapters, not business hooks.

## Security
Do not expose secrets through context values, component props used for persistence, devtools state or serialized hydration payloads. Auth state comes from Identity integration; authorization is service/IAM behavior. Error boundaries never render raw provider/database errors.

## Performance
Use stable context values and memoization where justified. Avoid unnecessary global subscriptions. Async resources have cancellation and bounded result retention. Large lists use pagination/virtualization owned by UI/data layers.

## Testing
Tests cover Strict Mode double mount, provider ordering, context isolation, subscription cleanup, async cancellation/stale result suppression, error boundary fallback, unmount during network work and browser/native runtime composition. Hooks use deterministic test doubles; no hidden real network.

## Accessibility/runtime concerns
The core package does not own UI styling or navigation. Error fallback contracts expose accessible status semantics. Browser lifecycle cancellation is delegated to runtime adapters.

## Implementation phases
1. Provider/context core.
2. DI/request/event hooks.
3. Async resource/cancellation helpers.
4. Error boundary/testing fixtures.
5. Browser/RN conformance and performance verification.

## Exit criteria
- Strict Mode does not duplicate effects/subscriptions.
- Every hook has deterministic cleanup/cancellation semantics.
- No business logic or mutable tenant state is hidden in React providers.
- Browser/native behavior remains adapter-level.
