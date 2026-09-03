---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# ADR-0090 — Manager + MultipleInstanceManager pattern for driver-based packages

**Status:** Accepted **Date:** 2026-09-03 **Supersedes:** — **Superseded by:** —

## Context

Several `@stackra/*` packages need to expose one API to consumers while
supporting multiple swappable back-end implementations behind it:

| Package               | Concern               | Swappable back-ends                           |
| --------------------- | --------------------- | --------------------------------------------- |
| `@stackra/logger`     | Log write pipeline    | `console`, `pino`, `winston`, `queue`, `http` |
| `@stackra/cache`      | Cache reads/writes    | `memory`, `redis`, `valkey`, `d1-kv`          |
| `@stackra/queue`      | Job producer          | `nats-jetstream`, `sqs`, `cloudflare-queue`   |
| `@stackra/storage`    | Blob/object storage   | `r2`, `s3`, `azure-blob`, `filesystem`        |
| `@stackra/http`       | Named HTTP clients    | Per-config `{ baseURL, timeout, headers }`    |
| `@stackra/monitoring` | Metric/error fan-out  | `sentry`, `datadog`, `console`                |
| `@stackra/analytics`  | Product-event fan-out | `posthog`, `mixpanel`, `segment`, `console`   |

Two shapes recur:

1. **Single active driver (channel switch).** The consumer picks one active
   driver by name at any moment. Every subsequent call uses it. Example: the
   default logger channel is `stack`; a caller MAY switch to `pino` for a
   sub-block.
2. **Named instances (multi-connection).** The consumer registers N named
   instances, each with its own driver + config. Example: `cache('users')` and
   `cache('sessions')` may both use Redis but hit different DBs;
   `queue('emails')` and `queue('notifications')` may use different SQS queues.

Laravel solved this with `Illuminate\Support\Manager` (single) and
`Illuminate\Support\MultipleInstanceManager` (multi). Our support package ships
canonical TypeScript ports at `@stackra/support/managers`. The question is: do
NestJS packages inherit those base classes, or do we lean on NestJS-native
`DynamicModule.forFeature()` factory-provider patterns instead?

## Decision

**Every `@stackra/*` driver-based package composes on the abstract Manager base
classes from `@stackra/support/managers`, exposed through a NestJS
`DynamicModule` façade.** The Manager is the runtime resolver; the module is the
DI adapter.

### Two shapes, two base classes

**Shape A — single active driver.** Use `Manager<TDriver>`. Applies when:

- The consumer configures ONE default driver and MAY temporarily switch it per
  call site.
- There's no notion of "named instances" — the driver IS the identity.
- Examples: `LoggerManager` (log channels), `AuthManager` (auth guards),
  `NotificationManager` (notification channels).

```typescript
// packages/logger/src/core/logger.manager.ts
import { Manager } from "@stackra/support/managers";
import type { ILogChannel } from "@stackra/contracts";
import type { ILoggerConfig } from "../interfaces/logger-config.interface";

@Injectable()
export class LoggerManager extends Manager<ILogChannel> {
  public constructor(
    @Inject(LOGGER_CONFIG) private readonly config: ILoggerConfig,
  ) {
    super();
  }

  public getDefaultDriver(): string {
    return this.config.default; // e.g. "stack"
  }

  protected createConsoleDriver(): ILogChannel {
    return new ConsoleChannel(this.config.channels.console);
  }

  protected createPinoDriver(): ILogChannel {
    return new PinoChannel(this.config.channels.pino);
  }

  protected createStackDriver(): ILogChannel {
    return new StackChannel(this.config.channels.stack, this);
  }
}
```

**Shape B — named instances.** Use `MultipleInstanceManager<TInstance>`. Applies
when:

- The consumer configures N named instances, each with independent config.
- The name IS the identity — same driver can back multiple instances.
- Examples: `CacheManager` (N stores), `QueueManager` (N connections),
  `HttpManager` (N clients), `StorageManager` (N buckets).

