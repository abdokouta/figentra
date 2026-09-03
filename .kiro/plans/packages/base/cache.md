---
status: canonical
component: package
package: "@stackra/cache"
owner: platform
---
# `@stackra/cache` — implementation-complete plan

## Boundary
Cache is ephemeral acceleration and coordination state. It is never the source of truth, never a durable event log, and never a substitute for PostgreSQL or object storage.

## API
```ts
interface CacheStore<V=unknown> {
  get(key:string):Promise<V|null>; set(key:string,value:V,options?:{ttlMs?:number}):Promise<void>;
  delete(key:string):Promise<void>; exists(key:string):Promise<boolean>;
}
interface CacheManager extends CacheStore { wrap<T>(key:string, loader:()=>Promise<T>, options?:WrapOptions):Promise<T>; invalidate(key:string):Promise<void>; invalidatePattern(pattern:string):Promise<number>; }
```
Key builders include `generateKey`, `generateListKey`, `generateViewKey` and canonical request hashing. Serialization is versioned and bounded.

## Provider model
The core is provider-neutral. Redis is the production distributed cache adapter; an in-memory adapter is test/development only and must be explicitly selected. Provider capability metadata identifies TTL, atomic operations, pattern invalidation and distributed locking support.

## Stampede/concurrency
`wrap` supports single-flight within a process and optional distributed lock when the provider supports it. Lock TTLs, wait limits and stale-while-revalidate behavior are explicit. Cache failures never fail a read if the source of truth can safely answer.

## Invalidation
Services define invalidation ownership. Writes update the database first and publish outbox events; consumers invalidate affected keys after commit. Pattern invalidation is restricted because broad scans can overload Redis. Tags/namespaces are preferred.

## Tenancy/security
Key namespaces include service, environment and tenant where the data is tenant-scoped. Keys never contain secrets or raw credentials. Payloads have size limits. Serialization rejects unsupported values rather than silently stringifying them.

## Reliability
Bound TTLs, jitter, maximum value size, connection timeouts, bounded retries for idempotent cache operations and graceful degradation. Redis outage produces cache misses, not durable-data loss.

## Testing
Provider conformance, expiry, serialization, invalidation, stampede protection, lock expiry, outage fallback, tenant-key isolation and high-concurrency access. Test that cache cannot be used as a required dependency for correctness.

## Completion criteria
All cache access uses this API; every key has an owner and schema/version; production uses a real distributed adapter; no application writes arbitrary Redis keys or stores authoritative business state in cache.