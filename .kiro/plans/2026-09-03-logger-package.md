---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/logger — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference
plan:** `.ref/packages/logger/stackra-logger-architecture-plan.md` (4232 lines)
**Depends on:** `.kiro/plans/2026-09-03-container-package.md`

## Purpose

`@stackra/logger` is the workspace's canonical logging abstraction. Consumers
type against `ILogger` from `@stackra/contracts`; the runtime picks the actual
implementation:

- **Node / NestJS production** — Pino (JSON, high-throughput).
- **Node / NestJS development** — Pino pretty OR Winston (developer preference).
- **Cloudflare Worker** — structured `console.log` (Worker platform captures
  JSON automatically).
- **Browser** — `console.log` (pretty) OR HTTP sink (send to backend).
- **React Native** — `console.log` + optional HTTP sink.

**Origins.** The reference package (`@stackra/ts-logger`) coupled Pino to its
NestJS subpath. This plan DECOUPLES Pino to its own optional subpath, promotes
Winston to first-class parity, and re-uses `@stackra/container`'s
`IDiscoveryService` (per ADR-LOGGER-008 in the reference) so we drop the
package's own runtime-specific discovery scaffolding.

## Non-goals

- OpenTelemetry integration (deferred to a future `@stackra/logger/otel` subpath
  if genuinely needed).
- File rotation, syslog, CloudWatch — every one is a specialised transport that
  belongs behind Winston (via `winston-daily-rotate-file`, `winston-cloudwatch`,
  etc.) or in a future optional subpath.
- Metrics — belongs in `@stackra/telemetry`; the logger emits a `LogWritten`
  event that a metrics consumer can subscribe to.
- Log analytics dashboards — belongs in a separate concern (observability
  service).

## Subpath layout (per ADR-0091)

