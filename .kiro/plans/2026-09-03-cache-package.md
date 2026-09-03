---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/cache — architecture plan

**Status:** Planned
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md)
**Reference:** `.ref/packages/cache/` (`@stackra/cache` v0.1.0)
**Depends on:** `@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support` (Manager base), `@stackra/storage` (for storage-backed
store), `@stackra/redis` (for redis-backed store — optional peer)

## Purpose

`@stackra/cache` is the workspace's canonical caching abstraction. Consumers
type against `ICacheStore` from `@stackra/contracts`; the runtime picks the
actual implementation per named instance:

- **Node / NestJS server** — Memory (LRU) OR Redis-backed (via
  `@stackra/redis`).
- **Cloudflare Worker** — Cloudflare Cache API OR KV OR Durable Object.
- **Browser** — localStorage-backed OR IndexedDB-backed OR in-memory.
- **React Native** — AsyncStorage-backed OR in-memory.

Enterprise-grade features required day one:

- **Tag-based invalidation** — flush every key tagged with `user:123` in one
  call (already codified in `.ref/packages/cache/src/core/tags/`).
- **TTL + sliding expiration** per key.
- **LRU eviction** for bounded memory stores.
- **Namespace prefixing** — every cache is namespace-scoped so tenants
  can't collide.
- **Stale-while-revalidate** — return stale value + refresh in background.
- **Serialisation** — pluggable serializer (JSON default; MessagePack
  optional).
- **Multi-tier** — memory-first, fall through to Redis, transparent to
  callers.
- **Metrics** — hits, misses, evictions, latency histograms.
- **Warm-up** — cache warming decorators for critical paths.

## Non-goals

- CDN edge caching (that's Cloudflare's job at the platform layer).
- Full CQRS read-model store (that's `@stackra/database`).
- Full-text search cache (that's `@stackra/redis/search` or `Meilisearch`).

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

`CacheManager extends MultipleInstanceManager<ICacheStore>` — Shape B because a
single service usually needs multiple named caches (`users`, `sessions`,
`rate-limit`, `feature-flags`), each with independent config.

```typescript
CacheModule.forRoot({
  default: "memory",
  stores: {
    memory: { driver: "memory", maxItems: 1000, defaultTtl: 300 },
    sessions: { driver: "redis", connection: "primary", prefix: "sess:", defaultTtl: 3600 },
    users: { driver: "redis", connection: "primary", prefix: "user:", defaultTtl: 900 },
    rateLimit: { driver: "memory", maxItems: 10_000, defaultTtl: 60 },
  },
});
```

Runtime usage:

```typescript
@Injectable()
export class SessionService {
  public constructor(@Inject(CACHE_MANAGER) private readonly cache: ICacheManager) {}

  public async get(id: string): Promise<ISession | null> {
    return this.cache.instance("sessions").get<ISession>(id);
  }
}
```

## Subpath layout (per ADR-0091)

```
packages/cache/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── cache.module.ts            # DynamicModule.forRoot + forFeature (NestJS-shape only? no — cross-runtime; forRoot alias per runtime)
│   │   ├── commands/                  # CLI: cache:clear, cache:stats
│   │   ├── constants/                 # CACHE_* metadata keys
│   │   ├── decorators/                # @Cacheable, @CacheEvict, @CachePut, @CacheKey
│   │   ├── errors/                    # CacheKeyError, CacheStoreError, SerializationError
│   │   ├── hooks/                     # useCache (cross-platform React hook — via core)
│   │   ├── interfaces/                # local
│   │   ├── services/                  # CacheManager, CacheInterceptor
│   │   ├── stores/                    # memory.store.ts, null.store.ts, storage.store.ts
│   │   ├── tags/                      # tag-set.ts, tagged-cache.ts
│   │   ├── types/
│   │   ├── utils/                     # key-hasher.ts, serializer.ts (JSON default)
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── cache.module.ts            # thin wrapper adding NestJS discovery + @Cacheable interceptor
│   │   ├── interceptors/              # method-level caching via @Cacheable
│   │   ├── health/
│   │   │   └── cache.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # <CacheProvider> — cross-platform (from core)
│   │   ├── hooks/                     # useCache (cross-platform) + useSWR-style useCachedQuery
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── cache.module.ts
│   │   ├── stores/
│   │   │   ├── worker-cache-api.store.ts   # Cloudflare Cache API
│   │   │   ├── worker-kv.store.ts          # env.KV binding
│   │   │   └── durable-object.store.ts     # DO-backed for cross-request state
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-cache.ts               # implements ICacheStore w/ Map
│       ├── mock-cache-manager.ts
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

## Contracts split

Contracts symbols (in `@stackra/contracts`):

| Symbol                    | Kind      |
| ------------------------- | --------- |
| `ICacheStore`             | interface |
| `ICacheManager`           | interface |
| `ICacheOptions`           | interface |
| `ITaggedCache`            | interface |
| `ITagSet`                 | interface |
| `ICacheSerializer`        | interface |
| `CACHE_MANAGER`           | token     |
| `CACHE_CONFIG`            | token     |
| `CacheKeyError`           | class     |
| `CacheStoreError`         | class     |

## Core API (locked)

```typescript
interface ICacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: ICacheOptions): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;

  // Multi-key operations
  many<T>(keys: string[]): Promise<Record<string, T | null>>;
  setMany<T>(entries: Array<[string, T, ICacheOptions?]>): Promise<void>;

  // Atomic operations
  increment(key: string, by?: number): Promise<number>;
  decrement(key: string, by?: number): Promise<number>;
  remember<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>;
  rememberForever<T>(key: string, factory: () => Promise<T>): Promise<T>;

  // Tag support (via TaggedCache facade)
  tags(...names: string[]): ITaggedCache;

  // Introspection
  getPrefix(): string;
  ttl(key: string): Promise<number | null>;
}

