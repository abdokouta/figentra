---
status: canonical
component: package
package: "@stackra/container"
owner: platform
---
# `@stackra/container` — implementation-complete plan

## Purpose
Runtime-neutral dependency injection with deterministic provider resolution, explicit scopes and lifecycle ownership. It is the foundation for services and packages; NestJS integration adapts to it rather than redefining the vocabulary.

## Non-goals
No framework globals, service locator singleton, implicit environment lookup, domain registry, network client or provider SDK.

## Source layout
```text
src/contracts/ token, provider, scope, lifecycle interfaces
src/core/ Container, ContainerBuilder, resolver
src/scopes/ singleton, request, transient, child context
src/lifecycle/ init, ready, dispose
src/errors/ resolution/cycle/scope errors
src/testing/ test container, overrides, spies
src/index.ts
```

## Public API
```ts
class Container {
  register<T>(provider: Provider<T>): void;
  resolve<T>(token: Token<T>, context?: ResolutionContext): T;
  resolveAsync<T>(token: Token<T>, context?: ResolutionContext): Promise<T>;
  createScope(kind: Scope, parent?: Container): Container;
  dispose(): Promise<void>;
}
interface Provider<T> { token:Token<T>; scope:Scope; factory:(ctx:ResolutionContext)=>T|Promise<T>; dependencies?:readonly Token<unknown>[] }
```
Provider variants are `ValueProvider`, `ClassProvider` and `FactoryProvider`. Tokens are symbols/typed objects, never strings that can collide.

## Resolution rules
Registration is finalized before application bootstrap. Duplicate registrations fail unless explicitly marked override in a test container. Dependency graphs are resolved deterministically; cycles report the complete token path. Singleton providers cannot depend on request-scoped providers. Disposal occurs in reverse dependency order.

## Scope semantics
`singleton` lives for application lifetime; `request` is created from the inbound RequestContext and disposed after the request/message; `transient` is created per resolution. Worker adapters may bind request scope to one invocation. No mutable tenant identity is stored on a singleton.

## Runtime integration
NestJS receives adapters for modules/providers; Node workers use the same core container; browser/RN/desktop may create application and screen scopes. Platform resources such as fetch, timers and crypto are injected through runtime adapters.

## Lifecycle
Providers may implement `onInit`, `onReady`, `onDispose`. Startup failures are fail-fast. Disposal has a deadline and records failures without leaking resources. Repeated disposal is idempotent.

## Security
Diagnostics expose token names only; secret values are never serialized. Provider factories validate credentials through configuration/secrets boundaries. Untrusted input never selects a token directly.

## Concurrency/performance
Resolution must be safe for concurrent request scopes. Singleton construction is single-flight. Dependency graph metadata is precomputed at bootstrap. Hot-path request resolution avoids global locks.

## Testing
Test missing providers, duplicate registration, cycle diagnostics, scope isolation, singleton single-flight, disposal ordering, async factories, request concurrency and NestJS/runtime conformance. A package cannot ship without a complete provider graph test for its production module.

## Completion criteria
Every reusable package declares tokens, provider ownership, scope, lifecycle and runtime adapter. There are no hidden globals, `any`-typed resolution paths, fake providers or production-only branches without conformance tests.