# @stackra/container — Architecture, Standards, ADRs, Discovery, Runtime, and Testing Refactor Plan

**Status:** Proposed target architecture  
**Package:** `@stackra/container`  
**Scope:** Core DI/IoC, modules, scopes, discovery, React integration, Cloudflare Workers, testing, contracts ownership, NestJS compatibility, runtime adapters  
**Reviewed baseline:** current uploaded `@stackra/container` v3.0.1 source

---

# 1. Executive Decision

`@stackra/container` should become the **canonical Stackra dependency-injection and module runtime**, not a frontend-only helper and not a Cloudflare framework.

Its responsibility is:

> **Build, own, resolve, scope, and introspect the Stackra application dependency graph across runtimes.**

The package should support:

- browser applications
- React applications
- React Native applications
- Cloudflare Workers
- Node/Bun/Deno applications
- serverless and edge runtimes
- application testing
- metadata-driven discovery
- NestJS-compatible DI conventions where compatibility is useful

It should **not** own:

- HTTP routing
- controllers as a required concept
- middleware pipelines
- Cloudflare services themselves
- React rendering
- filesystem publishing
- process/environment helpers
- generic logging
- framework-independent contracts that other packages must share

The target architecture is:

```text
                         @stackra/contracts
                    shared abstractions + tokens
                               │
                               ▼
                       @stackra/container
                  runtime-neutral DI / module core
                               │
              ┌────────────────┼──────────────────┐
              │                │                  │
              ▼                ▼                  ▼
 @stackra/container/react   /worker           /testing
              │                │                  │
              ▼                ▼                  ▼
           React          Cloudflare         test harness
         integration       adapter            + overrides
```

The most important architectural correction is to distinguish:

```text
DI contracts
DI implementation
runtime adapters
framework integrations
testing integrations
```

instead of allowing all five concerns to leak into the core package.

---

# 2. Historical Context and Intent

The container began as a **browser/frontend dependency-injection system inspired by NestJS**.

The original design goal was useful:

```text
NestJS-like developer experience
without requiring NestJS
```

That includes concepts such as:

```ts
@Module(...)
@Injectable(...)
@Inject(...)
@Optional(...)
@Global()

ApplicationFactory.create(...)
ModuleRef
DynamicModule
forwardRef(...)
Scope.DEFAULT
Scope.TRANSIENT
Scope.REQUEST
```

Over time, the package expanded into:

- application bootstrap
- provider lifecycle
- global application access
- React hooks/providers
- discovery
- dynamic modules
- lazy modules
- request scope
- Cloudflare Worker integration
- shared discovery contracts
- testing mocks

The package is therefore no longer accurately described as a frontend container.

The correct long-term definition is:

> `@stackra/container` is the Stackra runtime-neutral application composition engine.

---

# 3. Current Baseline: What Is Good

The uploaded package already contains a strong foundation.

Existing core capabilities include:

```text
ApplicationFactory
ApplicationBuilder
ApplicationContext
RequestApplicationContext
ModuleContainer
Module
ModuleRef
DependenciesScanner
Injector
InstanceLoader
InstanceWrapper

@Module
@Injectable
@Inject
@Optional
@Global

class providers
value providers
factory providers
existing providers
dynamic modules
global modules
forwardRef
property injection
optional injection
multi providers
lifecycle hooks
request scope
transient scope
discovery
lazy module loading
reflection
```

The package also already has public subpaths:

```text
@stackra/container
@stackra/container/react
@stackra/container/native
@stackra/container/testing
@stackra/container/worker
```

This means the work should be a **boundary refactor and architecture hardening**, not a rewrite.

---

# 4. Current Architectural Problems

## 4.1 Core still carries frontend heritage

Although React exports were removed from the root entry, React-oriented source still exists under core:

```text
src/core/hooks/
src/core/providers/container/
```

This weakens the meaning of "core".

Runtime-neutral core should not contain:

```text
React hooks
React Context
React JSX providers
```

Those belong exclusively under:

```text
src/react/
```

---

## 4.2 ApplicationFactory still performs browser/runtime behavior

Current `ApplicationFactory` still contains behavior such as:

```ts
typeof window !== "undefined"
window[globalName] = context
Env.isProduction()
context.enableShutdownHooks()
```

Those are adapter/environment responsibilities.

The DI bootstrap should not need to know whether it is executing in:

```text
Chrome
Node
Cloudflare
React Native
Bun
Deno
```

---

## 4.3 Core depends on `@stackra/support`

Current imports include:

```text
Env
Str
Path
```

from:

```text
@stackra/support
```

The source comments already acknowledge that `@stackra/support` depends on `@stackra/container` in parts of the workspace.

That creates an unhealthy dependency direction:

```text
container → support → container
```

Even if bundlers currently tolerate some paths, this is an architecture smell.

The container core should have **zero dependency on `@stackra/support`**.

---

## 4.4 Discovery mixes two separate responsibilities

Current discovery contains both:

1. DI graph/provider discovery.
2. publishable config/file manifest concerns.

For example `DiscoveryModule` currently knows about:

```text
Path.packageRoot(...)
configurePublishables(...)
config/application.config.ts
config/container.config.ts
```

Those concerns do not belong to DI discovery.

DI discovery should answer:

```text
What modules/providers are registered?
What metadata do they carry?
What instances/metatypes match a query?
```

It should not answer:

```text
Where is this package on disk?
Which config files are publishable?
```

---

## 4.5 Discovery has implementation and abstraction duplication

Current design contains:

```text
DiscoveryService
ContainerDiscoveryService
DISCOVERY_SERVICE
IDiscoveryService
```

This creates two layers with overlapping meaning.

A better model is:

```text
IDiscoveryService       shared abstraction
DISCOVERY_SERVICE       shared injection token
ContainerDiscoveryService
                        canonical container implementation

DiscoveryService        optional richer container-native API
                        OR merged into the canonical implementation
```

We should decide whether `DiscoveryService` is:

- the low-level Nest-compatible API, while `IDiscoveryService` is portable; or
- unnecessary duplication.

The recommended decision is described later.

---

## 4.6 Testing package does not match the production architecture

The current testing package has a useful but incomplete mock:

```text
MockApplication
createMockApplication
TestContainerProvider
```

Problems:

- `MockApplication` only models a partial application context.
- `TestContainerProvider` casts it to concrete `ApplicationContext`.
- testing core and React testing are mixed in one entry.
- no real `TestingModuleBuilder`-style graph compilation exists.
- provider override behavior is not first-class.
- request scope is not represented as a complete testing primitive.
- Worker runtime bindings need their own harness.
- discovery swapping/overrides are not standardized.

The testing package should be refactored to use **the same public abstractions and resolution paths as production**.

---

# 5. Architectural Principles

The following should become official Stackra container standards.

## Principle 1 — Core is runtime-neutral

`@stackra/container` root must not import:

```text
react
react-dom
node:*
Cloudflare-specific packages
@stackra/testing
@stackra/support
filesystem utilities
browser-only utilities
```

The core may depend on:

```text
@stackra/contracts
metadata/reflection implementation
small internal utilities
```

