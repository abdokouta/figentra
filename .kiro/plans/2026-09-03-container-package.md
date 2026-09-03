---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/container — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference
plan:** `.ref/packages/container/stackra-container-architecture-plan.md` (3405
lines)

## Purpose

`@stackra/container` is the workspace's DI substrate. It ships:

- A NestJS-compatible dependency-injection resolver that runs identically in
  **the browser**, **React Native**, **Cloudflare Workers**, and **inside a
  NestJS server** (via a Nest adapter).
- A canonical `IDiscoveryService` primitive that other packages (`logger`,
  `cache`, `queue`, `event-bus`, ...) consume to auto-register decorated classes
  without inventing their own discovery.
- Request-scoped context — an AsyncLocalStorage-shaped resolver so a single
  request's correlation ID, tenant ID, and logger flow to every service that
  needs them.
- Testing primitives — `TestContainer` + `.overrideProvider(...)` +
  `.overrideDiscovery(...)` compatible with the current
  `@stackra/testing/core/container` shape.

**Origins.** The reference package (`@stackra/ts-container` in the source
material) was originally authored to give React browser apps a NestJS-shaped DI
container. It later added Worker + Nest adapters. This plan CONSOLIDATES those
origins into the cross-runtime shape mandated by ADR-0091.

## Non-goals

- Full parity with NestJS's `@Injectable()` metadata graph. We support what the
  workspace needs: constructor injection, `@Inject(TOKEN)`, `@Optional()`,
  scoped providers, lifecycle hooks. Not: circular provider resolution beyond
  `forwardRef`, request-per-request AsyncLocalStorage nesting, MVC-style
  request-scoped controllers.
- Runtime code generation (proxies, dynamic module IDs). Every provider is
  registered ahead of time; discovery is convention-based against metadata keys.
- Replacement for `@nestjs/core`. Inside a NestJS server, we adapt to Nest's
  container (via `@stackra/container/nestjs`), not replace it.

## Subpath layout (per ADR-0091)

