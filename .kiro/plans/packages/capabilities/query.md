---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# `@stackra/query` — server-state query and mutation capability

**Status:** Canonical implementation plan

## Ownership

Owns remote-state query/mutation orchestration: cache lifecycle, stale/refetch rules, deduplication, invalidation, optimistic mutation rollback, cancellation and query observers. It does not own HTTP transport, local application state or durable offline replication.

## Subpaths

```text
@stackra/query
@stackra/query/react
@stackra/query/react-native
@stackra/query/nestjs
@stackra/query/worker
@stackra/query/testing
```

Runtime/provider dependencies are isolated behind subpaths. Root is runtime-neutral.

## Source layout

```text
src/core/{client,cache,queries,mutations,invalidation,pagination,observers,errors,index.ts}
src/react/{provider,hooks,index.ts}
src/react-native/{provider,hooks,index.ts}
src/nestjs/{module,index.ts}
src/worker/{module,index.ts}
src/testing/{harness,mocks,assertions,index.ts}
__tests__/{unit,integration,conformance,runtime,security}/
```

## Locked API

```ts
interface IQueryClient {
  query<T>(options: IQueryOptions<T>): Promise<T>;
  mutate<T>(options: IMutationOptions<T>): Promise<T>;
  invalidate(keys?: readonly QueryKey[]): void;
  cancel(keys?: readonly QueryKey[]): void;
  clear(): void;
}
```

Keys are stable serializable values. Query state transitions are deterministic. Optimistic mutations retain rollback snapshots and never become authoritative server state.

## Architecture

The query client depends on an injected transport/query-cache contract. HTTP belongs to `@stackra/http`; persistence belongs to `@stackra/storage`; offline mutation queues belong to `@stackra/sync`. Deduplication is keyed by canonical query identity, with bounded in-flight work.

## Security/tenancy

Tenant and principal context forms part of cache identity whenever data is not globally public. Authorization failures are not blindly retried. Sensitive persisted cache is disabled by default unless secure storage is explicitly configured.

## Resilience/performance

Every query has timeout, retry budget, stale time and cache retention limits. Cancellation propagates to the transport. Cache size and observer counts are bounded to prevent memory exhaustion.

## Observability

Measure cache hit/miss, dedupe, latency, retries, cancellations, invalidations and error classes. Do not emit query payloads as metric labels.

## Testing

Conformance covers stale/refetch, dedupe, invalidation, cancellation, optimistic rollback, pagination, dependent queries, tenant isolation and lifecycle behavior. Runtime tests verify React/RN subscription semantics and Worker request scoping.

## Persistence/compatibility

Persisted query cache is optional, versioned and disposable. Incompatible cache schema versions are invalidated. No business record is sourced from query cache.

## Phases / exit criteria

Contracts → core client/cache → mutations → invalidation/retry → runtime subpaths → conformance/security/observability → release.

Exit requires deterministic remote-state behavior, safe tenant cache keys, bounded resource use and one shared contract across all runtime integrations.