---

## Principle 2 — Adapters supply runtime values; container composes them

For Cloudflare:

```text
Cloudflare Runtime
       │
       ├── Request
       ├── Env
       └── ExecutionContext
               │
               ▼
         Worker Adapter
               │
               ▼
         Request Context
               │
               ▼
         DI application graph
```

For browser:

```text
Browser
   │
   ▼
Browser/React adapter
   │
   ▼
ApplicationContext
```

The same container core is used in both.

---

## Principle 3 — Shared abstractions belong in contracts, implementation details do not

`@stackra/contracts` should contain interfaces/tokens required across package boundaries.

It should **not** become a dumping ground for every internal container type.

---

## Principle 4 — NestJS compatibility is behavioral, not dependency-based

We should support familiar NestJS semantics where valuable:

```text
@Module
@Injectable
@Inject
Optional
Global
DynamicModule
Provider variants
Scope
ModuleRef
Discovery
lifecycle hooks
forwardRef
```

But:

> `@stackra/container` must not require `@nestjs/*` to function.

Nest compatibility should mean:

```text
similar concepts
similar naming
similar provider semantics
predictable migration
```

not binary coupling.

---

## Principle 5 — Testing uses production contracts

Testing should not pretend a `Map` is a concrete `ApplicationContext`.

Instead:

```text
IApplicationContext
IRequestContext
IContainerResolver
IModuleRef
IDiscoveryService
```

should define the supported public behavior.

Testing implementations can implement those interfaces directly.

---

# 6. Package Boundary Decision: Contracts vs Container

This is one of the most important decisions.

## 6.1 Put in `@stackra/contracts`

Types/tokens belong in contracts when **another package needs them without importing the container implementation**.

Recommended DI contracts:

```ts
Type<T>
Abstract<T>
InjectionToken<T>

Provider<T>
ClassProvider<T>
ValueProvider<T>
FactoryProvider<T>
ExistingProvider<T>

ModuleMetadata
DynamicModule
ForwardReference

Scope
ScopeOptions

OnModuleInit
OnModuleDestroy
OnApplicationBootstrap
BeforeApplicationShutdown
OnApplicationShutdown
```

These already substantially live there and should remain there.

Add/normalize:

```ts
IContainerResolver
IApplicationContext
IRequestContext
IModuleRef
IDiscoveryService
IDiscoveryProvider
IDiscoveryModule

DISCOVERY_SERVICE
APPLICATION_CONTEXT
REQUEST_CONTEXT
```

Only add tokens that need to be consumed cross-package.

---

## 6.2 Keep in `@stackra/container`

Implementation-only concepts:

```text
ModuleContainer
Module
InstanceWrapper
Injector
InstanceLoader
DependenciesScanner
RequestContextRegistry
DiscoverableMetaHostCollection
metadata indexes
bootstrap caches
scope caches
internal runtime tokens
```

These are internals.

Even if some remain exported for advanced usage, they should not move into contracts.

---

## 6.3 Worker tokens

Decision:

### Cross-package public runtime tokens

If other Stackra packages are expected to inject these without importing `/worker`, then contracts may own generic runtime tokens such as:

```text
RUNTIME_REQUEST
RUNTIME_ENV
RUNTIME_EXECUTION_CONTEXT
```

However, this introduces Cloudflare semantics into shared contracts if done poorly.

### Recommended approach

Keep Cloudflare-specific tokens in:

```text
@stackra/container/worker
```

such as:

```ts
WORKER_ENV
WORKER_REQUEST
WORKER_EXECUTION_CONTEXT
WORKER_CONTEXT
```

because these are runtime adapter APIs, not universal Stackra contracts.

If a domain package needs environment-independent request access, define generic contracts instead:

```text
REQUEST_CONTEXT
REQUEST_ID
```

in `@stackra/contracts`.

---

# 7. Canonical Resolution Interfaces

Add a minimal cross-package resolver contract.

```ts
export interface IContainerResolver {
  get<T>(token: InjectionToken<T>): T;
  getOptional<T>(token: InjectionToken<T>): T | undefined;
  has(token: InjectionToken): boolean;
  resolve<T>(token: InjectionToken<T>): Promise<T>;
}
```

Then:

```ts
export interface IApplicationContext extends IContainerResolver {
  createRequestContext(
    values?: RequestContextValues,
  ): IRequestContext;

  close(): Promise<void>;
}
```

And:

```ts
export interface IRequestContext extends IContainerResolver {
  readonly id: string | symbol;
  close(): Promise<void>;
}
```

This allows:

```text
production ApplicationContext
MockApplicationContext
TestingApplicationContext
Worker request context
React integration
```

to consume a stable shape.

Concrete APIs such as:

```text
getContainer()
select()
getModules()
```

can stay container-specific.

---

# 8. Application Token Standard

Do not rely on concrete `ApplicationContext` as the injectable contract everywhere.

Use:

```ts
APPLICATION_CONTEXT
```

with:

```ts
IApplicationContext
```

when packages need the application resolver itself.

Container can still provide:

```ts
ApplicationContext
```

for advanced users.

This is analogous to:

```text
interface/token = cross-package API
class = implementation
```

---

# 9. Target Source Structure

Recommended structure:

```text
src/
├── core/
│   ├── application/
│   ├── container/
│   ├── contexts/
│   │   ├── application/
│   │   └── request/
│   ├── decorators/
│   ├── discovery/
│   ├── lifecycle/
│   ├── module/
│   ├── reflection/
│   ├── runtime/
│   ├── scopes/
│   ├── utils/
│   └── index.ts
│
├── react/
│   ├── context/
│   ├── hooks/
│   ├── providers/
│   └── index.ts
│
├── native/
│   └── index.ts
│
├── worker/
│   ├── providers/
│   ├── interfaces/
│   ├── worker.factory.ts
│   ├── worker-adapter.ts
│   ├── worker.module.ts
│   ├── worker.tokens.ts
│   └── index.ts
│
├── testing/
│   ├── application/
│   ├── builder/
│   ├── overrides/
│   ├── request/
│   ├── discovery/
│   └── index.ts
│
├── testing-react/
│   ├── test-container-provider.tsx
│   └── index.ts
│
└── testing-worker/
    ├── worker-test-harness.ts
    └── index.ts
```

Public subpaths:

```text
@stackra/container
@stackra/container/react
@stackra/container/native
@stackra/container/worker
@stackra/container/testing
@stackra/container/testing/react
@stackra/container/testing/worker
```

Alternative export map can map nested paths to separate build entries.

---

# 10. React Refactor

Move out of `src/core`:

```text
src/core/hooks/*
src/core/providers/container/*
```

into:

```text
src/react/hooks/*
src/react/providers/*
src/react/context/*
```

The root entry must never export them.

Recommended React API:

```ts
import {
  ContainerProvider,
  useContainer,
  useInject,
  useOptionalInject,
  useDiscovery,
  useDiscovered,
} from "@stackra/container/react";
```

React should depend on the resolver abstraction:

```ts
IContainerResolver
```

rather than concrete `ApplicationContext` wherever possible.