```
packages/logger/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── channels/                  # ChannelRegistry, Stack channel, Silent channel
│   │   ├── context/                   # LogContext, ContextRepository (cross-runtime shim)
│   │   ├── contexts/                  # React contexts (LoggerContext) — cross-platform
│   │   ├── decorators/                # @LogSink metadata decorator
│   │   ├── discovery/                 # sink loader (consumes IDiscoveryService)
│   │   ├── enrichers/                 # RequestIdEnricher, TenantEnricher
│   │   ├── errors/                    # LoggerConfigError, LoggerRedactionError
│   │   ├── formatters/                # JsonFormatter, PrettyFormatter
│   │   ├── hooks/                     # useLogger, useLoggerChannel — cross-platform
│   │   ├── i18n/                      # no user-facing strings — this package logs, not renders
│   │   ├── interfaces/                # local
│   │   ├── lifecycle/                 # ShutdownService, LoggerFactory
│   │   ├── logger/                    # Logger class, LoggerFactory, LoggerManager
│   │   ├── pipeline/                  # log-entry construction, redaction, formatting
│   │   ├── providers/                 # <LoggerProvider> — cross-platform
│   │   ├── redaction/                 # RedactionEngine, default rules
│   │   ├── sinks/                     # ConsoleSink, EmergencySink, InMemorySink
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── logger.module.ts           # LoggerModule.forRoot + forRootAsync
│   │   ├── services/
│   │   │   ├── nest-logger.service.ts # Nest LoggerService adapter (bridges to ILogger)
│   │   │   └── async-context.repository.ts # AsyncLocalStorage-backed context
│   │   ├── middleware/
│   │   │   └── request-logging.middleware.ts
│   │   ├── interceptors/
│   │   │   └── request-logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── logging-exception.filter.ts
│   │   ├── health/
│   │   │   └── logger.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # web-only (HttpSinkProvider)
│   │   ├── hooks/                     # web-only (useNetworkCapture — optional)
│   │   ├── sinks/                     # HttpSink (fetch-based)
│   │   └── index.ts                   # re-exports core hooks/contexts/providers + web additions
│   │
│   ├── native/
│   │   ├── providers/                 # RN-only (NativeSinkProvider)
│   │   ├── hooks/                     # RN-only (useAppStateLogger — optional)
│   │   ├── sinks/                     # NativeConsoleSink (formatted for RN debugger)
│   │   └── index.ts                   # re-exports core hooks/contexts/providers + RN additions
│   │
│   ├── worker/
│   │   ├── logger.module.ts           # createWorkerLogger(env, ctx)
│   │   ├── context.repository.ts      # Worker-scoped context (per-request)
│   │   ├── sinks/
│   │   │   ├── worker-console.sink.ts
│   │   │   └── queue.sink.ts          # optional — flush to Cloudflare Queue
│   │   ├── waituntil-flush.ts
│   │   └── index.ts
│   │
│   ├── pino/                          # optional peer: pino
│   │   ├── pino.sink.ts               # ILogSink adapter
│   │   ├── pino.factory.ts
│   │   ├── serializers/               # error, request, response
│   │   ├── pino.module.ts             # NestJS DynamicModule that registers PinoSink
│   │   └── index.ts
│   │
│   ├── winston/                       # optional peer: winston
│   │   ├── winston.sink.ts
│   │   ├── winston.factory.ts
│   │   ├── winston.module.ts
│   │   └── index.ts
│   │
│   └── testing/
│       ├── in-memory-sink.ts          # canonical assertion primitive
│       ├── mock-logger.ts             # implements ILogger
│       ├── mock-logger-factory.ts
│       ├── test-logger.ts             # real Logger + InMemorySink + real pipeline
│       ├── testing-module.ts          # NestJS overrideable module
│       ├── context.ts                 # runWithLogContext(ctx, fn)
│       ├── react/                     # <TestLoggerProvider>
│       ├── worker/                    # createWorkerLoggerTestContext()
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

Symbols in `@stackra/contracts`:

| Symbol                  | Kind      |
| ----------------------- | --------- |
| `ILogger`               | interface |
| `ILoggerFactory`        | interface |
| `ILogChannel`           | interface |
| `ILogSink`              | interface |
| `ILogEntry`             | interface |
| `ILogError`             | interface |
| `ILogEnricher`          | interface |
| `ILogFormatter`         | interface |
| `ILogContext`           | interface |
| `ILogContextRepository` | interface |
| `LogLevel` enum         | enum      |
| `LOGGER`                | token     |
| `LOGGER_FACTORY`        | token     |
| `LOGGER_MANAGER`        | token     |
| `LOGGER_CONFIG`         | token     |
| `LOG_CONTEXT`           | token     |
| `LoggerConfigError`     | class     |
| `LoggerRedactionError`  | class     |

`@stackra/logger` `.` exports concrete `Logger`, `LoggerFactory`,
`LoggerManager`, sinks (Console + InMemory + Silent), enrichers, formatters,
redaction engine, and the `LoggerModule` for NestJS integration. The Pino sink
class lives in `/pino`; the Winston sink lives in `/winston`.

## LoggerManager — the driver-manager (per ADR-0090)

`LoggerManager` extends `Manager<ILogChannel>` from `@stackra/support/managers`.
It resolves lazily and caches:

```typescript
@Injectable()
export class LoggerManager extends Manager<ILogChannel> {
  public constructor(
    @Inject(LOGGER_CONFIG) private readonly config: ILoggerConfig,
    @Inject(LOG_CONTEXT_REPOSITORY) private readonly ctx: ILogContextRepository,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService,
  ) {
    super();
  }

  public getDefaultDriver(): string {
    return this.config.default; // e.g. "stack"
  }

  protected createConsoleDriver(): ILogChannel {
    return new ConsoleChannel(this.config.channels.console, this.ctx);
  }

  protected createStackDriver(): ILogChannel {
    // Stack channel dispatches to multiple named channels
    return new StackChannel(this.config.channels.stack, this);
  }

  protected createSilentDriver(): ILogChannel {
    return new SilentChannel();
  }

  protected createInMemoryDriver(): ILogChannel {
    return new InMemoryChannel();
  }

  // Pino / Winston creators live in the /pino + /winston subpaths and register
  // themselves via `manager.extend("pino", () => ...)` at module init.

