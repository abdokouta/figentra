---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/redis — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/redis/` — has ioredis + upstash backends, event transport, Lua
scripts, cache backend **Depends on:** `@stackra/container`,
`@stackra/contracts`, `@stackra/support`, `@stackra/logger`, `@stackra/events`

## Purpose

`@stackra/redis` is the workspace's canonical Redis client + Redis-adjacent
infrastructure. Enterprise requirements day one:

- **Dual backends** — `ioredis` (self-hosted Redis / Valkey / Upstash-Redis wire
  protocol; Node-only), `@upstash/redis` (HTTP-based, Worker-safe, serverless).
- **Runtime selection** — Node/NestJS → ioredis; Cloudflare Worker →
  upstash-http.
- **Pub/Sub** — cross-process event transport via Redis pub/sub channels.
- **Cache backend** — `RedisCacheStore` implements `ICacheStore` (registers with
  `@stackra/cache` via `.extend("redis", ...)`).
- **Distributed locks** — `IDistributedLock` primitive via Redlock or SET-NX.
- **Rate limiter** — token-bucket + sliding-window rate limiters using Lua
  scripts.
- **Streams (XADD/XREAD)** — for high-throughput async processing (adjacent to
  `@stackra/queue`).
- **BullMQ backend** — provides connection for `@stackra/queue`'s BullMQ
  connector.
- **Lua scripts** — pre-registered scripts for common atomic ops
  (increment-if-below, add-with-ttl).
- **Sentinel + Cluster** — production readiness for HA + horizontal scale.
- **Observability** — connection state, command latency histogram, error rate.
- **Multi-database** — Redis DB 0-15 selection per named connection.

## Non-goals

- Redis-native full-text search (RediSearch) — separate optional subpath future
  work.
- Time-series DB (RedisTimeSeries) — same.
- Graph (RedisGraph) — same.

## Manager pattern — Manager (Shape A per ADR-0090)

`RedisManager extends Manager<IRedisConnection>` — Shape A because most
applications use ONE active Redis connection. Multiple named connections use
`MultipleInstanceManager`; both shapes offered but Manager is default.

Actually — for the enterprise case (main + cache + queue + rate-limit
connections), Shape B is more common. **Locked:
`MultipleInstanceManager<IRedisConnection>`**.

```typescript
RedisModule.forRoot({
  default: "primary",
  connections: {
    primary: {
      driver: "ioredis",
      host: "redis-primary.example.com",
      port: 6379,
      db: 0,
      password: "…",
      tls: true,
    },
    cache: {
      driver: "ioredis",
      host: "redis-primary.example.com",
      port: 6379,
      db: 1,
    },
    queue: {
      driver: "ioredis",
      host: "redis-primary.example.com",
      port: 6379,
      db: 2,
    },
    edge: {
      driver: "upstash-http",
      url: "https://usw2-XXX.upstash.io",
      token: "…",
    },
  },
});
```

## Subpath layout (per ADR-0091)

```
packages/redis/
├── src/
│   ├── core/
│   │   ├── redis.module.ts
│   │   ├── backends/                  # (from .ref: index.ts, ioredis/, upstash/)
│   │   │   ├── ioredis/
│   │   │   │   └── ioredis.backend.ts
│   │   │   └── upstash/
│   │   │       └── upstash-http.backend.ts
│   │   ├── cache/                     # (from .ref) RedisCacheStore
│   │   ├── commands/                  # CLI: redis:ping, redis:flush, redis:info
│   │   ├── constants/
│   │   ├── decorators/                # @InjectRedis(name)
│   │   ├── errors/                    # RedisConnectionError, LockAcquisitionError
│   │   ├── interfaces/
│   │   ├── manager/                   # RedisManager
│   │   ├── observability/             # (from .ref) connection health + latency
│   │   ├── scripts/                   # (from .ref) Lua scripts
│   │   ├── tags/                      # (from .ref) tag support for cache
│   │   ├── transport/                 # (from .ref) redis-event-transport (pub/sub)
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── ioredis/                       # NEW — split ioredis into its own subpath (Node-only)
│   │   ├── ioredis.backend.ts
│   │   ├── cluster.factory.ts
│   │   ├── sentinel.factory.ts
│   │   └── index.ts
│   │
│   ├── upstash/                       # NEW — Worker-safe upstash subpath
│   │   ├── upstash-http.backend.ts
│   │   ├── upstash-cache-adapter.ts
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── redis.module.ts
│   │   ├── health/
│   │   │   └── redis.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/                         # rarely used (browser -> upstash HTTP for cache-only?)
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── redis.module.ts            # Worker-scoped upstash client
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-redis.ts              # in-memory backend for tests
│       ├── redis-testcontainer.ts     # spins up real Redis via testcontainers
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                 | Kind            |
| ---------------------- | --------------- |
| `IRedisBackend`        | interface       |
| `IRedisConnection`     | interface       |
| `IRedisManager`        | interface       |
| `IDistributedLock`     | interface       |
| `IRedisPubSub`         | interface       |
| `IRedisStream`         | interface       |
| `REDIS_MANAGER`        | token           |
| `REDIS_CONNECTION`     | token (default) |
| `REDIS_PUBSUB`         | token           |
| `REDIS_LOCK`           | token           |
| `RedisConnectionError` | class           |
| `LockAcquisitionError` | class           |