That removes the need for testing casts.

---

# 11. React Context Contract

Instead of:

```ts
Context<ApplicationContext | null>
```

use:

```ts
Context<IContainerResolver | null>
```

or a richer:

```ts
Context<IApplicationContext | null>
```

depending on the hooks' actual needs.

Recommended:

```text
ContainerContext → IContainerResolver
ApplicationContext-specific API → separate hook if required
```

Example:

```ts
const ContainerContext =
  createContext<IContainerResolver | null>(null);
```

Then `MockApplication` can be passed legitimately.

No unsafe cast is necessary.

---

# 12. Worker Architecture

The Worker implementation should remain thin.

Keep:

```text
WorkerFactory
WorkerAdapter
WorkerModule
WORKER_ENV
WORKER_REQUEST
WORKER_EXECUTION_CONTEXT
WORKER_CONTEXT
```

Do not add routing to the container.

Target flow:

```text
fetch(request, env, ctx)
       │
       ▼
WorkerAdapter
       │
       ├── get/reuse application bootstrap
       ├── create request context
       ├── provide runtime context
       └── resolve configured handler
                    │
                    ▼
                  handle()
```

---

# 13. WorkerModule Responsibility

`WorkerModule` should be the declarative owner of standard Worker bindings.

```text
WORKER_RUNTIME_CONTEXT  internal
          │
          ├── WORKER_CONTEXT
          ├── WORKER_ENV
          ├── WORKER_REQUEST
          └── WORKER_EXECUTION_CONTEXT
```

All public runtime values are:

```text
Scope.REQUEST
```

This is correct and should remain.

The factory/adapter should **not** duplicate registration of individual Worker tokens.

---

# 14. Worker Binding Rules

Cloudflare bindings should enter the application at the infrastructure boundary.

Good:

```ts
{
  provide: DATABASE,
  useFactory: (env: Env) => env.DB,
  inject: [WORKER_ENV],
}
```

Then:

```ts
@Injectable()
class D1UserRepository implements IUserRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: D1Database,
  ) {}
}
```

Application layer:

```ts
@Injectable()
class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
  ) {}
}
```

Avoid:

```ts
UserService → WORKER_ENV
```

unless the service is explicitly runtime infrastructure.

---

# 15. Runtime Adapter Interface

Introduce a small internal runtime concept.

Not every runtime needs a public class, but the core bootstrap should use adapter/capability hooks instead of direct checks.

Example:

```ts
interface IRuntimeAdapter {
  registerApplication?(context: ApplicationContext): void;
  enableShutdownHooks?(context: ApplicationContext): void;
  exposeDebugContext?(context: ApplicationContext): void;
}
```

Possible adapters:

```text
NoopRuntimeAdapter
BrowserRuntimeAdapter
NodeRuntimeAdapter
WorkerRuntimeAdapter
```

However, avoid overengineering.

The immediate goal is simply to remove runtime code from `ApplicationFactory`.

---

# 16. ApplicationFactory Target

Current bootstrap orchestration is sound:

```text
scan
register internal providers
register config
instantiate
lifecycle
ready
```

Keep that.

Refactor runtime operations out:

```text
global registration
window debug exposure
process shutdown listeners
environment detection
```

Target:

```ts
const app = await ApplicationFactory.create(AppModule, {
  runtime: adapter,
});
```

or have runtime adapters call the core factory with runtime-neutral options.

The simplest version is preferred.

---

# 17. Global Application Context

`getGlobalApplicationContext()` is useful for browser/application tooling but should not be fundamental to DI resolution.

Rules:

- off by default in serverless/edge
- configurable in browser/Node
- never used as the normal injection mechanism
- testing must not depend on global application state

Consider moving browser global exposure to:

```text
@stackra/container/react
```

or a future:

```text
@stackra/container/browser
```

---

# 18. Scope Model

Canonical scopes:

```text
Scope.DEFAULT
Scope.TRANSIENT
Scope.REQUEST
```

Document exact semantics.

## DEFAULT

One instance per application context/provider registration.

## REQUEST

One instance per request context.

## TRANSIENT

New instance per injection/resolution occurrence according to documented semantics.

Do not introduce `SINGLETON` if `DEFAULT` is retained for Nest compatibility.

`REQUEST_SCOPE` should remain only as a compatibility/helper alias if needed.

The canonical public API should be:

```ts
Scope.REQUEST
```

---

# 19. Request Context

Request context is now a core concept, not a Worker concept.

That is important because it enables:

```text
Cloudflare Workers
AWS Lambda
Vercel
Node HTTP
GraphQL request contexts
background jobs
CLI command scopes
tenant scopes
```

The API should be runtime-neutral:

```ts
const requestContext = app.createRequestContext([
  [REQUEST_CONTEXT, data],
]);

try {
  return await requestContext.get(Handler).handle();
} finally {
  await requestContext.close();
}
```

---

# 20. Generic Context Values

Define a stable `RequestContextValues` contract.

Potential API:

```ts
type ContextEntry = readonly [InjectionToken, unknown];

type RequestContextValues =
  | ReadonlyArray<ContextEntry>
  | ReadonlyMap<InjectionToken, unknown>;
```

Avoid plain object keys because tokens may be:

```text
class
symbol
string
```

---

# 21. Request Context Lifecycle

Formalize:

```text
create
resolve request-scoped providers
handle operation
dispose request-scoped providers
close
```

Add request-level disposal hooks only if a real use case exists.

Potential interface:

```ts
OnContextDestroy
```

But do not add a Worker-specific lifecycle interface.

---

# 22. Lifecycle Compatibility

Retain Nest-compatible lifecycle hooks:

```text
OnModuleInit
OnApplicationBootstrap
OnModuleDestroy
BeforeApplicationShutdown
OnApplicationShutdown
```

Clarify:

- application hooks execute at application lifecycle
- request contexts do not trigger application bootstrap hooks
- application shutdown must not occur after each Worker request
- request-scoped cleanup is separate

---

# 23. ModuleRef

`ModuleRef` should remain part of the public container implementation API.

It should support:

```ts
get(token)
get(token, options)
resolve(token, context?)
create(type)
```

where useful.

Do not blindly copy NestJS APIs; implement only semantics Stackra needs.

Request-aware resolution should use the current request context rather than inventing hidden global context state.

---

# 24. Internal Core Provider Module

Current bootstrap manually adds:

```text
ModuleContainer
ModuleRef
APP_CONFIG
```

across modules.

Long-term, introduce an internal core module concept similar in spirit to NestJS `InternalCoreModule`.

Example internal providers:

```text
ModuleContainer
ApplicationContext interface/token
ModuleRef factory
Discovery implementation
Reflector
```

This reduces bootstrap special cases.

This module should not necessarily be public.

---

# 25. Discovery: Target Architecture

Discovery should be treated as a formal subsystem.

Recommended layers:

```text
Discovery contracts
        │
        ▼
Container discovery implementation
        │
        ▼
metadata indexes / scanner integration
```

---

# 26. Discovery Contract

Keep a runtime/framework-independent interface in `@stackra/contracts`.