interface ICacheOptions {
  ttl?: number;              // seconds
  tags?: readonly string[];  // for tag-based invalidation
  sliding?: boolean;         // reset TTL on every access
  namespace?: string;        // override store's default namespace
}
```

## Stores (drivers)

| Driver             | Home                                        | Runtime         | Deps                        |
| ------------------ | ------------------------------------------- | --------------- | --------------------------- |
| `memory`           | `core/stores/memory.store.ts`               | Every runtime   | None (LRU via `lru-cache`)  |
| `null`             | `core/stores/null.store.ts`                 | Every runtime   | None (no-op)                |
| `storage`          | `core/stores/storage.store.ts`              | Browser + RN    | `@stackra/storage`          |
| `worker-cache-api` | `worker/stores/worker-cache-api.store.ts`   | Cloudflare      | Native `caches` API         |
| `worker-kv`        | `worker/stores/worker-kv.store.ts`          | Cloudflare      | env.KV binding              |
| `durable-object`   | `worker/stores/durable-object.store.ts`     | Cloudflare      | DO binding                  |
| `redis`            | (from `@stackra/redis/cache`)              | Node + Worker   | `@stackra/redis`            |

`@stackra/cache` itself DOES NOT depend on `@stackra/redis` — the Redis-backed
store lives inside `@stackra/redis/cache` and registers itself via
`CacheManager.extend("redis", (cfg) => new RedisCacheStore(cfg, redisClient))`.
Consumers who need Redis install both packages.

## Tag-based invalidation

Ported directly from `.ref/packages/cache/src/core/tags/`. Tags are stored
separately from values so `cache.tags("user:123").flush()` removes every key
tagged with `user:123`:

```typescript
await cache.tags("user:123", "org:456").put("profile", data, 300);
await cache.tags("user:123").flush(); // removes every key tagged user:123
```

Implementation: TagSet writes tag-reference keys under
`<prefix>:tag:<tagName>` pointing at set of value-keys. `flush()` reads +
deletes every referenced key + the tag-reference itself. Atomic in Redis via
`MULTI`; best-effort in Memory + Storage.

## Decorators (NestJS + framework-tier)

- `@Cacheable(options)` — method-level cache. Auto-generates key from
  method + args (via `keyHasher`). Interceptor reads/writes cache before/after
  the method runs.
- `@CacheEvict(options)` — evicts the entry when the method returns.
- `@CachePut(options)` — always runs the method + writes the return value.
- `@CacheKey(fn)` — override the auto-generated key.

Decorators ship in `core/decorators/`; the NestJS Interceptor in
`nestjs/interceptors/cacheable.interceptor.ts` wires them into Nest's
`APP_INTERCEPTOR` pipeline.

## Stale-while-revalidate

`cache.remember(key, ttl, factory, { staleWhileRevalidate: true })` returns the
cached value even if stale, then triggers a background refresh. The stale
window defaults to `ttl / 4`. Used by `@Cacheable` under
`{ staleWhileRevalidate: true }`.

## Multi-tier composition

```typescript
CacheModule.forRoot({
  default: "tiered",
  stores: {
    tiered: {
      driver: "tiered",
      tiers: ["memory", "redis"], // read memory first; write both; evict memory on redis-miss
      tierConfig: {
        memory: { maxItems: 1000, defaultTtl: 60 },
        redis: { connection: "primary", defaultTtl: 3600 },
      },
    },
    memory: { driver: "memory", ... },
    redis: { driver: "redis", ... },
  },
});
```

`TieredStore` is an `ICacheStore` composing N inner stores. `get` walks in
order, `set` writes to all, `delete` removes from all.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/storage": "workspace:*",
    "@stackra/redis": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "lru-cache": "^11.0.0"
  },
  "peerDependenciesMeta": {
    "@stackra/storage": { "optional": true },
    "@stackra/redis": { "optional": true },
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true }
  }
}
```