  public async onModuleInit(): Promise<void> {
    // Discover @LogSink-decorated classes via IDiscoveryService and .extend() them
    if (this.discovery) {
      const sinks = this.discovery.getProvidersByMetadata(
        LOG_SINK_METADATA_KEY,
      );
      for (const sink of sinks) {
        const name = sink.metadata.name as string;
        this.extend(name, () => sink.instance as ILogChannel);
      }
    }
  }
}
```

## Standard channels

Every logger config has a `default` channel + N named channels:

```typescript
LoggerModule.forRoot({
  default: "stack",
  channels: {
    console: { driver: "console", level: "debug", format: "pretty" },
    json: { driver: "console", level: "info", format: "json" },
    file: {
      driver: "pino",
      level: "info",
      target: "pino/file",
      destination: "./logs/app.log",
    },
    stack: {
      driver: "stack",
      channels: ["console", "file"], // fan-out
    },
  },
  redaction: {
    keys: ["password", "authorization", "cookie", "access_token"],
    replacement: "[REDACTED]",
  },
});
```

## Cross-runtime sinks

| Sink                | Home                                  | Runtime                                     |
| ------------------- | ------------------------------------- | ------------------------------------------- |
| `ConsoleSink`       | `core/sinks/console.sink.ts`          | Every runtime                               |
| `InMemorySink`      | `core/sinks/in-memory.sink.ts`        | Every runtime (mostly tests)                |
| `SilentSink`        | `core/sinks/silent.sink.ts`           | Every runtime                               |
| `EmergencySink`     | `core/sinks/emergency.sink.ts`        | Fallback when other sinks throw             |
| `HttpSink`          | `react/sinks/http.sink.ts`            | Browser                                     |
| `NativeConsoleSink` | `native/sinks/native-console.sink.ts` | React Native                                |
| `WorkerConsoleSink` | `worker/sinks/worker-console.sink.ts` | Cloudflare Worker                           |
| `QueueSink`         | `worker/sinks/queue.sink.ts`          | Cloudflare Worker (flush to CF Queue)       |
| `PinoSink`          | `pino/pino.sink.ts`                   | Node / NestJS (production default)          |
| `WinstonSink`       | `winston/winston.sink.ts`             | Node / NestJS (legacy + special transports) |

Consumers importing `@stackra/logger` core get Console + InMemory + Silent +
Emergency by default. `/pino` or `/winston` subpaths REGISTER additional sinks
via `.extend()` when their module is imported.

## Pipeline (locked ordering per §108 of reference plan)

```
application call: logger.info("payment.completed", { paymentId, amount })
        │
        ▼
level filter (early exit if channel level > entry level)
        │
        ▼
entry construction (build ILogEntry with timestamp + level + context)
        │
        ▼
context merge (from LogContextRepository — request/tenant/actor)
        │
        ▼
enrich (RequestIdEnricher, TenantEnricher, custom enrichers)
        │
        ▼
normalize (Error → ILogError, dates → ISO strings, symbols → strings)
        │
        ▼
redact (RedactionEngine — remove sensitive keys)
        │
        ▼
format (per-sink formatter: JSON, pretty, MDC)
        │
        ▼
sink write (Console / Pino / HTTP / Queue — fail-open)
```

Every stage is unit-testable in isolation. `@stackra/testing`'s `InMemorySink`
captures the OUTPUT of the pipeline, giving high-fidelity assertions.

## Auto-registration (per ADR-0092)

`LoggerModule.forRoot` / `forRootAsync` is one of the 7 modules
`StackraServiceModule` composes. It registers:

- `LOGGER_CONFIG` (from options)
- `LoggerManager` singleton
- `LOGGER_MANAGER` token alias
- `LoggerFactory` singleton
- `LOGGER_FACTORY` alias
- `LOGGER` convenience token (resolves to `manager.driver()`)
- `LogContextRepository` (backed by `AsyncLocalStorage` on Node; per-request on
  Worker)
- `NestLoggerServiceAdapter` (so NestJS's built-in `Logger` uses our logger)
- `RequestLoggingMiddleware`
- `RequestLoggingInterceptor`
- `LoggingExceptionFilter`
- `LoggerHealthIndicator`
- The default console + emergency sinks

## Testing story

Every consumer uses one of two APIs:

### `MockLogger` (unit tests)

```typescript
import { createMockLogger } from "@stackra/logger/testing";

