---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# `@stackra/search` — provider-neutral indexed search capability

**Status:** Canonical implementation plan

## Ownership

Owns search/index contracts, query normalization, filters, facets, sorting, highlighting, indexing and reindex orchestration. The Search service remains the authoritative business-facing owner of index state and projections; this package is the reusable client/adapter boundary.

## Subpaths

```text
@stackra/search
@stackra/search/meilisearch
@stackra/search/elastic
@stackra/search/algolia
@stackra/search/nestjs
@stackra/search/worker
@stackra/search/testing
```

Provider SDKs are optional peers and never leak through the root export.

## Source layout

```text
src/core/{manager,queries,documents,indexing,filters,facets,errors,index.ts}
src/meilisearch/{driver,index.ts}
src/elastic/{driver,index.ts}
src/algolia/{driver,index.ts}
src/nestjs/{module,health,index.ts}
src/worker/{adapter,index.ts}
src/testing/{mock-search,fixtures,assertions,index.ts}
__tests__/{unit,integration,conformance,runtime,security}/
```

## Locked API

```ts
interface ISearchIndex<TDocument> {
  search(query: ISearchQuery): Promise<ISearchResult<TDocument>>;
  index(document: TDocument): Promise<void>;
  remove(id: string): Promise<void>;
  bulk(operations: readonly IIndexOperation<TDocument>[]): Promise<void>;
  reindex(source: IAsyncDocumentSource<TDocument>): Promise<IReindexReport>;
}
```

## Query and indexing semantics

Filters, sort fields, requested fields, page size and query depth are validated against an index schema. Tenant constraints are injected at the authorization boundary and cannot be removed by ordinary callers. Document IDs are opaque and index operations are idempotent.

The primary database remains the source of truth. Search indexes are disposable projections and are rebuilt through resumable, versioned reindex plans with explicit cutover.

## Security / tenancy

Sensitive attributes are excluded by index schema. Search APIs require the same authenticated context as the owning service. Cross-tenant results are a hard failure. Provider credentials are supplied through secret/config providers and never embedded in index documents.

## Resilience / observability

Provider outages normalize to dependency errors. Retry only transient failures. Bulk operations return item-level failures and support replay. Metrics cover query/index latency, result limits, indexing lag and provider error rate without high-cardinality query labels.

## Testing / phases / exit

All providers run the same conformance suite for search/filter/facet/sort/highlight/index/delete/bulk/reindex. Security tests prove tenant isolation and field exclusion; at least one real provider is required in release acceptance. Implementation order: contracts → query model → manager → providers → indexing/reindex → security → tests/observability → release.

## Exit criteria

No vendor DSL reaches business code; indexes are rebuildable and versioned; tenant isolation is enforced in every adapter; provider implementations satisfy one contract.