Recommended:

```ts
export interface IDiscoveryProvider<T = unknown> {
  token: InjectionToken<T>;
  metatype?: Type<T> | Function;
  instance?: T;
  scope?: Scope;
  module?: Type | Function;
}

export interface IDiscoveryModule {
  metatype: Type | Function;
}

export interface IDiscoveryService {
  getProviders(): readonly IDiscoveryProvider[];
  getProvidersByMetadata(
    key: string | symbol,
  ): readonly IDiscoveryProvider[];

  getModules(): readonly IDiscoveryModule[];
}
```

If richer filtering is required:

```ts
findProviders(query: DiscoveryQuery): readonly IDiscoveryProvider[];
```

This is preferable to continually adding one-off methods.

---

# 27. Discovery Token

Keep:

```ts
DISCOVERY_SERVICE
```

in `@stackra/contracts`.

Reason:

Other packages such as:

```text
logger
cache
reporters
plugins
publishables
feature registries
commands
health indicators
```

may need discovery without importing the container implementation.

That is a textbook cross-package token.

---

# 28. Container Discovery Implementation

`ContainerDiscoveryService` should become the canonical implementation of:

```ts
IDiscoveryService
```

It may internally use richer low-level utilities.

Recommended naming:

```text
ContainerDiscoveryService
```

or simply:

```text
DiscoveryService
```

Choose one public canonical service.

### Recommended decision

Use:

```text
DiscoveryService
```

as the public implementation and make it implement `IDiscoveryService`.

Remove the need for a second wrapper class if possible.

If Nest-compatible wrapper-returning APIs are important, split:

```text
DiscoveryService             portable public API
ContainerDiscoveryExplorer   container-native advanced API
```

Do not keep two similarly named public services that mostly proxy each other.

---

# 29. Discovery Adapter / Swapping

The user specifically needs the ability to swap discovery.

Support this via the token:

```ts
DISCOVERY_SERVICE
```

Default binding:

```ts
{
  provide: DISCOVERY_SERVICE,
  useExisting: DiscoveryService,
}
```

Consumers should inject:

```ts
@Inject(DISCOVERY_SERVICE)
private readonly discovery: IDiscoveryService
```

This enables testing or alternative runtimes:

```ts
{
  provide: DISCOVERY_SERVICE,
  useClass: StaticManifestDiscoveryService,
}
```

or:

```ts
{
  provide: DISCOVERY_SERVICE,
  useValue: fakeDiscovery,
}
```

---

# 30. Discovery Modes

Support two implementations over time.

## Runtime container discovery

Reads the instantiated/registered module graph.

Best for:

```text
browser
Node
normal Worker boot
tests
```

## Static/build-time discovery

Reads a generated manifest.

Useful for:

```text
edge cold-start optimization
build tooling
CLI
tree-shaken deployments
AOT-like environments
```

Interface remains identical:

```text
IDiscoveryService
```

Thus consumers do not care which implementation is active.

---

# 31. Discovery Index

`DiscoverableMetaHostCollection` is an implementation detail.

Keep it inside the container.

It should not be exposed as a cross-package contract.

Its existing per-`ModuleContainer` WeakMap approach is appropriate for application isolation.

Review the global:

```text
metaHostLinks
```

because it is process/isolate-wide.

That is acceptable for class metadata indexing, but tests must reset it deterministically.

---

# 32. Discoverable Decorator

`DiscoveryService.createDecorator<T>()` is useful and aligns with NestJS.

Keep the concept.

Consider moving decorator creation to a dedicated API:

```ts
createDiscoverableDecorator<T>()
```

while retaining:

```ts
DiscoveryService.createDecorator()
```

for compatibility.

The generated key should be stable for the decorator instance, not globally deterministic.

---

# 33. Discovery Should Not Own Publishables

Remove from `DiscoveryModule`:

```text
Path.packageRoot(...)
PACKAGE_ROOT
configurePublishables(...)
```

Move publishable config ownership to the package/tool responsible for publishing configuration.

Potential destinations:

```text
@stackra/publisher
@stackra/config
package-level publishables.ts
```

The DI `DiscoveryModule` should only configure DI discovery.

---

# 34. Remove `@stackra/support` from Container Core

Replace current uses:

## `Str`

Implement tiny internal token/class-name formatting utilities.

## `Env`

Runtime/environment behavior belongs to runtime adapter/config layer.

## `Path`

Remove from discovery core entirely.

This gives the clean direction:

```text
@stackra/contracts
      ↓
@stackra/container
      ↓
@stackra/support
```

if support wants to depend on the container.

Never:

```text
container ↔ support
```

---

# 35. Metadata Dependency

Current use of:

```text
@vivtel/metadata
reflect-metadata
```

is acceptable if intentionally standardized.

Decide one metadata abstraction:

```text
@vivtel/metadata = typed wrapper
reflect-metadata = polyfill/runtime
```

Container code should use the wrapper, not raw `Reflect.*` calls.

Document this in standards.

---

# 36. Testing Refactor — Decision

**Yes, `@stackra/container/testing` should be refactored.**

It should represent production container semantics, not only a simple map.

But there should be **two testing levels**.

---

# 37. Testing Level 1 — Lightweight Resolver Mock

Keep a lightweight mock for unit tests.

Rename conceptually:

```text
MockContainerResolver
createMockContainerResolver
```

or retain `MockApplication` for compatibility.

It should implement:

```text
IContainerResolver
```

and optionally:

```text
IApplicationContext
```

only if it actually implements the full contract.

Never cast it to a concrete production class.

Use for:

```text
simple service tests
React hook tests
token substitution
package-level unit tests
```

---

# 38. Testing Level 2 — Real Testing Application

Add a production-graph testing builder similar to NestJS's testing module experience.

Target:

```ts
const testingApp = await TestApplication.create(AppModule)
  .overrideProvider(DATABASE)
  .useValue(databaseMock)
  .overrideProvider(DISCOVERY_SERVICE)
  .useValue(fakeDiscovery)
  .compile();
```

Or:

```ts
const module = await TestingModuleBuilder
  .create(AppModule)
  .overrideProvider(...)
  .compile();
```

Recommended public naming:

```ts
Test.createApplication(AppModule)
```

or:

```ts
TestingApplicationBuilder.create(AppModule)
```

Avoid copying Nest terminology if the Stackra name is clearer.

---

# 39. Testing Overrides

Support:

```text
overrideProvider(token)
  .useValue(value)
  .useClass(type)
  .useFactory(factory)

overrideModule(module)
overrideDiscovery(...)
setConfig(...)
```

Overrides should be applied before instantiation.

They should operate on the same provider graph the production scanner creates.

---

# 40. Testing Request Scope

Add:

```ts
const request = app.createRequestContext([
  [REQUEST_CONTEXT, fakeRequest],
]);

const service = await request.resolve(Service);
```

Test utilities should make it easy to assert:

```text
same request → same request-scoped instance
different request → different instance
singleton → same application instance
transient → different instance
```

---

# 41. React Testing Subpath

Move `TestContainerProvider` out of generic testing entry.