## Phases

### Phase 1 — Contracts split (1 day)

- [ ] `packages/contracts/src/interfaces/cache/*.interface.ts`.
- [ ] `packages/contracts/src/tokens/cache.tokens.ts`.
- [ ] `packages/contracts/src/errors/cache-*.error.ts`.

### Phase 2 — Scaffold `packages/cache/` (1 day)

Manifests per ADR-0091. 5 subpath exports.

### Phase 3 — Core runtime (4 days)

- [ ] `CacheManager extends MultipleInstanceManager<ICacheStore>`.
- [ ] `MemoryStore` (LRU-backed via `lru-cache`), `NullStore`, `StorageStore`.
- [ ] `TaggedCache` + `TagSet`.
- [ ] `TieredStore`.
- [ ] `Cacheable`, `CacheEvict`, `CachePut`, `CacheKey` decorators.
- [ ] JSON serializer + pluggable serializer contract.
- [ ] Key-hasher (SHA-256 of method + args).
- [ ] `remember` / `rememberForever`.
- [ ] `useCache` cross-platform hook.

### Phase 4 — NestJS subpath (2 days)

- [ ] `CacheModule.forRoot()` + `forRootAsync()`.
- [ ] `CacheableInterceptor` registered as `APP_INTERCEPTOR`.
- [ ] `CacheHealthIndicator` — reports per-store health.
- [ ] Discovery loader for `@Cacheable`-decorated methods.

### Phase 5 — Worker subpath (2 days)

- [ ] `WorkerCacheApiStore` — wraps `caches.default`.
- [ ] `WorkerKvStore` — wraps `env.KV`.
- [ ] `DurableObjectStore` — DO-backed for shared state.

### Phase 6 — React + RN subpaths (1 day)

- [ ] `<CacheProvider>` composition.
- [ ] `useCachedQuery(key, fetcher, options)` — SWR-style hook.
- [ ] RN uses `StorageStore` backed by `AsyncStorage`.

### Phase 7 — Testing (1 day)

- [ ] `MockCacheStore` + `MockCacheManager`.
- [ ] `createInMemoryCache()` for tests.

### Phase 8 — Consumer migration + docs (2 days)

- [ ] Migrate any current `services/approval` cache usage.
- [ ] `README.md` + `docs/cache/{architecture,stores,tags,decorators}.md`.
- [ ] Changeset `feat(cache): initial 0.1.0`.

**Total estimated effort:** 14 days.

## Success criteria

- [ ] 5 subpath exports build cleanly.
- [ ] `MemoryStore` LRU behaviour verified with 10k-item bench.
- [ ] `@Cacheable` decorator round-trips a method result through cache.
- [ ] `cache.tags("x").flush()` removes every tagged key.
- [ ] Worker Cache API store passes Miniflare smoke test.
- [ ] `RedisStore` (from `@stackra/redis/cache`) plugs in via `.extend()`.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/plans/2026-09-03-redis-package.md` — sibling; Redis cache store.
- `.kiro/plans/2026-09-03-storage-package.md` — sibling; storage backing.
- `.ref/packages/cache/` — reference implementation.
