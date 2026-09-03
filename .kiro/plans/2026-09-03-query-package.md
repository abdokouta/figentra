---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/query` — server-state query and mutation client

**Status:** Planned  
**Anchor ADRs:** ADR-0091, ADR-0090  
**Depends on:** `@stackra/contracts`, `@stackra/http`, `@stackra/schema`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 15 days across 8 phases

## Purpose

Cross-runtime query/mutation orchestration for remote application state: caching, invalidation, deduplication, optimistic updates, retries, pagination and dependent queries. It is not the domain state store and not an HTTP client.

## Non-goals

- Transport implementation (`@stackra/http`).
- Local reactive state (`@stackra/state`).
- Durable offline replication (`@stackra/sync`).

## Manager pattern

`QueryManager` owns cache/query lifecycles; no backend driver Manager. Cache storage is injected through a narrow query-cache contract.

## Subpath layout

```text
packages/query/
├── src/core/{query.module.ts,client/,cache/,observers/,mutations/,invalidation/,pagination/,errors/,index.ts}
├── src/react/{provider/,hooks/,devtools/,index.ts}
├── src/native/{provider/,hooks/,index.ts}
├── src/worker/{query.module.ts,index.ts}
├── src/nestjs/{query.module.ts,index.ts}
├── src/testing/{query-harness.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/query` owns `IQueryClient`, `IQuery`, `IMutation`, `IQueryCache`, query keys, statuses and `QUERY_CLIENT` token.

## Public API — locked

```ts
interface IQueryClient {
  query<T>(options: IQueryOptions<T>): Promise<T>;
  mutate<T>(options: IMutationOptions<T>): Promise<T>;
  invalidate(keys?: readonly QueryKey[]): void;
  cancel(keys?: readonly QueryKey[]): void;
  clear(): void;
}
```

Query keys are serializable, stable and explicit. Deduplication uses canonical keys and request identity. Optimistic updates require rollback snapshots and are never persisted as authoritative server state.

## Configuration / runtime

Defaults include stale time, cache time, retry policy, request timeout and maximum cache entries/bytes. Browser/RN lifecycle adapters pause/refetch according to app visibility/connectivity; Worker queries are request-scoped and must not rely on mutable process globals.

## Security / tenancy

Cache keys must include tenant/principal scope where data is not globally public. Sensitive responses cannot be persisted in unencrypted browser storage by default. Authorization errors are never retried automatically.

## Errors / recovery / observability

Transient transport errors use bounded retries. Cancellation does not become an error notification. Metrics cover hit/miss, latency, dedupe, retry, invalidation and cache size. No query payload is used as a metric label.

## Persistence / compatibility

Persisted query cache is optional and versioned. Schema changes invalidate incompatible entries. Offline mutation persistence belongs to `@stackra/sync` and is integrated through a contract, not duplicated.

## Testing / conformance

Test cache semantics, stale/refetch, dedupe, cancellation, optimistic rollback, dependent queries, pagination, tenant scoping and lifecycle transitions. React/native hooks have runtime-specific tests; core remains DOM-free.

## Dependencies / exports / versioning

HTTP/schema are injected contracts; React/native/Nest/Worker are subpaths. No transport vendor leaks into root. Public cache/query contracts use semver.

## Phases

1. Contracts/scaffold (2d); 2. query client/cache (3d); 3. mutation/optimistic updates (2d); 4. invalidation/dedupe/retry (2d); 5. pagination/sync bridge (2d); 6. runtime adapters (2d); 7. security/tests/observability (1d); 8. docs/release (1d).

## Exit criteria

Queries are deterministic and deduplicated, mutations have rollback semantics, cache isolation is tenant-safe, cancellation is reliable and runtime adapters share one core contract.

## Cross-references

`2026-09-03-http-package.md`, `2026-09-03-pagination-package.md`, `2026-09-03-sync-package.md`, `2026-09-03-state-package.md`.