```typescript
// packages/cache/src/core/cache.manager.ts
import { MultipleInstanceManager } from "@stackra/support/managers";
import type { ICacheStore } from "@stackra/contracts";

@Injectable()
export class CacheManager extends MultipleInstanceManager<ICacheStore> {
  public constructor(
    @Inject(CACHE_CONFIG) private readonly config: ICacheConfig,
  ) {
    super();
  }

  public getDefaultInstance(): string {
    return this.config.default;
  }

  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return this.config.stores[name] ?? null;
  }

  protected createRedisDriver(config: IRedisStoreConfig): ICacheStore {
    return new RedisStore(config);
  }

  protected createMemoryDriver(config: IMemoryStoreConfig): ICacheStore {
    return new MemoryStore(config);
  }
}
```

### NestJS DynamicModule façade

Every driver-based package ships a `<Name>Module.forRoot()` /
`<Name>Module.forRootAsync()` pair. The module:

1. Registers a config-token provider (`LOGGER_CONFIG`, `CACHE_CONFIG`, ...)
   bound to the caller's config object.
2. Registers the Manager class as a singleton provider.
3. Registers a **token alias** so consumers `@Inject(LOGGER_MANAGER)` receives
   the `LoggerManager` instance.
4. Optionally registers a **convenience alias** for the default driver so
   `@Inject(LOGGER)` yields `manager.driver()`.

```typescript
// packages/logger/src/core/logger.module.ts
@Module({})
export class LoggerModule {
  public static forRoot(options: ILoggerConfig): DynamicModule {
    return {
      module: LoggerModule,
      global: true,
      providers: [
        { provide: LOGGER_CONFIG, useValue: options },
        LoggerManager,
        { provide: LOGGER_MANAGER, useExisting: LoggerManager },
        {
          provide: LOGGER,
          useFactory: (mgr: LoggerManager) => mgr.driver(),
          inject: [LoggerManager],
        },
      ],
      exports: [LOGGER_CONFIG, LOGGER_MANAGER, LOGGER, LoggerManager],
    };
  }

  public static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
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
        { provide: LOGGER_MANAGER, useExisting: LoggerManager },
        {
          provide: LOGGER,
          useFactory: (mgr: LoggerManager) => mgr.driver(),
          inject: [LoggerManager],
        },
      ],
      exports: [LOGGER_CONFIG, LOGGER_MANAGER, LOGGER, LoggerManager],
    };
  }
}
```

### Adding a driver from outside the package

Two extension points:

1. **Compile-time — subclass the Manager.** Rare; useful when a consuming app
   wants an app-specific `create{Foo}Driver()` method compiled into its class.
2. **Runtime — `manager.extend(name, creator)`.** The standard path; the
   consumer registers a factory function that produces the driver on first
   `driver(name)` / `instance(name)` call.

```typescript
// In a consuming NestJS service's OnModuleInit hook:
this.loggerManager.extend("datadog", () => new DatadogChannel(config));
this.cacheManager.extend("dynamo", (cfg) => new DynamoStore(cfg));
```

Custom creators take priority over convention-based `create{Studly}Driver()`
methods.

### Naming convention (locked)

| Token / Class shape              | Example                         | Notes                                                             |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| Config token                     | `LOGGER_CONFIG`                 | SCREAMING_SNAKE. Bound by `forRoot`.                              |
| Manager token                    | `LOGGER_MANAGER`                | Alias for the class token.                                        |
| Manager class                    | `LoggerManager`                 | Extends `Manager<T>` or `MultipleInstanceManager<T>`.             |
| Default-driver convenience token | `LOGGER`                        | Optional. Resolves via `manager.driver()` / `manager.instance()`. |
| Driver interface                 | `ILogChannel`                   | Owned by `@stackra/contracts`.                                    |
| Concrete driver classes          | `ConsoleChannel`, `PinoChannel` | Live in the owning package. NEVER exported from contracts.        |
| Driver factory method            | `create<Studly>Driver`          | Convention read by `Manager` via `Str.studly()`.                  |

## Rationale

- **One pattern for a whole class of problems.** Logger, cache, queue, storage,
  http, monitoring, analytics all share the shape. A shared base class ends the
  N-ways-to-do-the-same-thing tax.
- **Laravel developers recognise it instantly.** The workspace's ORM,
  service-provider, and event-bus already borrow Laravel semantics; adopting the
  same shape for driver managers keeps the mental model consistent.
- **NestJS-idiomatic where it needs to be.** The `DynamicModule.forRoot()` +
  token-alias façade is what every other NestJS module in the workspace does
  (`ConfigModule`, `MikroOrmModule`, `LoggerModule`).