## Core API (locked)

```typescript
interface IRedisConnection {
  // Basic KV
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: ISetOptions): Promise<boolean>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;

  // Atomic
  incr(key: string): Promise<number>;
  incrby(key: string, by: number): Promise<number>;
  decr(key: string): Promise<number>;

  // Hashes, Sets, Lists (subset)
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;

  // Lua
  eval<T>(script: string, keys: string[], args: string[]): Promise<T>;
  evalSha<T>(sha: string, keys: string[], args: string[]): Promise<T>;
  scriptLoad(script: string): Promise<string>;

  // Pipeline / transactions
  multi(): IRedisPipeline;
  pipeline(): IRedisPipeline;

  // Introspection
  ping(): Promise<string>;
  info(section?: string): Promise<string>;
  dbsize(): Promise<number>;
  flushdb(): Promise<void>;

  // Connection lifecycle
  disconnect(): Promise<void>;
  isReady(): boolean;
}
```

## Backends

| Backend        | Home                              | Runtime       | Deps                        |
| -------------- | --------------------------------- | ------------- | --------------------------- |
| `ioredis`      | `ioredis/ioredis.backend.ts`      | Node          | `ioredis`                   |
| `upstash-http` | `upstash/upstash-http.backend.ts` | Node + Worker | `@upstash/redis`            |
| `memory`       | `testing/mock-redis.ts`           | Every         | None (in-process Map + TTL) |

Backend selection per named connection:

- `ioredis` — Node/Nest self-hosted or managed Redis (Valkey, Elasticache).
- `upstash-http` — serverless / Worker-safe (HTTP transport).
- `memory` — tests + local dev.

## Cluster + Sentinel (ioredis backend)

For HA production:

```typescript
RedisModule.forRoot({
  connections: {
    primary: {
      driver: "ioredis",
      mode: "cluster",
      nodes: [
        { host: "redis-1", port: 6379 },
        { host: "redis-2", port: 6379 },
        { host: "redis-3", port: 6379 },
      ],
      clusterOptions: { scaleReads: "slave" },
    },
    "primary-sentinel": {
      driver: "ioredis",
      mode: "sentinel",
      sentinels: [{ host: "sentinel-1", port: 26379 }],
      name: "mymaster",
    },
  },
});
```

## Pub/Sub — event transport

`RedisEventTransport` (from .ref) wraps Redis pub/sub for cross-process event
fan-out. Distinct from `@stackra/events` (in-process). Used by
`@stackra/realtime` for cross-server relay.

```typescript
const transport = manager.connection("primary").pubsub();

await transport.subscribe("user.created", (payload) => {
  logger.info("user created remotely", payload);
});

await transport.publish("user.created", { userId: "123" });
```

## Distributed lock

```typescript
const lock = manager.connection().lock("user:123:update", { ttl: 30_000 });
await lock.acquire();
try {
  // exclusive critical section
} finally {
  await lock.release();
}
```

