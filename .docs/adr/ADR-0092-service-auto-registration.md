---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# ADR-0092 — Service auto-registration

**Status:** Accepted
**Date:** 2026-09-03
**Supersedes:** —
**Superseded by:** —

## Context

Every backend service in the workspace (currently `services/approval`, planned
`services/identity`, `services/commerce`, `services/notifications`,
`services/observability`, `services/platform`, `services/api`, `services/ai`)
needs the SAME infrastructure wired up before it can serve a single request:

- Config loading (per `@stackra/config`)
- DI container primitives (per `@stackra/container`)
- Logger + request-scoped log context (per `@stackra/logger`)
- Registry-service integration (planned `@stackra/registry` for capability
  registration, health reporting, service-mesh service identity)
- Health indicators (`/health`, `/ready`, `/live`)
- Structured error filter
- Request-context repository (correlation IDs, tenant IDs, actor IDs)

Today, every service's `app.module.ts` imports these one-by-one:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    LoggerModule.forRootAsync({ useFactory: (cfg) => cfg.get("logger"), inject: [ConfigService] }),
    ContainerModule.forRoot(),
    RegistryModule.forRoot({ ... }),
    HealthModule,
    ErrorFilterModule,
    RequestContextModule,
    // ... 5-10 more infrastructure imports
    ApprovalModule, // ← the domain module — the actual service
  ],
})
export class AppModule {}
```

Three problems:

1. **Copy-paste drift.** A new service ships with 5 of the 10 imports because
   nobody remembered `HealthModule` or `RequestContextModule`.
2. **Bootstrapping order.** Config MUST load before Logger; Container MUST
   initialise before anything that resolves through it. Every consumer
   re-implements the order.
3. **Ergonomics.** The pattern EVERY service wants is: "give me a working
   `AppModule` with the platform infrastructure loaded — I'll add my domain
   modules." The workspace should ship that as one import.

## Decision

**Every `@stackra/*`-based backend service imports `StackraServiceModule` from
`@stackra/nest-service`, which composes every platform infrastructure module in
the correct order. Domain-specific service imports come after.**

### The composite module

```typescript
// packages/nest-service/src/nest-service.module.ts
import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule } from "@stackra/config/nestjs";
import { LoggerModule } from "@stackra/logger/nestjs";
import { ContainerModule } from "@stackra/container/nestjs";
import { RegistryModule } from "@stackra/registry/nestjs";
import { HealthModule } from "@stackra/health/nestjs";
import { RequestContextModule } from "@stackra/request-context/nestjs";
import { ErrorFilterModule } from "@stackra/error-filter/nestjs";
import type { IServiceOptions } from "./interfaces/service-options.interface";

@Module({})
export class StackraServiceModule {
  public static forRoot(options: IServiceOptions): DynamicModule {
    return {
      module: StackraServiceModule,
      global: true,
      imports: [
        // ── Order matters ────────────────────────────────────
        // 1. Config first — everyone else depends on it.
        ConfigModule.forRoot({
          isGlobal: true,
          load: options.config.load,
        }),

        // 2. Container next — publishes tokens the rest use.
        ContainerModule.forRoot({
          resolveViaNest: true,
          ...options.container,
        }),

        // 3. Request context — creates the AsyncLocalStorage the logger + registry read.
        RequestContextModule.forRoot({
          headerName: options.requestContext?.headerName ?? "x-request-id",
          propagate: options.requestContext?.propagate ?? true,
        }),

        // 4. Logger — reads config + request context.
        LoggerModule.forRootAsync({
          useFactory: (cfg) => cfg.get("logger"),
          inject: ["CONFIG"],
        }),

        // 5. Registry — needs logger + config; publishes service identity.
        RegistryModule.forRoot({
          serviceName: options.service.name,
          serviceVersion: options.service.version,
          capabilities: options.service.capabilities ?? [],
          identity: options.service.identity,
        }),

        // 6. Health — probes downstream deps + reports to registry.
        HealthModule.forRoot({
          indicators: options.health?.indicators ?? [],
          endpoints: options.health?.endpoints ?? {
            live: "/live",
            ready: "/ready",
            health: "/health",
          },
        }),

        // 7. Error filter — catches every uncaught rejection + serialises consistently.
        ErrorFilterModule.forRoot(),
      ],
      exports: [
        ConfigModule,
        ContainerModule,
        RequestContextModule,
        LoggerModule,
        RegistryModule,
        HealthModule,
        ErrorFilterModule,
      ],
    };
  }
}
```

Every backend service becomes:

```typescript
// services/approval/src/app.module.ts
import { Module } from "@nestjs/common";
import { StackraServiceModule } from "@stackra/nest-service";
import approvalConfig from "./config/approval.config";
import approvalCapabilities from "./capabilities";
import { ApprovalModule } from "./approval.module";

@Module({
  imports: [
    StackraServiceModule.forRoot({
      service: {
        name: "approval",
        version: "0.1.0",
        capabilities: approvalCapabilities,
        identity: process.env.APPROVAL_SERVICE_IDENTITY!,
      },
      config: { load: [approvalConfig] },
    }),
    ApprovalModule,
  ],
})
export class AppModule {}
```

Two imports. Ten lines. Every infrastructure module wired in the correct order.

### Options shape (locked)

```typescript
// packages/nest-service/src/interfaces/service-options.interface.ts
export interface IServiceOptions {
  service: {
    name: string;
    version: string;
    capabilities?: readonly string[];
    identity?: string;
  };
  config: {
    load: readonly (() => Record<string, unknown>)[];
  };
  container?: Partial<IContainerModuleOptions>;
  requestContext?: {
    headerName?: string;
    propagate?: boolean;
  };
  health?: {
    indicators?: readonly Type<IHealthIndicator>[];
    endpoints?: { live?: string; ready?: string; health?: string };
  };
}
```

### Why NOT an opt-out flag per module

Some services might not need `HealthModule` (the AI service is stdio-driven).
The tempting shape is:

```typescript
StackraServiceModule.forRoot({
  disable: ["health", "registry"],
  ...
})
```

**We reject this.** Reasoning:

- The set of "modules a service might disable" is a moving target — every
  disable flag is more branching.
- Every module IS an infrastructure concern. Disabling `HealthModule` means the
  service can't announce itself dead. There's no benign disable.
- Services that genuinely can't ship a Nest server (Python `services/ai`)
  aren't `@stackra/nest-service` consumers at all.

Consequence: **`StackraServiceModule.forRoot()` is monolithic — you get every
infrastructure module or you don't use it.** A service that needs a subset
composes the individual modules manually.

### Escape hatch for advanced consumers

For a service that needs a subset OR needs to override a specific submodule's
options, the individual modules are still exported. `StackraServiceModule` is a
convenience; the modules under it remain independently importable.

```typescript
// Advanced — for the rare service that needs custom logger wiring
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    ContainerModule.forRoot(),
    RequestContextModule.forRoot(),
    LoggerModule.forRootAsync({ /* custom shape */ }),
    RegistryModule.forRoot({ /* custom shape */ }),
    // No HealthModule, no ErrorFilterModule
    MyDomainModule,
  ],
})
export class AppModule {}
```

### Auto-registration boundary

`StackraServiceModule` covers ONLY the NestJS runtime. Cloudflare Workers
compose a parallel `StackraWorkerFactory` from `@stackra/worker-service` that
wires the same 7 concerns for the Worker request lifecycle (Wrangler env
bindings → ContainerModule → RequestContext → Logger → Registry → Health-worker
route → ExecutionContext.waitUntil() flush). Python services do NOT participate;
they compose their own bootstrapping via `stackra-python` (out of scope for this
ADR).

### What ships in the composite (planned Q4 2026)

| Module                     | Status                | Source                          |
| -------------------------- | --------------------- | ------------------------------- |
| `@stackra/config`          | Planned Q4 2026       | `@nestjs/config` wrapper        |
| `@stackra/container`       | Planned Q4 2026       | Per `.kiro/plans/2026-09-03-container-package.md` |
| `@stackra/logger`          | Planned Q4 2026       | Per `.kiro/plans/2026-09-03-logger-package.md`    |
| `@stackra/registry`        | Planned Q4 2026       | Per ADR-0021 gateway-registry-security-kernel |
| `@stackra/health`          | Planned Q4 2026       | Wraps `@nestjs/terminus`        |
| `@stackra/request-context` | Planned Q4 2026       | AsyncLocalStorage wrapper       |
| `@stackra/error-filter`    | Planned Q4 2026       | Uncaught rejection + Nest exception filter |
| `@stackra/nest-service`    | Composite shipped LAST | Ships this ADR's `StackraServiceModule` |

## Rationale

- **Zero-friction service authoring.** New service = one import + one import.
  No wiring order, no forgotten modules.
- **Config → Container → RequestContext → Logger → Registry → Health → ErrorFilter
  is the canonical order.** Codifying it means every service boots identically.
- **The composite doesn't hide the modules.** They're all still individually
  imported for the rare consumer that needs a custom subset.
- **Discoverable via TypeScript.** `IServiceOptions` is the whole surface;
  IDE autocomplete tells the author what's configurable.
- **Reviewable in one file.** Every wire-up decision lives in
  `@stackra/nest-service/src/nest-service.module.ts`. Change the order once,
  every service picks it up.
- **Matches how large Nest apps are structured externally.** NestJS's own
  `@nestjs/terminus`, `@nestjs/config`, `@nestjs/microservices` all compose via
  `forRoot()`. Adding a workspace-composite is idiomatic.

## Alternatives considered

### Alternative 1 — Per-service copy-paste

Every service's `app.module.ts` imports the 7-10 modules by hand.

**Rejected because:**

- Copy-paste drift (documented above).
- Bootstrap order forgotten.
- Version bumps require touching N services.

### Alternative 2 — A scaffolding-time template

`stackra new service <name>` generates a service with the imports pre-populated
from a template. No runtime dep on `@stackra/nest-service`.

**Rejected because:**

- Doesn't solve version drift — once generated, the imports are frozen at
  generation time.
- Adds a maintenance layer (the template) that ages independently of the
  modules.
- Doesn't help the 7 existing services that already exist.

### Alternative 3 — Feature-flag opt-out per module

`StackraServiceModule.forRoot({ disable: ["health"] })`.

**Rejected because:** (see §"Why NOT an opt-out flag per module" above).

### Alternative 4 — Manual composition with a shared config helper

Ship a `getInfrastructureModules(opts)` FUNCTION returning an array of module
imports:

```typescript
@Module({
  imports: [
    ...getInfrastructureModules({ service: {...}, config: {...} }),
    ApprovalModule,
  ],
})
```

**Rejected because:**

- Loses the DynamicModule identity — you can't `@Global()` a spread.
- Consumers still see 10 imports in the array — no cognitive win.
- `forRoot()` is the workspace idiom; a function-returning-array breaks
  consistency.

## Consequences

### Positive

- One import composes 7 infrastructure modules with the correct order + shared
  config.
- New services drop `StackraServiceModule.forRoot(...)` into `app.module.ts`
  and immediately have config + logger + container + request context +
  registry + health + error filter working.
- Bumping the composite version updates every service's infrastructure at once
  (dep bump only).
- The composite is the enforcement surface — reviewers reject services that
  wire infrastructure by hand.

### Negative

- Circular-import risk if `StackraServiceModule` and any of its constituents
  end up co-dependent. Enforced by review: constituents MUST NOT import
  `@stackra/nest-service`.
- New infrastructure modules land in the composite's next release; a service
  that needs it early must manually add the import until the composite catches
  up.
- Version-bumping the composite bumps every service's transitive dep tree.
  Managed via Changesets.

### Neutral

- The composite lives in `packages/nest-service/` — workspace-standard shape,
  workspace-standard `catalog.json`, workspace-standard subpath layout (only
  `.` + `./testing`).

## Enforcement

Reviewers verify per-service:

1. `app.module.ts` imports `StackraServiceModule.forRoot(...)` — not the
   individual constituent modules — unless a documented deviation applies.
2. Deviating services carry an inline comment naming the reason (e.g.
   "custom logger sinks required for compliance") + link to a spec / ADR.
3. `services/*/package.json` declares `@stackra/nest-service` as a `dependency`.
4. `services/*/src/main.ts` bootstraps `AppModule` via `NestFactory.create()`
   with the Fastify adapter (per ADR-0082) + does NOT re-wire infrastructure.

## Cross-references

- ADR-0090 — Manager/driver pattern (LoggerModule + friends use it).
- ADR-0091 — Cross-runtime package structure (each constituent ships `.` +
  `/nestjs` subpaths).
- ADR-0082 — Gateway NestJS + Fastify (service HTTP layer).
- ADR-0021 — Gateway/registry security kernel (RegistryModule).
- `.kiro/plans/2026-09-03-container-package.md` — first consumer of the pattern.
- `.kiro/plans/2026-09-03-logger-package.md` — first consumer.
- `.kiro/plans/2026-09-03-workspace-standardization.md` — the parent workspace
  plan.
