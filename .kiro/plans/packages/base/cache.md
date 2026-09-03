---
status: canonical
component: package
package: "@stackra/cache"
---
# `@stackra/cache` — implementation plan

Ephemeral cache abstraction for read acceleration, request/view/list keys, invalidation and stampede control. Cache is never authoritative durable storage.

## API
`CacheStore`, `CacheManager`, `get/set/delete`, TTL, tags/invalidation, pattern invalidation where supported, `wrap`, key builders and serialization contracts. Providers implement explicit capabilities.

## Reliability
Misses and cache outages fall back to source of truth when safe; bounded TTLs, size limits, jitter and stampede protection are mandatory. Never make correctness depend on cache availability.

## Security/tenancy
Tenant-aware key builders, namespace isolation, no secrets in keys, payload-size limits and safe serialization.

## Testing
Provider conformance, expiry, invalidation, stampede, outage fallback, serialization and tenant-key isolation.

## Exit criteria
One cache abstraction with real production adapters and clear separation from `@stackra/storage` and database persistence.