- **Lazy + cached + extendable — for free.** The base classes give us lazy
  instantiation (first-call resolves the driver, subsequent calls return the
  cache) and runtime `.extend()` without every package rewriting the same
  bookkeeping.
- **Convention over configuration where safe.** `create{Studly}Driver` naming +
  `Str.studly` resolution means most drivers register themselves through their
  method name; only exotic drivers need explicit `.extend()`.

## Alternatives considered

### Alternative 1 — Pure NestJS factory providers, no base class

```typescript
providers: [
  {
    provide: LOGGER,
    useFactory: (config: ILoggerConfig) => {
      switch (config.default) {
        case "console": return new ConsoleChannel(config);
        case "pino": return new PinoChannel(config);
        ...
      }
    },
    inject: [LOGGER_CONFIG],
  },
]
```

**Rejected because:**

- Every package reinvents the switch/dispatch.
- No lazy instantiation — every driver constructs at module init even if unused.
- No runtime `.extend()` — third-party drivers need module re-registration.
- No cache — a helper wanting "the same instance next time" writes its own.
- No shape parity — every package's `useFactory` looks different.

### Alternative 2 — `DynamicModule.forFeature()` per driver

```typescript
LoggerModule.forRoot({ default: "pino" }),
LoggerModule.forFeature({ driver: "console", options: { ... } }),
LoggerModule.forFeature({ driver: "pino", options: { ... } }),
```

**Rejected because:**

- Verbose at consumer sites.
- Drivers are effectively singletons keyed by name; a `forFeature` per driver
  makes them look like feature modules (they aren't).
- Doesn't cover the "runtime `.extend()` from a service's `onModuleInit`" case,
  which is the standard for third-party drivers.

### Alternative 3 — Adopt `nestjs-console`-style plugin registries

Full plugin/registry systems (Convoy-style publisher list, NestJS
`DiscoveryService` sweep, etc.).

**Rejected because:** it's overkill for the driver-swap problem. Registries pull
their weight where the SET of consumers is unknown at boot (webhooks,
subscribers). Drivers are a KNOWN closed set with a KNOWN default.

## Consequences

### Positive

- Every driver-based `@stackra/*` package looks identical from the outside:
  `Module.forRoot({ default, channels/stores/connections })`.
- New drivers land in one file per driver + one line in the Manager's
  `create{Name}Driver`.
- Runtime `.extend()` gives consuming apps a clean path to add third-party
  drivers without forking.
- Test doubles: overriding `LOGGER_MANAGER` with a `MockManager` swaps every
  channel in one call.

### Negative

- Consumers must know that `manager.driver()` (single) vs `manager.instance()`
  (multi) is the API — the two Managers deliberately don't share method names.
  Docblocks + package README mitigate.
- Runtime `.extend()` creators bypass the convention naming, so grepping for
  `create<X>Driver` won't find dynamically-registered drivers. Documented
  explicitly.

### Neutral

- Every driver-based package has TWO peer dependencies: `@stackra/contracts`
  (interfaces) + `@stackra/support` (Manager base classes). Confirmed as
  workspace-standard.

## Enforcement

Reviewers verify:

- Any `@stackra/*` package with 2+ swappable back-ends extends `Manager<T>` or
  `MultipleInstanceManager<T>` from `@stackra/support/managers`.
- No hand-rolled `switch (driver)` dispatch inside a `Module.forRoot()`
  `useFactory`.
- Manager class file names end in `.manager.ts`; live under `src/core/`.
- Driver interfaces (`ILogChannel`, `ICacheStore`, ...) live in
  `@stackra/contracts`, never in the owning package.

## Cross-references

- [`.kiro/steering/state-storage-coordinator-standard.md`](../../.kiro/steering/state-storage-coordinator-standard.md)
  — the frontend three-lane rule that already leans on Manager pattern.
- `.ref/packages/support/src/managers/manager.ts` — canonical `Manager<T>`.
- `.ref/packages/support/src/managers/multiple-instance-manager.ts` — canonical
  `MultipleInstanceManager<T>`.
- ADR-0091 — Cross-runtime package structure (paired rule for React/RN/Worker
  packages).
- ADR-0092 — Service auto-registration (LoggerModule + friends auto-import).
- `.kiro/plans/2026-09-03-logger-package.md` — first consumer.
- `.kiro/plans/2026-09-03-container-package.md` — DI substrate.