Backed by Redlock algorithm (single-instance version by default; multi-node
Redlock for HA on cluster mode).

## Cache backend registration

At `OnApplicationBootstrap`, `RedisModule` extends `CacheManager` if it's
present:

```typescript
@Injectable()
export class RedisCacheStoreRegistrar implements OnApplicationBootstrap {
  public constructor(
    @Inject(REDIS_MANAGER) private readonly redis: IRedisManager,
    @Optional() @Inject(CACHE_MANAGER) private readonly cache?: ICacheManager,
  ) {}

  public onApplicationBootstrap(): void {
    if (!this.cache) return;
    this.cache.extend("redis", (config: IRedisCacheStoreConfig) => {
      const conn = this.redis.connection(config.connection);
      return new RedisCacheStore(conn, config);
    });
  }
}
```

So `@stackra/cache` consumers who install `@stackra/redis` get a `redis` driver
automatically. Optional peer link — either package works alone.

## Rate limiter

```typescript
const limiter = redis.rateLimiter({
  key: "user:123",
  limit: 100,
  windowMs: 60_000,
  algorithm: "sliding-window", // or "token-bucket"
});

const { allowed, remaining, retryAfterMs } = await limiter.tryAcquire();
```

Implemented via Lua scripts (in `core/scripts/`) — atomic, single round-trip.

## Health indicator

`RedisHealthIndicator` reports per connection:

- Ping latency (p50, p99).
- Connection state (`ready`, `connecting`, `end`, `error`).
- Number of clients (`INFO clients`).
- Used memory (`INFO memory`).
- Version.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@stackra/cache": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "ioredis": "^5.6.0",
    "@upstash/redis": "^1.35.0",
  },
  "peerDependenciesMeta": {
    "@stackra/cache": { "optional": true },
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "ioredis": { "optional": true },
    "@upstash/redis": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

### Phase 2 — Port from .ref (3 days)

- [ ] Copy backends (ioredis, upstash).
- [ ] Copy scripts (Lua).
- [ ] Copy cache backend.
- [ ] Copy event transport.
- [ ] Copy tags support (for cache tag flush).

### Phase 3 — Manager alignment (1 day)

- [ ] Refactor to `MultipleInstanceManager<IRedisConnection>`.
- [ ] Multi-connection config.

### Phase 4 — Add missing features (3 days)

- [ ] `IDistributedLock` implementation (Redlock-flavored).
- [ ] Rate limiter (sliding-window + token-bucket Lua scripts).
- [ ] Cluster + Sentinel factories.
- [ ] Multi-database support.

### Phase 5 — NestJS + Worker (2 days)

- [ ] `RedisModule.forRoot()` NestJS.
- [ ] `RedisModule.forRoot()` Worker (upstash-only).
- [ ] `RedisHealthIndicator`.

### Phase 6 — Cache/Events auto-registration (1 day)

- [ ] `RedisCacheStoreRegistrar` — `.extend("redis", ...)` when `@stackra/cache`
      present.
- [ ] `RedisEventTransportRegistrar` — for cross-service events.

### Phase 7 — Testing (2 days)

- [ ] `MockRedis` in-memory backend.
- [ ] Testcontainers integration for real Redis in CI.

### Phase 8 — Docs + Release (2 days)

**Total effort:** 16 days.

## Success criteria

- [ ] 7 subpath exports build cleanly.
- [ ] ioredis backend supports standalone + cluster + sentinel.
- [ ] Upstash backend works in Worker via HTTP.
- [ ] Cache round-trip via `.extend("redis", ...)` works.
- [ ] Pub/Sub round-trip across two processes verified.
- [ ] Distributed lock acquires + releases under contention.
- [ ] Rate limiter enforces 100/min in stress test.
- [ ] Cluster failover: one node down → operations still succeed.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/plans/2026-09-03-cache-package.md` — Redis cache store.
- `.kiro/plans/2026-09-03-queue-package.md` — BullMQ Redis backend.
- `.kiro/plans/2026-09-03-realtime-package.md` — Redis pub/sub for cross-server
  relay.
- `.ref/packages/redis/` — reference (dual backends + all features).