const logger = createMockLogger();
service.doThing();
expect(logger.info).toHaveBeenCalledWith("thing.done", { count: 1 });
```

### `InMemorySink` + real pipeline (integration)

```typescript
import { TestLogger } from "@stackra/logger/testing";

const { logger, sink } = TestLogger.create({
  config: {
    default: "test",
    channels: { test: { driver: "in-memory", level: "debug" } },
  },
});

service.doThing();

expect(sink.entries).toContainEqual(
  expect.objectContaining({
    level: "info",
    message: "thing.done",
    meta: expect.objectContaining({
      count: 1,
      requestId: expect.stringMatching(/^req_/),
    }),
  }),
);
```

`TestLogger` uses the REAL pipeline — the same enrichers, redaction, and
formatting production logs go through. Assertions catch real drift.

## Dependencies

Runtime peers (all optional except contracts + support):

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",
    "winston": "^3.13.0",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "pino": { "optional": true },
    "pino-pretty": { "optional": true },
    "winston": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts split (2 days)

- [ ] `packages/contracts/src/interfaces/logger/*.interface.ts` — every listed
      interface.
- [ ] `packages/contracts/src/enums/log-level.enum.ts`.
- [ ] `packages/contracts/src/tokens/logger.tokens.ts`.
- [ ] `packages/contracts/src/errors/logger-*.error.ts`.

### Phase 2 — Scaffold `packages/logger` (1 day)

- [ ] `package.json` with subpath exports (`.`, `./nestjs`, `./react`,
      `./native`, `./worker`, `./pino`, `./winston`, `./testing`).
- [ ] Every manifest per ADR-0091 §Rule 8-9.

### Phase 3 — Core runtime (5 days)

- [ ] `Logger` class + `LoggerFactory`.
- [ ] `LoggerManager extends Manager<ILogChannel>` (per ADR-0090).
- [ ] `ChannelRegistry` (local — not a support base class per §98 of ref plan).
- [ ] `StackChannel` + `SilentChannel` + `InMemoryChannel`.
- [ ] `ConsoleSink` + `InMemorySink` + `SilentSink` + `EmergencySink`.
- [ ] `RedactionEngine` + default rules.
- [ ] `JsonFormatter` + `PrettyFormatter`.
- [ ] `LogContext` + `LogContextRepository` (AsyncLocalStorage-backed).
- [ ] `RequestIdEnricher` + `TenantEnricher`.
- [ ] `Logger.emitLogWritten()` — internal event fired for observability hooks.
- [ ] Cross-platform `useLogger` + `useLoggerChannel` hooks under `core/hooks/`.
- [ ] Cross-platform `<LoggerProvider>` under `core/providers/`.

### Phase 4 — Pino subpath (3 days)

- [ ] `PinoSink implements ILogSink`.
- [ ] Serializers: error, request, response.
- [ ] `PinoModule.forRoot()` — NestJS module that registers `PinoSink` via
      `LoggerManager.extend("pino", () => sink)`.
- [ ] Flush + close lifecycle handled through `OnApplicationShutdown`.

### Phase 5 — Winston subpath (2 days)

- [ ] `WinstonSink implements ILogSink`.
- [ ] `WinstonModule.forRoot()`.
- [ ] Pass-through for arbitrary transports (`winston-cloudwatch`,
      `winston-daily-rotate-file`).

### Phase 6 — NestJS subpath (4 days)

- [ ] `LoggerModule.forRoot()` + `forRootAsync()` — registers everything listed
      under §Auto-registration.
- [ ] `NestLoggerServiceAdapter` — implements Nest's `LoggerService` interface.
- [ ] `AsyncContextRepository` — request-scoped context.
- [ ] `RequestLoggingMiddleware` — attaches `requestId` to context; logs request
      start + response.
- [ ] `RequestLoggingInterceptor` — logs handler-level metadata.
- [ ] `LoggingExceptionFilter` — logs uncaught + Nest exceptions.
- [ ] `LoggerHealthIndicator` — reports sink health.

### Phase 7 — Worker subpath (3 days)

- [ ] `createWorkerLogger(env, ctx)` — factory bound to Worker request scope.
- [ ] Per-request `LogContextRepository`.
- [ ] `WorkerConsoleSink` + `QueueSink`.
- [ ] Flush on `ctx.waitUntil()`.
- [ ] Sensible defaults for `env.LOG_LEVEL` etc.

### Phase 8 — React + RN subpaths (2 days)

- [ ] `HttpSink` under `react/sinks/` (fetch-based, batching, retry).
- [ ] `NativeConsoleSink` under `native/sinks/`.
- [ ] `<LoggerProvider>` compositions under both barrels (re-exporting core).

### Phase 9 — Testing (3 days)

- [ ] `MockLogger` + `createMockLogger()`.
- [ ] `MockLoggerFactory`.
- [ ] `TestLogger.create({ config })` — real pipeline + InMemorySink.
- [ ] `runWithLogContext(ctx, fn)` — test isolation.
- [ ] `testing/react/<TestLoggerProvider>`.
- [ ] `testing/worker/createWorkerLoggerTestContext()`.

### Phase 10 — Consumer migration (3 days)

- [ ] `packages/logger` current codebase → replaced with new package (via
      renaming/moving; not a fresh package).
- [ ] `services/approval` — switch to `LOGGER` from contracts (via
      `StackraServiceModule`).
- [ ] `apps/portal` + `apps/landing-page` — add `<LoggerProvider>` to root.

### Phase 11 — Security hardening (2 days)

- [ ] Default redaction ruleset locked to §120-121 of ref plan.
- [ ] PII redaction hooks (configurable).
- [ ] Redaction test suite (asserts no known-sensitive key leaks).
- [ ] Emergency sink fail-open verification.

### Phase 12 — Docs + release (2 days)

- [ ] Fill `README.md` subpath-by-subpath.
- [ ] `docs/logger/{architecture,drivers,pino,winston,worker,nestjs,react,testing,security,migration}.md`
      (10 docs per §125 of ref plan).
- [ ] Changeset `feat(logger): initial 0.1.0`.

**Total estimated effort:** 32 days (~6 weeks single-track; 3-4 weeks with
parallelism between subpaths).

## Migration risks

| Risk                                                                       | Mitigation                                                                                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Pino not Worker-safe by default                                            | `/pino` subpath is Node-only; `/worker` uses console sink. Documented + tested.                                                               |
| Redaction ordering wrong → sensitive data leaks pre-redaction to sink      | Pipeline stages are ordered explicitly (§108); test covers a `password: "hunter2"` payload survives to `[REDACTED]` before reaching the sink. |
| `AsyncLocalStorage` not available in older Node / RN                       | Node 20+ ships it natively; RN uses a shim under `native/context/`. Documented.                                                               |
| `LoggerManager.onModuleInit` fires before `IDiscoveryService` is populated | Use `OnApplicationBootstrap` instead — after every module init.                                                                               |
| Sink write failure → log storm on retry                                    | `EmergencySink` never recurses through the pipeline; direct write to `console.error`.                                                         |

## Success criteria

- [ ] 8 subpath exports build cleanly (`.`, `/nestjs`, `/react`, `/native`,
      `/worker`, `/pino`, `/winston`, `/testing`).
- [ ] `services/approval` logs identically before/after the migration — verified
      by baseline log-line diff on a canned request.
- [ ] `apps/portal` browser bundle DOES NOT include Pino or Winston
      (tree-shaken).
- [ ] `TestLogger` + `InMemorySink` catches every enricher's contribution in the
      output.
- [ ] Redaction test suite passes on every branch.
- [ ] Worker sink flushes via `ctx.waitUntil()` in the smoke test.

## Cross-references

- ADR-0090 — Manager pattern (LoggerManager is Shape A canonical example).
- ADR-0091 — Cross-runtime subpaths (this package uses every subpath).
- ADR-0092 — Service auto-registration (LoggerModule is one of the seven).
- `.kiro/plans/2026-09-03-container-package.md` — dependency.
- `.kiro/plans/2026-09-03-database-package.md` — sibling.
- `.kiro/steering/logging-standards.md` — will land alongside this package.
- `.ref/packages/logger/stackra-logger-architecture-plan.md` §1-153 — reference
  architecture (full text).