```
packages/container/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── application/               # ApplicationContext class
│   │   ├── container/                 # ContainerResolver, InstanceRegistry
│   │   ├── contexts/                  # RequestContext (AsyncLocalStorage-like)
│   │   ├── decorators/                # @Injectable, @Inject, @Optional (browser + RN safe)
│   │   ├── discovery/                 # DiscoveryService, provider scanner
│   │   ├── errors/                    # ContainerResolutionError, MetadataError
│   │   ├── hooks/                     # useInject, useOptionalInject (cross-platform)
│   │   ├── interfaces/                # local interfaces (public go in @stackra/contracts)
│   │   ├── lifecycle/                 # OnModuleInit, OnApplicationBootstrap, OnDestroy
│   │   ├── module/                    # Module class, DynamicModule builder
│   │   ├── providers/                 # ClassProvider, ValueProvider, FactoryProvider
│   │   ├── scopes/                    # DEFAULT, TRANSIENT, REQUEST
│   │   ├── tokens/                    # local token constants (public go in @stackra/contracts)
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── nest-adapter.module.ts     # bridges Nest's container to IContainerResolver
│   │   ├── nest-discovery.adapter.ts  # wraps @nestjs/core DiscoveryService into IDiscoveryService
│   │   ├── request-context.middleware.ts
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # <ContainerProvider>
│   │   ├── hooks/                     # web-only additions on top of core hooks
│   │   └── index.ts
│   │
│   ├── native/
│   │   ├── providers/                 # <ContainerProvider> (RN)
│   │   ├── hooks/                     # RN-only additions
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── worker-container.factory.ts # createWorkerContainer(env, ctx)
│   │   ├── env-bindings.ts
│   │   ├── request-context.ts
│   │   ├── waituntil-flush.ts
│   │   └── index.ts
│   │
│   └── testing/
│       ├── test-container.ts          # TestContainer w/ .overrideProvider, .overrideDiscovery
│       ├── mock-discovery.ts
│       ├── mock-request-context.ts
│       ├── react/                     # <TestContainerProvider>
│       ├── worker/                    # createWorkerContainerHarness()
│       └── index.ts
│
├── __tests__/
├── LICENSE
├── README.md
├── catalog.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Contracts split (per ADR-0091 §Rule 1)

The following symbols land in `@stackra/contracts` (not in this package):

| Symbol                     | Kind      | Location in contracts                               |
| -------------------------- | --------- | --------------------------------------------------- |
| `IContainerResolver`       | interface | `packages/contracts/src/interfaces/container/`      |
| `IApplicationContext`      | interface | `packages/contracts/src/interfaces/container/`      |
| `IRequestContext`          | interface | `packages/contracts/src/interfaces/container/`      |
| `IDiscoveryService`        | interface | `packages/contracts/src/interfaces/container/`      |
| `IDiscoveredProvider`      | interface | `packages/contracts/src/interfaces/container/`      |
| `IModuleReference`         | interface | `packages/contracts/src/interfaces/container/`      |
| `IProvider` (union)        | type      | `packages/contracts/src/interfaces/container/`      |
| `IClassProvider`           | interface | `packages/contracts/src/interfaces/container/`      |
| `IValueProvider`           | interface | `packages/contracts/src/interfaces/container/`      |
| `IFactoryProvider`         | interface | `packages/contracts/src/interfaces/container/`      |
| `Scope` enum               | enum      | `packages/contracts/src/enums/`                     |
| `CONTAINER`                | token     | `packages/contracts/src/tokens/container.tokens.ts` |
| `APPLICATION_CONTEXT`      | token     | same                                                |
| `REQUEST_CONTEXT`          | token     | same                                                |
| `DISCOVERY_SERVICE`        | token     | same                                                |
| `IContainerModuleOptions`  | interface | `packages/contracts/src/interfaces/container/`      |
| `ContainerResolutionError` | class     | `packages/contracts/src/errors/`                    |
| `MetadataError`            | class     | `packages/contracts/src/errors/`                    |

`@stackra/container` `.` exports concrete `ContainerResolver`,
`ApplicationContext`, `Module`, `defineDynamicModule()`, decorators, and every
lifecycle interface. Consumers of the SHAPE (logger, cache, queue) import from
`@stackra/contracts`; consumers of the IMPLEMENTATION (services, workers, apps)
import from `@stackra/container/{nestjs,react,worker}`.

## Public API surface (per subpath)

### `@stackra/container` (root — runtime-agnostic core)

```typescript
// Class exports
export { ApplicationContext } from "./core/application";
export { ContainerResolver } from "./core/container";
export { RequestContext } from "./core/contexts";
export { DiscoveryService } from "./core/discovery";
export { Module } from "./core/module";
export { defineDynamicModule } from "./core/module";

// Decorators
export { Injectable } from "./core/decorators";
export { Inject } from "./core/decorators";
export { Optional } from "./core/decorators";
export { Global } from "./core/decorators";

// Lifecycle
export type { OnModuleInit } from "./core/lifecycle";
export type { OnApplicationBootstrap } from "./core/lifecycle";
export type { OnApplicationShutdown } from "./core/lifecycle";

// Utilities
export { forwardRef } from "./core/utils";
```

**Consumers** re-export `@stackra/contracts` for the interfaces/tokens they use
(subject to `contract-reexports.md` — no forwarding through this package).

### `@stackra/container/nestjs`

```typescript
export { ContainerModule } from "./nestjs/container.module";
export { NestContainerAdapter } from "./nestjs/nest-adapter.module";
export { NestDiscoveryAdapter } from "./nestjs/nest-discovery.adapter";
export { RequestContextMiddleware } from "./nestjs/request-context.middleware";
```

Consumed by services via `ContainerModule.forRoot(...)` (composed by
`StackraServiceModule` per ADR-0092).

### `@stackra/container/react`

```typescript
// From core (cross-platform):
export { useInject, useOptionalInject } from "../core/hooks";
export { ContainerProvider } from "../core/providers";
export { ContainerContext } from "../core/contexts";

// Web-only additions (if any — usually none):
```

### `@stackra/container/native`

```typescript
// From core (cross-platform):
export { useInject, useOptionalInject } from "../core/hooks";
export { ContainerProvider } from "../core/providers";
export { ContainerContext } from "../core/contexts";