Target:

```ts
import {
  TestContainerProvider,
} from "@stackra/container/testing/react";
```

It should accept:

```ts
IContainerResolver
```

not concrete `ApplicationContext`.

No cast.

Example:

```tsx
<TestContainerProvider
  container={createMockContainerResolver([
    [LOGGER, logger],
  ])}
>
  <Widget />
</TestContainerProvider>
```

---

# 42. Worker Testing Subpath

Add:

```text
@stackra/container/testing/worker
```

with:

```ts
createWorkerTestHarness()
createMockWorkerExecutionContext()
createMockWorkerEnv()
```

Example:

```ts
const worker = createWorkerTestHarness(AppModule, {
  handler: AppHandler,
  env: {
    DB: mockDb,
  },
});

const response = await worker.fetch(
  new Request("https://test.local/users"),
);
```

This should run through the real:

```text
WorkerAdapter
request context
WorkerModule
DI graph
```

rather than mocking Worker DI separately.

---

# 43. Discovery Testing

Provide:

```ts
createMockDiscoveryService()
```

implementing:

```ts
IDiscoveryService
```

and allow:

```ts
.overrideProvider(DISCOVERY_SERVICE)
.useValue(mockDiscovery)
```

Also test the real discovery subsystem with compiled modules.

---

# 44. Testing Package Dependency

Current testing entry depends on:

```text
@stackra/testing
```

for assertable proxies.

That is okay if:

```text
@stackra/testing
```

does **not** depend on `@stackra/container/testing` or container internals in a way that creates a cycle.

Dependency rule:

```text
contracts
   ↓
container
   ↓
container/testing → stackra/testing
```

or:

```text
stackra/testing
   ↓
container/testing
```

but not both.

Choose one direction and enforce it.

Preferred:

```text
@stackra/testing = generic test utilities
@stackra/container/testing = DI-specific test tools built on generic utilities
```

Therefore:

```text
container/testing → stackra/testing
```

is correct.

---

# 45. NestJS Compatibility Strategy

Define three compatibility levels.

## Level A — API vocabulary compatibility

Maintain equivalent concepts:

```text
Module
Injectable
Inject
Optional
Global
Scope
DynamicModule
Provider
ModuleRef
DiscoveryService
Reflector
forwardRef
```

Required.

## Level B — Behavioral compatibility

Provider resolution, scopes, exports/imports, lifecycle, forward refs, optional deps should behave similarly.

Required where documented.

## Level C — Direct NestJS interop

Using Nest classes/modules/providers directly.

Not required for core.

If needed later, provide:

```text
@stackra/container/nest
```

as an adapter package/subpath.

Do not pollute core with Nest dependencies.

---

# 46. Controllers

Do not add controllers to the container merely for Nest compatibility.

Controllers are transport/application framework concerns.

A future package may define:

```text
@stackra/http
@stackra/router
@stackra/worker-http
```

and use the container.

The DI engine should remain transport-neutral.

---

# 47. Discovery and Controllers

If a future HTTP package needs controller discovery, it should:

- tag controller providers with metadata
- register them as providers
- use `IDiscoveryService`

Example:

```ts
const controllers =
  discovery.getProvidersByMetadata(CONTROLLER_METADATA);
```

No controller-specific scanning needs to be added to core.

This keeps discovery extensible.

---

# 48. Runtime-Agnostic Handler Pattern

Define no required handler class in core.

Runtime adapters can define their own.

Worker:

```ts
interface WorkerHandler {
  handle(): Promise<Response>;
}
```

CLI:

```ts
interface CommandHandler {
  execute(): Promise<number>;
}
```

HTTP:

```ts
interface HttpHandler {
  handle(request): Promise<Response>;
}
```

All are resolved from the same container.

---

# 49. Configuration

`APP_CONFIG` is currently in contracts.

That is fine if shared packages inject it.

However, avoid the container itself reading environmental config.

The application/runtime creates config:

```ts
ApplicationFactory.create(AppModule, {
  config: ...
})
```

Worker can derive config from env through a provider.

Browser can derive config from bootstrap state.

---

# 50. Config Provider Standard

Prefer dedicated config packages/tokens rather than one giant object for large systems.

Example:

```text
APP_CONFIG
DATABASE_CONFIG
AUTH_CONFIG
CACHE_CONFIG
```

Container only injects; it does not define their domain structure.

---

# 51. Application Builder

Keep `ApplicationBuilder`.

Normalize it to only configure DI/application lifecycle behavior.

Avoid putting runtime-specific switches into it.

Potential APIs:

```ts
ApplicationFactory.builder(AppModule)
  .withConfig(config)
  .withProvider(...)
  .onReady(...)
  .boot();
```

Runtime adapters should wrap this if necessary.

---

# 52. Error Model

Add typed container errors.

Recommended hierarchy:

```text
ContainerError
├── ModuleResolutionError
├── ProviderResolutionError
├── UnknownProviderError
├── CircularDependencyError
├── InvalidProviderError
├── ScopeViolationError
├── RequestContextError
└── LifecycleError
```

Resolution diagnostics should include:

```text
requested token
host module
dependency index/property
resolution chain
provider scope
optional status
```

Example:

```text
Cannot resolve DATABASE while constructing UserRepository.

Resolution chain:
UserService
→ USER_REPOSITORY
→ D1UserRepository
→ DATABASE
```

---

# 53. Scope Safety

Detect invalid lifetime dependencies where practical.

Example:

```text
singleton directly capturing request-scoped provider
```

This is dangerous because it can leak request state.

At minimum, document the behavior.

Prefer detecting and throwing:

```text
ScopeViolationError
```

unless resolution is performed through request-aware `ModuleRef`.

---

# 54. Container Encapsulation

Most internals currently exported from root:

```text
Injector
ModuleContainer
DependenciesScanner
InstanceWrapper
RequestContextRegistry
```

Review whether they are truly public API.

Recommended public tiers:

## Stable public

```text
decorators
provider contracts
ApplicationFactory
ApplicationContext interface
ModuleRef
Scope
Reflector
Discovery API
request context API
```

## Advanced / unstable

```text
ModuleContainer
Injector
InstanceWrapper
DependenciesScanner
```

Move advanced internals to:

```text
@stackra/container/internals
```

or stop exporting them.

This allows future implementation changes.

---

# 55. Public API Stability

Create an explicit API policy:

```text
root exports = stable
runtime subpaths = stable
testing subpaths = stable-for-testing
internals = no semver guarantee
```

This is particularly important before more packages depend directly on implementation classes.

---

# 56. Proposed Export Map

```json
{
  ".": "...",
  "./react": "...",
  "./native": "...",
  "./worker": "...",
  "./testing": "...",
  "./testing/react": "...",
  "./testing/worker": "...",
  "./internals": "..."
}
```

Only add `./internals` if advanced consumers truly need it.

---

# 57. Node / Bun / Deno

Do not add runtime subpaths just because they exist.

The core should already run there.

Create:

```text
@stackra/container/node
```

only when Node-specific lifecycle functionality is required, such as:

