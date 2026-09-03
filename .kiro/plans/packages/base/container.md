---
status: canonical
component: package
package: "@stackra/container"
---
# `@stackra/container` — implementation plan

Runtime-neutral dependency-injection container with singleton, request and transient scopes; explicit tokens; child/request contexts; lifecycle hooks; deterministic resolution and cycle diagnostics.

## Layout
`src/contracts`, `src/core`, `src/scopes`, `src/lifecycle`, `src/errors`, `src/testing`, `src/index.ts`.

## Public API
`Container`, `ContainerBuilder`, `Token`, `Scope`, `ResolutionContext`, `Provider`, `FactoryProvider`, `ValueProvider`, `ClassProvider`, lifecycle interfaces and typed container errors.

## Rules
No framework globals. Request context is explicit. Worker/runtime adapters bind platform resources; core remains Node/browser/worker neutral. Providers cannot silently mutate singleton state.

## Testing/security
Resolution graphs, scope isolation, disposal, concurrency, cycles, missing providers and child-container behavior. Never expose secrets through diagnostics.

## Exit criteria
All platform packages use one DI vocabulary and runtime-specific adapters are thin, explicit and tested.