// RN-only additions (if any — usually none):
```

### `@stackra/container/worker`

```typescript
export { createWorkerContainer } from "./worker/worker-container.factory";
export { WorkerContainer } from "./worker/worker-container";
export type { IWorkerEnv } from "./worker/env-bindings";
export { flushOnWaitUntil } from "./worker/waituntil-flush";
```

### `@stackra/container/testing`

```typescript
export { TestContainer } from "./testing/test-container";
export { createTestContainer } from "./testing/test-container";
export { MockDiscoveryService } from "./testing/mock-discovery";
export { MockRequestContext } from "./testing/mock-request-context";
```

**Note:** `@stackra/testing/core/container` already ships a testing container
via `createTestContainer()`. That primitive stays (@stackra/testing owns
test-doubles for consumers that don't want to install `@stackra/container` for
tests). Consumers WITH `@stackra/container` installed use
`@stackra/container/testing` for the full-fidelity harness.

## Discovery service — canonical primitive

Every workspace package that needs "find all providers decorated with X" (logger
sinks, cache stores, queue workers, event handlers) uses the SAME
`IDiscoveryService` from `@stackra/contracts`:

```typescript
interface IDiscoveryService {
  getProviders(): IDiscoveredProvider[];
  getProvidersByMetadata(key: string | symbol): IDiscoveredProvider[];
}