```text
SIGTERM
SIGINT
process hooks
```

Similarly for Deno/Bun.

---

# 58. Shutdown Refactor

Move:

```text
process.on(...)
```

style behavior out of `ApplicationContext`.

Core should expose:

```ts
await app.close(signal?)
```

Node adapter can listen to process signals and call it.

Worker does not install process handlers.

Browser normally does not either.

---

# 59. Debug Exposure

Move:

```ts
window.__APP__
```

out of core bootstrap.

Potential React/browser API:

```ts
exposeApplicationForDebug(app, {
  name: "__APP__",
});
```

This keeps debugging optional and runtime-specific.

---

# 60. Environment Mixin

Current `WithEnvironment` is frontend heritage and depends on support.

Deprecate/remove from container core.

Environment/configuration belongs in:

```text
@stackra/config
@stackra/support
runtime bindings
```

DI should inject environment abstractions rather than own environment lookup.

---

# 61. Lazy Modules

Keep `LazyModuleLoader` if runtime-safe.

Rules:

- no filesystem discovery
- dynamic `import()` is allowed where runtime supports it
- request/app scope behavior must be defined
- lazy-loaded module integration into discovery indexes must be tested
- global module binding after lazy load must be deterministic

---

# 62. Dynamic Modules

Continue supporting:

```ts
Module.forRoot()
Module.forRootAsync()
Module.forFeature()
```

through `DynamicModule`.

Add tests for merging semantics when the same module class contributes:

```text
providers
imports
exports
global
```

The current container already has logic for this; formalize it as a standard.

---

# 63. Multi Providers

The package has multi-provider tests.

Document multi provider semantics clearly.

If multi providers are Stackra-specific rather than Nest-compatible, label them as an extension.

Do not let compatibility claims imply NestJS has identical behavior if it does not.

---

# 64. Property Injection

Property injection is supported.

Keep it, but recommend constructor injection as the default standard.

Use property injection for:

```text
framework-managed optional dependencies
legacy compatibility
special integration cases
```

---

# 65. `inject()` Function

The lazy/module-level `inject()` helper should be reviewed carefully.

Avoid dependency on global application context if possible.

A globally resolved `inject()` is convenient in browser code but problematic in:

```text
multiple apps
Workers
parallel tests
SSR
```

Recommended:

- keep for browser compatibility if needed
- mark as context/global API
- do not use in new runtime-neutral application services
- prefer constructor injection

Potential future API can use explicit context.

---

# 66. Thread/Request/Isolate Safety

Global mutable state must be minimized.

Audit:

```text
global application context
DiscoverableMetaHostCollection.metaHostLinks
bootstrap caches
static registries
```

Rules:

- per-application state should be keyed by application/container
- request state must be request-context local
- Worker isolate reuse must never leak request values
- parallel testing apps must not interfere

---

# 67. Worker Bootstrap Cache

Caching the application promise per Worker adapter is appropriate.

Requirements:

```text
concurrent first requests share bootstrap
failed bootstrap clears cache
request env is not captured in application singleton
request objects are never application-scoped
```

If env binding identity can change between Worker invocations/config versions, only request-scoped env should be used.

---

# 68. Discovery on Workers

Runtime discovery can work because the module graph is static in the bundle.

Do not use filesystem scanning.

If cold-start optimization is later required:

```text
build-time manifest
       │
       ▼
StaticManifestDiscoveryService
```

can replace runtime discovery via:

```text
DISCOVERY_SERVICE
```

without changing consumers.

---

# 69. ADR Plan

The following ADRs should be created or updated.

## ADR-CONTAINER-001 — Container Role and Package Boundary

Decision:

> `@stackra/container` is the runtime-neutral Stackra DI/module composition engine.

Covers:

- what belongs in core
- what belongs in adapters
- what is explicitly out of scope

---

## ADR-CONTAINER-002 — Contracts Ownership

Decision:

> Cross-package abstractions/tokens live in `@stackra/contracts`; container implementation internals remain encapsulated.

Includes:

```text
IContainerResolver
IApplicationContext
IRequestContext
IDiscoveryService
DISCOVERY_SERVICE
Scope
Provider contracts
```

---

## ADR-CONTAINER-003 — Runtime Adapters

Decision:

> Runtime-specific values/lifecycle are supplied by adapters; core does not detect/manage browser, Node, or Worker directly.

---

## ADR-CONTAINER-004 — Request Scope

Decision:

> Request scope is a generic child context of the application container, not a Cloudflare-specific feature.

---

## ADR-CONTAINER-005 — Cloudflare Worker Integration

Decision:

> Worker integration is a thin adapter and global runtime module; Cloudflare bindings enter DI as request-scoped runtime values.

---

## ADR-CONTAINER-006 — React Integration

Decision:

> React context/hooks/providers live exclusively in `@stackra/container/react` and consume resolver contracts rather than concrete container classes.

---

## ADR-CONTAINER-007 — Discovery Contract and Implementations

Decision:

> `IDiscoveryService` + `DISCOVERY_SERVICE` are shared contracts; the container supplies the default runtime implementation and allows replacement.

---

## ADR-CONTAINER-008 — Testing Architecture

Decision:

> Testing provides both lightweight resolver mocks and real compiled container testing with provider overrides. React/Worker fixtures are separate testing subpaths.

---

## ADR-CONTAINER-009 — NestJS Compatibility

Decision:

> Stackra targets conceptual and behavioral compatibility with Nest DI/module conventions without making NestJS a runtime dependency.

---

## ADR-CONTAINER-010 — Core Dependency Direction

Decision:

> Core container depends only downward on contracts/metadata. `@stackra/support`, React, testing, filesystem, and runtime integrations may not be dependencies of the core.

---

# 70. Steering / Standards Alignment

The changelog references existing steering files such as:

```text
.kiro/steering/code-standards.md
.kiro/steering/support-utilities.md
.kiro/steering/documentation.md
```

Those actual steering files were not present in the uploaded package, so this plan should be reconciled against the repository copies before implementation.

Based on the source and changelog, the following container-specific steering should be added.

---

# 71. New Steering — `container-architecture.md`

Rules:

```text
1. Core is runtime-neutral.
2. No React imports in core.
3. No @stackra/support imports in core.
4. No Node/browser/Worker globals in core bootstrap.
5. Runtime values enter through adapters and DI providers.
6. Cross-package contracts use @stackra/contracts.
7. Internal implementation types stay in container.
8. Constructor injection is preferred.
9. Request data may never be captured by application singletons.
10. Runtime adapters may not implement application routing.
```

---

# 72. New Steering — `dependency-injection.md`

Define:

```text
provider forms
scope semantics
constructor injection
optional injection
forwardRef
dynamic modules
exports/imports
global modules
ModuleRef usage
injection token naming
symbol token rules
```

Token standard:

```ts
export const USER_REPOSITORY =
  Symbol.for("@stackra/users:user-repository");
```

Use stable namespace identifiers for public symbols.

Internal symbols may use local `Symbol()` where cross-bundle identity is unnecessary.

---

# 73. New Steering — `runtime-adapters.md`

Rules for:

