---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/health — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/health/` (`@stackra/nestjs-health` v0.1.0) **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/logger`,
`@stackra/support`, `@nestjs/terminus`

## Purpose

`@stackra/health` is the workspace's canonical health-check module. Enterprise
requirements day one:

- **Kubernetes probes** — `/live` (liveness), `/ready` (readiness), `/health`
  (aggregate). Match the exact spec Kubernetes checks against.
- **Auto-discovery of indicators** — `@HealthIndicator("db")`-decorated classes
  auto-register via `IDiscoveryService`.
- **Pluggable result stores** — in-memory (dev), database (persistent history),
  Redis (shared across replicas).
- **Scheduling** — indicators run on interval (via `@stackra/scheduler` future
  dep OR internal setInterval).
- **Alerting hooks** — degraded/failing status routes to
  `@stackra/notifications` (planned).
- **CLI** — `health:check`, `health:list`, `health:test`.
- **Cross-runtime** — Node/NestJS gets full `terminus` integration; Cloudflare
  Worker exposes `/health` route via `@stackra/routing`.

## Non-goals

- Full APM (that's `@stackra/monitoring` planned).
- Kubernetes operator (that's DevOps concern).
- Log aggregation (that's `@stackra/logger`).

## Package pattern — NOT driver-manager

Health is not a "swap driver" concern — you always run ALL registered
indicators. But the RESULT STORE is swappable (in-memory / DB / Redis) — a mini
Manager<T> pattern lives internally for stores, exposed as
`healthConfig.store = "in-memory" | "database" | "redis"`.

## Subpath layout (per ADR-0091)

Reference already has FLAT layout under `src/` (no core/). Reorganise:

```
packages/health/
├── src/
│   ├── core/
│   │   ├── commands/                  # from .ref
│   │   ├── constants/                 # HEALTH_* metadata keys
│   │   ├── decorators/                # @HealthIndicator, @HealthProbe
│   │   ├── errors/
│   │   ├── factories/
│   │   ├── indicators/                # from .ref: disk, event-loop-lag, memory, process-uptime
│   │   ├── interfaces/
│   │   ├── registries/                # IndicatorRegistry
│   │   ├── services/                  # HealthService, IndicatorLoader, HealthScheduler
│   │   ├── stores/                    # in-memory, database, redis (from .ref)
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── health.module.ts           # NestModule wrapping @nestjs/terminus
│   │   ├── controllers/               # HealthController (auto-routes /live, /ready, /health)
│   │   ├── indicators/                # NestJS-specific indicators (database via MikroORM, http, memory)
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── health.module.ts
│   │   ├── indicators/
│   │   │   ├── kv-store.indicator.ts
│   │   │   ├── d1.indicator.ts
│   │   │   └── external-fetch.indicator.ts
│   │   ├── health.route.ts            # binds fetch handler to /live, /ready, /health
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-indicator.ts
│       ├── mock-health-service.ts
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol               | Kind      |
| -------------------- | --------- |
| `IHealthIndicator`   | interface |
| `IHealthResult`      | interface |
| `IHealthReport`      | interface |
| `IHealthResultStore` | interface |
| `IHealthProbe`       | interface |
| `HealthStatus` enum  | enum      |
| `HEALTH_SERVICE`     | token     |
| `HEALTH_CONFIG`      | token     |
| `HealthCheckError`   | class     |

## Core API

```typescript
interface IHealthIndicator {
  readonly key: string; // "database.postgres", "cache.redis"
  readonly critical: boolean; // fails aggregate if this fails
  check(): Promise<IHealthResult>;
}

interface IHealthResult {
  status: HealthStatus; // ok | degraded | failing
  message?: string;
  meta?: Record<string, unknown>;
  latencyMs?: number;
  timestamp: string;
}

interface IHealthReport {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  indicators: Record<string, IHealthResult>;
  failing: string[];
  degraded: string[];
}

enum HealthStatus {
  Ok = "ok",
  Degraded = "degraded",
  Failing = "failing",
}
```

## Standard indicators (ported from .ref + extended)

**Core (runtime-agnostic):**

- `MemoryIndicator` — process memory usage (Node) or `performance.memory`
  (browser).
- `EventLoopLagIndicator` — Node event-loop lag histogram.
- `ProcessUptimeIndicator` — process uptime + last-restart.

**Node/NestJS (extended):**

- `DiskSpaceIndicator` — from .ref.
- `DatabaseIndicator` — MikroORM connection health.
- `HttpIndicator` — pings a URL, expects 2xx.
- `RedisIndicator` — via `@stackra/redis`.

**Worker (new):**

- `KvStoreIndicator` — reads a canary key from `env.KV`.
- `D1Indicator` — `SELECT 1` on `env.DB`.
- `ExternalFetchIndicator` — probes a downstream service (like `HttpIndicator`).

## `@HealthIndicator` decorator + auto-discovery

```typescript
@HealthIndicator({
  key: "database.postgres",
  critical: true,
  timeout: 5000,
  intervalMs: 30_000,
})
@Injectable()
export class PostgresHealthIndicator implements IHealthIndicator {
  public constructor(
    @Inject(DATABASE) private readonly db: IDatabaseConnection,
  ) {}

  public async check(): Promise<IHealthResult> {
    const start = Date.now();
    await this.db.raw("SELECT 1");
    return {
      status: HealthStatus.Ok,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }
}
```

`IndicatorLoader` (via `IDiscoveryService`) auto-registers every
`@HealthIndicator`-decorated class at `OnApplicationBootstrap`.

## Result stores

Same shape as `Manager<T>` internally — one active store at a time:

- `InMemoryResultStore` — Map keyed by indicator key; ring buffer of last N
  results per indicator.
- `DatabaseResultStore` — persists history in the health-results table (via
  `@stackra/database`).
- `RedisResultStore` — TTL-scoped keys per indicator; shared across replicas.

Config picks one:

```typescript
HealthModule.forRoot({
  store: "in-memory",              // or "database" | "redis"
  indicators: [ ... ],              // auto-discovery preferred
  probes: {
    liveness: ["memory", "event-loop-lag"],       // critical: process alive
    readiness: ["database.postgres", "cache.redis"], // ready to serve
  },
  schedule: {
    intervalMs: 30_000,             // default check interval
    perIndicator: { "external.http": 60_000 }, // overrides
  },
});
```

## Kubernetes probes

Three canonical endpoints:

- `GET /live` — 200 if the process is running; 503 if any liveness indicator
  fails. Kubernetes restarts on 503.
- `GET /ready` — 200 if ready to serve traffic; 503 if any readiness indicator
  fails. Kubernetes removes from service on 503.
- `GET /health` — aggregate report with every indicator's status.
  Human-readable.

Every response has consistent JSON:

```json
{
  "status": "ok",
  "timestamp": "2026-09-03T14:22:00Z",
  "uptime": 3600,
  "indicators": {
    "memory": { "status": "ok", "latencyMs": 1 },
    "database.postgres": { "status": "ok", "latencyMs": 12 }
  },
  "failing": [],
  "degraded": []
}
```

Cloudflare Worker health route implemented via `@stackra/routing` (planned):

```typescript
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const container = createWorkerContainer(env, ctx);
    const health = container.get<IHealthService>(HEALTH_SERVICE);
    const url = new URL(request.url);
    if (url.pathname === "/live") return health.livenessResponse();
    if (url.pathname === "/ready") return health.readinessResponse();
    if (url.pathname === "/health") return health.healthResponse();
    // ... app routes
  },
} satisfies ExportedHandler<IEnv>;
```

## Scheduling

`HealthScheduler` runs each indicator on its own `intervalMs`. First check
happens at boot; subsequent every `intervalMs`. Results stored in configured
`IHealthResultStore` — API endpoints return LAST CACHED result (avoids blocking
on every request).

## Alerting hooks (planned)

Health-service emits events on status transitions:

- `health.indicator.recovered` — was failing → now ok.
- `health.indicator.degraded` — was ok → now degraded.
- `health.indicator.failing` — was ok/degraded → now failing.

Downstream `@stackra/notifications` subscribes and dispatches alerts.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "@nestjs/terminus": "catalog:nestjs",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "@nestjs/terminus": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

- [ ] Contracts split.
- [ ] `packages/health/` scaffold, 4 subpaths (`.`, `/nestjs`, `/worker`,
      `/testing`).
- [ ] Rename from `@stackra/nestjs-health` → `@stackra/health`.

### Phase 2 — Core (3 days)

- [ ] Port core indicators (memory, event-loop-lag, process-uptime, disk).
- [ ] `IndicatorRegistry`, `IndicatorLoader` (via DiscoveryService).
- [ ] `HealthService` w/ report aggregation.
- [ ] 3 result stores (in-memory, database, redis).
- [ ] `@HealthIndicator` + `@HealthProbe` decorators.
- [ ] `HealthScheduler`.

### Phase 3 — NestJS (2 days)

- [ ] `HealthModule.forRoot()`.
- [ ] `HealthController` auto-routes `/live`, `/ready`, `/health`.
- [ ] NestJS-specific indicators (MikroORM DB, HTTP, Redis).
- [ ] `@nestjs/terminus` compat.

### Phase 4 — Worker (2 days)

- [ ] `HealthModule.forRoot()` (Worker variant).
- [ ] Worker indicators (KV, D1, external fetch).
- [ ] `health.route.ts` — binds fetch handler.

### Phase 5 — Testing (1 day)

- [ ] `MockIndicator`, `MockHealthService`.

### Phase 6 — Docs + release (2 days)

**Total effort:** 12 days.

## Success criteria

- [ ] 4 subpath exports build cleanly.
- [ ] `/live` responds 200 in <10ms.
- [ ] `/ready` returns 503 when a readiness indicator fails.
- [ ] Auto-discovery: every `@HealthIndicator` class shows in `/health`.
- [ ] Scheduler runs each indicator on its `intervalMs`.
- [ ] Redis result store shares state across 2 replicas.

## Cross-references

- ADR-0091, 0092.
- `.kiro/plans/2026-09-03-database-package.md` — DatabaseIndicator.
- `.kiro/plans/2026-09-03-redis-package.md` — Redis health + result store.
- `.ref/packages/health/` — reference (4 indicators, 3 stores).