interface IDiscoveredProvider {
  instance: unknown;
  metatype: Function | null;
  token: string | symbol | Function;
  metadata: Record<string | symbol, unknown>;
}
```

**Implementations per runtime:**

- Browser / RN: our own `DiscoveryService` walks the `ContainerResolver`'s
  instance registry, filtering by metadata key from `Reflect.getMetadata()`.
- Worker: same — the `WorkerContainer` builds the same registry at boot from the
  discovered providers.
- NestJS: `NestDiscoveryAdapter` wraps `@nestjs/core`'s `DiscoveryService` +
  `Reflector` and exposes it under `IDiscoveryService`.

Consumers NEVER type-check against `@nestjs/core`'s `DiscoveryService`. Every
consumer types the injection as `IDiscoveryService` from contracts. The Nest
adapter is invisible.

## Module patterns

### Static module

```typescript
@Module({
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

### Dynamic module (forRoot)

```typescript
@Module({})
export class LoggerModule {
  public static forRoot(options: ILoggerConfig): IDynamicModule {
    return {
      module: LoggerModule,
      global: true,
      providers: [
        { provide: LOGGER_CONFIG, useValue: options },
        LoggerManager,
        { provide: LOGGER_MANAGER, useExisting: LoggerManager },
      ],
      exports: [LOGGER_CONFIG, LOGGER_MANAGER],
    };
  }

  public static forRootAsync(
    options: ILoggerModuleAsyncOptions,
  ): IDynamicModule {
    return {
      module: LoggerModule,
      global: true,
      providers: [
        {
          provide: LOGGER_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        LoggerManager,
      ],
      exports: [LOGGER_CONFIG, LoggerManager],
    };
  }
}
```

## Request context (AsyncLocalStorage substitute)

`RequestContext` shape:

```typescript
interface IRequestContext {
  requestId: string;
  correlationId?: string;
  traceId?: string;
  tenantId?: string;
  actorId?: string;
  metadata: Record<string, unknown>;

  child(patch: Partial<IRequestContext>): IRequestContext;
  fork(): IRequestContext;
}
```

Runtime bindings:

- **NestJS server** — `@stackra/container/nestjs`'s `RequestContextMiddleware`
  binds one `IRequestContext` to the request via Node's `AsyncLocalStorage`.
  Every service in the request tree resolves the SAME instance.
- **Cloudflare Worker** — `@stackra/container/worker`'s per-request container
  binds one `IRequestContext` for the fetch handler's lifetime; DO's use their
  own binding. Flushed via `ctx.waitUntil()`.
- **Browser / React Native** — no per-request semantics; a single
  application-lifetime `RequestContext` binds correlation IDs for logs. Tests
  use `MockRequestContext.runWith(ctx, () => { ... })`.

## Auto-registration (per ADR-0092)

`ContainerModule.forRoot()` is exported from `@stackra/container/nestjs`. It's
one of the seven modules `StackraServiceModule` composes.

`ContainerModule.forRoot()` registers:

- `ApplicationContext` singleton
- `NestContainerAdapter` singleton (wraps Nest's container as
  `IContainerResolver`)
- `NestDiscoveryAdapter` singleton (wraps `@nestjs/core`'s DiscoveryService as
  `IDiscoveryService`)
- Token aliases: `CONTAINER`, `APPLICATION_CONTEXT`, `DISCOVERY_SERVICE`
- `Reflector` re-export from `@nestjs/core`

## Testing story

Every consumer of `@stackra/container` in tests uses `TestContainer` from
`@stackra/container/testing`:

```typescript
import { TestContainer } from "@stackra/container/testing";

const container = TestContainer.create({
  modules: [MyModule],
})
  .overrideProvider(UserRepository)
  .useValue(mockUserRepo)
  .overrideDiscovery(mockDiscovery)
  .compile();

const service = await container.get(UserService);
```

For Nest-integrated tests, `@stackra/testing/nest/create-testing-module` already
wraps `@nestjs/testing`'s `Test.createTestingModule()`. `TestContainer` and
`Test.createTestingModule()` are two peers — pick per test scope.

## Dependencies

Runtime peers (all except `@stackra/contracts` optional):

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "reflect-metadata": "catalog:",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
  },
}
```

No runtime deps beyond `reflect-metadata` (browser-safe polyfill loaded via side
effect at package boot).

## Phases

### Phase 1 — Contracts split (2 days)

- [ ] Author `packages/contracts/src/interfaces/container/*.interface.ts` for
      every listed contract (§Contracts split).
- [ ] Author `packages/contracts/src/tokens/container.tokens.ts` with
      `CONTAINER`, `APPLICATION_CONTEXT`, `REQUEST_CONTEXT`,
      `DISCOVERY_SERVICE`.
- [ ] Author `packages/contracts/src/errors/container-*.error.ts`.
- [ ] Bump `@stackra/contracts` to `0.2.0` (minor — additive).

### Phase 2 — Scaffold `packages/container` (1 day)

- [ ] `package.json` with 6 subpath exports (`.`, `./nestjs`, `./react`,
      `./native`, `./worker`, `./testing`).
- [ ] `catalog.json`, `tsconfig.json`, `tsup.config.ts` (6 entries),
      `vitest.config.ts`.
- [ ] `LICENSE`, `README.md` skeleton.
- [ ] `src/core/index.ts` empty barrel.

### Phase 3 — Core runtime (5 days)

- [ ] `ApplicationContext` class + `ContainerResolver` class.
- [ ] `InstanceRegistry` (Map keyed by token).
- [ ] `Module` decorator + `DynamicModule` type.
- [ ] `@Injectable`, `@Inject`, `@Optional`, `@Global` decorators.
- [ ] `Scope` enum + scoped provider handling.
- [ ] `DiscoveryService` core implementation.
- [ ] `RequestContext` core class.
- [ ] Lifecycle hook wiring (`OnModuleInit`, `OnApplicationBootstrap`,
      `OnApplicationShutdown`).
- [ ] `forwardRef` for circular deps.
- [ ] Cross-platform `useInject` / `useOptionalInject` hooks under `core/hooks/`
      (per ADR-0091 §Rule 3).
- [ ] Cross-platform `<ContainerProvider>` under `core/providers/`.

### Phase 4 — NestJS adapter (3 days)

- [ ] `ContainerModule.forRoot()` — registers the seven providers listed under
      §Auto-registration.
- [ ] `NestContainerAdapter` — bridges `@nestjs/core`'s `ModuleRef` to
      `IContainerResolver`.
- [ ] `NestDiscoveryAdapter` — wraps `@nestjs/core`'s `DiscoveryService` +
      `Reflector` as `IDiscoveryService`.
- [ ] `RequestContextMiddleware` — binds `IRequestContext` per request via
      `AsyncLocalStorage`.

### Phase 5 — Worker adapter (3 days)

- [ ] `createWorkerContainer(env, ctx)` — factory that builds a per-request
      container tied to Cloudflare's `env` + `ctx`.
- [ ] `IWorkerEnv` type + env-binding wire-up.
- [ ] `flushOnWaitUntil(container, ctx)` — flushes deferred lifecycle work.
- [ ] Per-request `RequestContext` binding.

### Phase 6 — React + RN subpaths (1 day — mostly re-exports)

- [ ] `src/react/index.ts` — re-exports from `core/`. Web-only additions (if
      needed).
- [ ] `src/native/index.ts` — re-exports from `core/`. RN-only additions (if
      needed).

### Phase 7 — Testing (2 days)

- [ ] `TestContainer.create()` + `.overrideProvider(...)` +
      `.overrideDiscovery(...)` API.
- [ ] `MockDiscoveryService` (records `getProvidersByMetadata` queries + returns
      canned results).
- [ ] `MockRequestContext.runWith(ctx, fn)` — for test isolation.

### Phase 8 — Testing package alignment (1 day)

- [ ] Retire `@stackra/testing/core/container`'s standalone `TestContainer` in
      favor of `@stackra/container/testing`.
- [ ] `@stackra/testing/core/container` becomes a re-export from
      `@stackra/container/testing` (optional peer). If container isn't
      installed, `@stackra/testing/core/container` throws a friendly error
      pointing at the install command.

### Phase 9 — Consumer migration (5 days)

- [ ] `services/approval` — `app.module.ts` imports `ContainerModule` (already
      does implicitly via `StackraServiceModule` — will land when composite
      ships).
- [ ] `packages/logger` — imports `IDiscoveryService` from contracts, drops
      Nest-only discovery.
- [ ] `apps/portal` + `apps/landing-page` — no direct dep (they use React
      hooks); optionally add `<ContainerProvider>` at the root for
      request-context in Refine.

### Phase 10 — Docs + release (2 days)

- [ ] Fill out `README.md` subpath-by-subpath.
- [ ] Author `docs/container/architecture.md`, `discovery.md`,
      `request-context.md`, `nestjs-adapter.md`, `worker-adapter.md`.
- [ ] Changeset `feat(container): initial 0.1.0` per Changesets flow.

**Total estimated effort:** 25 days (5 weeks single-track; 2-3 weeks with
parallelism across core/nest/worker).

## Migration risks

| Risk                                                                                                          | Mitigation                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `reflect-metadata` polyfill order — decorators fail if it loads after them                                    | Side-effect import at the top of `core/index.ts`. Documented + tested.                                                       |
| Nest's `DiscoveryService` uses `providers` array from module metadata; our contract exposes a different shape | `NestDiscoveryAdapter` translates. Contract-side tests verify wire compatibility.                                            |
| Cross-runtime hooks (`useInject`) — React vs React Native differ on Context internals                         | Both use React's public `useContext`; identical semantics on both surfaces.                                                  |
| Worker `AsyncLocalStorage` availability — Cloudflare Workers ship a polyfill via `nodejs_compat`              | Enable `nodejs_compat` flag; document in `worker/README.md`.                                                                 |
| Testing container drift between `@stackra/testing` and `@stackra/container/testing`                           | Phase 8 makes them one surface. Grep asserts `@stackra/testing/core/container` re-exports from `@stackra/container/testing`. |

## Success criteria

- [ ] Six subpath exports build cleanly under `tsup`.
- [ ] `pnpm --filter @stackra/container test` — every test green.
- [ ] `@stackra/logger` compiles when its only DI dep is
      `@stackra/container/nestjs` (proves the adapter shape).
- [ ] `services/approval` boots identically before/after migration.
- [ ] `packages/testing/core/container` re-exports work without breaking
      `packages/contracts` + `packages/logger` tests.
- [ ] Docs cover every subpath's usage pattern.

## Cross-references

- ADR-0090 — Manager pattern (LoggerManager consumes IContainerResolver +
  IDiscoveryService from contracts).
- ADR-0091 — Cross-runtime subpath structure (this package is the reference
  implementation).
- ADR-0092 — Service auto-registration (ContainerModule is one of the seven).
- `.kiro/plans/2026-09-03-logger-package.md` — first downstream consumer.
- `.kiro/plans/2026-09-03-database-package.md` — DI-based ORM injection.
- `.ref/packages/container/stackra-container-architecture-plan.md` §1-88 —
  reference architecture (full text).
- `packages/testing/src/core/container/*.ts` — current testing container that
  Phase 8 unifies.