```text
browser
react
worker
node
serverless
```

Includes:

- app lifecycle vs request lifecycle
- environment injection
- shutdown behavior
- debug behavior
- no runtime leakage into domain services

---

# 74. New Steering — `discovery.md`

Define:

```text
IDiscoveryService
DISCOVERY_SERVICE
discoverable decorators
metadata keys
provider discovery
module discovery
runtime vs static discovery
testing overrides
```

Also define:

> Packages must inject the discovery interface/token unless they explicitly require container-native wrappers.

---

# 75. New Steering — `container-testing.md`

Define:

```text
when to use a resolver mock
when to compile a real testing application
provider overrides
request-scope tests
React fixture
Worker fixture
discovery mocks
global state cleanup
```

---

# 76. Documentation Structure

Recommended:

```text
docs/
├── architecture/
│   ├── overview.md
│   ├── package-boundaries.md
│   ├── module-system.md
│   ├── provider-resolution.md
│   ├── scopes.md
│   ├── lifecycle.md
│   ├── request-context.md
│   └── runtime-model.md
│
├── discovery/
│   ├── overview.md
│   ├── discoverable-decorators.md
│   ├── discovery-service.md
│   ├── custom-implementation.md
│   └── static-discovery.md
│
├── runtimes/
│   ├── browser.md
│   ├── react.md
│   ├── react-native.md
│   ├── cloudflare-workers.md
│   └── node.md
│
├── testing/
│   ├── overview.md
│   ├── mock-resolver.md
│   ├── testing-application.md
│   ├── provider-overrides.md
│   ├── request-scope.md
│   ├── react.md
│   └── worker.md
│
├── compatibility/
│   └── nestjs.md
│
└── migration/
    └── v3-to-v4.md
```

---

# 77. README Target

README should answer five things quickly:

```text
What is Stackra Container?
How do I define modules/providers?
How do I bootstrap?
How does it work in React?
How does it work in Workers?
```

Then link to full docs.

Avoid marketing it as:

```text
client-side DI
```

Use:

> Runtime-neutral TypeScript dependency injection and module composition for Stackra applications.

---

# 78. Proposed Public Usage — Core

```ts
import {
  ApplicationFactory,
  Inject,
  Injectable,
  Module,
  Scope,
} from "@stackra/container";

@Injectable()
class UsersService {}

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
class UsersModule {}

@Module({
  imports: [UsersModule],
})
class AppModule {}

const app = await ApplicationFactory.create(AppModule);
const users = app.get(UsersService);
```

---

# 79. Proposed Public Usage — React

```tsx
import {
  ContainerProvider,
  useInject,
} from "@stackra/container/react";

function App() {
  const users = useInject(UsersService);
  // ...
}

root.render(
  <ContainerProvider context={application}>
    <App />
  </ContainerProvider>,
);
```

`ContainerProvider` should type `context` as an interface, not concrete implementation.

---

# 80. Proposed Public Usage — Worker

```ts
import {
  WorkerFactory,
} from "@stackra/container/worker";

export default WorkerFactory.create(AppModule, {
  handler: AppWorkerHandler,
});
```

Handler:

```ts
@Injectable({ scope: Scope.REQUEST })
class AppWorkerHandler {
  constructor(
    @Inject(WORKER_REQUEST)
    private readonly request: Request,
    private readonly users: UsersService,
  ) {}

  async handle(): Promise<Response> {
    // ...
  }
}
```

---

# 81. Proposed Public Usage — Portable Discovery

```ts
@Injectable()
class PluginLoader {
  constructor(
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery: IDiscoveryService,
  ) {}

  load(): void {
    const plugins =
      this.discovery.getProvidersByMetadata(PLUGIN_METADATA);
  }
}
```

This service is not coupled to:

```text
ModuleContainer
InstanceWrapper
NestJS
Cloudflare
React
```

---

# 82. Proposed Public Usage — Testing

Lightweight:

```ts
const container = createMockContainerResolver([
  [USER_REPOSITORY, fakeRepository],
]);
```

Compiled graph:

```ts
const app = await Test.createApplication(AppModule)
  .overrideProvider(USER_REPOSITORY)
  .useValue(fakeRepository)
  .compile();

const service = app.get(UsersService);
```

---

# 83. Migration Plan

## Phase 0 — Baseline and API Freeze

```text
[ ] Run current build
[ ] Run typecheck
[ ] Run full test suite
[ ] Generate public export inventory
[ ] Record bundle entry graphs
[ ] Record current Nest-compatible behaviors
[ ] Record all packages importing container internals
```

---

## Phase 1 — Contracts

```text
[ ] Define IContainerResolver
[ ] Define IApplicationContext
[ ] Define IRequestContext
[ ] Normalize IModuleRef if cross-package use requires it
[ ] Normalize IDiscoveryService
[ ] Normalize IDiscoveryProvider
[ ] Confirm DISCOVERY_SERVICE ownership
[ ] Add APPLICATION_CONTEXT only if cross-package injection requires it
[ ] Keep Worker tokens out of generic contracts
```

---

## Phase 2 — Core Dependency Cleanup

```text
[ ] Remove @stackra/support imports from core
[ ] Remove environment mixin from core
[ ] Remove Path/publishables from DiscoveryModule
[ ] Remove browser debug behavior from ApplicationFactory
[ ] Remove process shutdown behavior from core bootstrap
[ ] Audit static/global mutable state
```

---

## Phase 3 — React Isolation

```text
[ ] Move core/hooks → react/hooks
[ ] Move core/providers/container → react/providers
[ ] Change React context type to IContainerResolver/IApplicationContext
[ ] Update /react exports
[ ] Ensure root/worker bundles contain no React
```

---

## Phase 4 — Request Scope Hardening

```text
[ ] Finalize Scope.REQUEST semantics
[ ] Make RequestContext implement IRequestContext
[ ] Ensure nested dependencies resolve in current request context
[ ] Enforce deterministic cleanup
[ ] Add lifetime/scope violation tests
[ ] Add concurrent request isolation tests
```

---

## Phase 5 — Worker Finalization

```text
[ ] Keep WorkerFactory thin
[ ] Keep WorkerModule as runtime binding owner
[ ] Keep runtime values request-scoped
[ ] Prevent app bootstrap from capturing env/request
[ ] Harden bootstrap retry
[ ] Worker-specific tests
[ ] Cloudflare integration example
```

---

## Phase 6 — Discovery Refactor

```text
[ ] Choose one canonical public DiscoveryService implementation
[ ] Implement IDiscoveryService directly
[ ] Bind DISCOVERY_SERVICE to default implementation
[ ] Separate container-native advanced explorer if required
[ ] Remove publishable/file concerns
[ ] Add custom discovery replacement tests
[ ] Add static-manifest discovery design
```

---

## Phase 7 — Testing Refactor

```text
[ ] Introduce MockContainerResolver
[ ] Remove concrete ApplicationContext casts
[ ] Introduce real Test application builder
[ ] Add provider overrides
[ ] Add module overrides if required
[ ] Add discovery override helpers
[ ] Add request-context helpers
[ ] Move React testing to /testing/react
[ ] Add Worker testing to /testing/worker
```

---

## Phase 8 — Encapsulation

```text
[ ] Audit root exports
[ ] Stop exporting internals by default
[ ] Add /internals only if necessary
[ ] Migrate workspace consumers away from InstanceWrapper/ModuleContainer where possible
[ ] Establish public API stability policy
```

---

## Phase 9 — Documentation / ADR / Steering

```text
[ ] Add all ADRs
[ ] Add container architecture steering
[ ] Add DI standards
[ ] Add discovery standards
[ ] Add runtime adapter standards
[ ] Add testing standards
[ ] Rewrite README
[ ] Add NestJS compatibility matrix
```

---

## Phase 10 — v4 Release

This refactor is substantial enough that the cleanest final boundary may warrant:

```text
@stackra/container v4
```

Use a major version if public exports/types move.

Provide compatibility aliases where inexpensive.

---

# 84. Testing Matrix

## Core

```text
[ ] class provider
[ ] value provider
[ ] factory provider
[ ] async factory
[ ] existing provider
[ ] optional dependency
[ ] property injection
[ ] forwardRef
[ ] circular dependency diagnostics
[ ] dynamic modules
[ ] global modules
[ ] multi providers
[ ] lazy modules
```

## Scopes

```text
[ ] default identity
[ ] transient identity
[ ] request identity
[ ] request isolation
[ ] nested request resolution
[ ] request cleanup
[ ] concurrent requests
[ ] singleton/request lifetime violations
```

## Lifecycle

```text
[ ] module init
[ ] application bootstrap
[ ] module destroy
[ ] before shutdown
[ ] application shutdown
[ ] lifecycle ordering
[ ] failure propagation
```

## Discovery

```text
[ ] all providers
[ ] metadata provider filtering
[ ] module filtering
[ ] module discovery
[ ] discoverable decorator
[ ] method metadata
[ ] app isolation
[ ] fake discovery swap
[ ] static discovery swap
```

## React

```text
[ ] Provider exposes resolver
[ ] useInject
[ ] useOptionalInject
[ ] useDiscovery
[ ] mock resolver works without cast
[ ] separate bundle identity
```

## Worker

```text
[ ] WorkerModule bindings
[ ] WORKER_ENV
[ ] WORKER_REQUEST
[ ] WORKER_EXECUTION_CONTEXT
[ ] WORKER_CONTEXT
[ ] request scope isolation
[ ] bootstrap caching
[ ] bootstrap recovery
[ ] no React bundle
[ ] no Node globals
```

## Testing

```text
[ ] lightweight mock resolver
[ ] compiled testing application
[ ] overrideProvider useValue
[ ] overrideProvider useClass
[ ] overrideProvider useFactory
[ ] request context
[ ] discovery override
[ ] React test provider
[ ] Worker harness
```

---

# 85. NestJS Compatibility Matrix

Document a matrix such as:

| Concept | Stackra | NestJS compatibility target |
|---|---|---|
| `@Module()` | Yes | High |
| `@Injectable()` | Yes | High |
| `@Inject()` | Yes | High |
| `@Optional()` | Yes | High |
| `@Global()` | Yes | High |
| `forwardRef()` | Yes | High |
| Dynamic modules | Yes | High |
| class/value/factory/existing providers | Yes | High |
| request scope | Yes | High semantics |
| transient scope | Yes | High semantics |
| `ModuleRef` | Yes | selected compatible subset |
| lifecycle hooks | Yes | High |
| `Reflector` | Yes | High concept |
| Discovery | Yes | compatible concept |
| Controllers | No | intentionally out of scope |
| HTTP adapter | No | separate package |
| Guards/interceptors/pipes | No | transport/framework package |
| direct Nest module loading | No | optional future bridge |

This prevents "Nest-compatible" from becoming an undefined claim.

---

# 86. Acceptance Criteria

The architecture refactor is complete when:

## Dependency direction

```text
[ ] core has no React dependency
[ ] core has no @stackra/support dependency
[ ] core has no @stackra/testing dependency
[ ] core has no Cloudflare dependency
[ ] core has no Node runtime dependency
```

## Contracts

```text
[ ] packages can inject shared container/discovery abstractions via contracts
[ ] internals are not moved into contracts
[ ] public token ownership is documented
```

## React

```text
[ ] React integration lives only under /react
[ ] React testing lives under /testing/react
[ ] no concrete ApplicationContext cast is needed
```

## Worker

```text
[ ] Worker adapter remains thin
[ ] WorkerModule owns standard runtime provider definitions
[ ] env/request/execution context are request-scoped
[ ] application services can remain runtime-independent
```

## Discovery

```text
[ ] one canonical discovery abstraction
[ ] default container implementation
[ ] implementation can be overridden
[ ] no filesystem/publishable concern in discovery core
```

## Testing

```text
[ ] lightweight mock for unit tests
[ ] real compiled test container for integration tests
[ ] provider override API
[ ] request-scoped test support
[ ] discovery override support
[ ] Worker harness
```

## Compatibility

```text
[ ] documented NestJS compatibility matrix
[ ] existing DI behavior remains stable unless v4 migration documents change
```

---

# 87. Recommended Final Dependency Graph

```text
                        @stackra/contracts
                         ▲      ▲      ▲
                         │      │      │
                         │      │      │
              ┌──────────┘      │      └──────────┐
              │                 │                 │
      @stackra/container   other packages   runtime packages
              │
      ┌───────┼───────────────┐
      │       │               │
      ▼       ▼               ▼
   /react   /worker        /testing
      │                       │
      │                       ▼
      │                 @stackra/testing
      │
      ▼
    react
```

And never:

```text
@stackra/container/core
      ↓
@stackra/support
      ↓
@stackra/container
```

---

# 88. Final Recommendation

Do **not** treat this as "a frontend container plus a Worker feature."

Treat it as:

> **Stackra's universal application composition kernel.**

The package should have a small, strongly encapsulated core containing:

```text
module graph
provider graph
dependency resolution
scopes
application/request contexts
lifecycle
reflection
discovery implementation
```

Everything else should be a consumer or adapter:

```text
React
Cloudflare
testing UI
Node shutdown
HTTP
routing
publishing
configuration
```

The contracts package should expose only the abstractions that **other Stackra packages genuinely need to depend on**, especially:

```text
provider/module contracts
scope/lifecycle contracts
resolver/application/request interfaces
discovery interface/token
```

The testing package should be refactored so it validates and emulates the **actual container architecture**, with two deliberate modes:

```text
lightweight resolver mock
real compiled testing application
```

And discovery should become a swappable service behind:

```text
IDiscoveryService
DISCOVERY_SERVICE
```

so Stackra can use:

```text
runtime module-graph discovery today
static/build-time discovery tomorrow
fake discovery in tests
```

without changing consuming packages.

That gives the package a stable architecture that covers:

```text
browser
React
React Native
Cloudflare Workers
serverless
Node/Bun/Deno
testing
plugin/discovery systems
NestJS-like development patterns
```

without coupling those environments together.
