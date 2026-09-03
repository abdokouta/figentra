---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/search` — indexed search abstraction

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/schema`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 15 days across 8 phases

## Purpose

Unified typed search API for full-text search, filters, facets, sorting, highlighting, pagination, indexing and reindexing. Search providers are replaceable without leaking vendor query syntax into application code.

## Non-goals

- Source-of-truth persistence; database remains authoritative.
- Arbitrary SQL/DSL exposure.
- Search UI.

## Manager pattern

`SearchManager extends MultipleInstanceManager<ISearchIndex>`; each named index has provider, schema and consistency policy.

## Subpath layout

```text
packages/search/
├── src/core/{search.module.ts,manager/,queries/,documents/,indexing/,filters/,facets/,registries/,errors/,index.ts}
├── src/meilisearch/{driver.ts,index.ts}
├── src/elastic/{driver.ts,index.ts}
├── src/algolia/{driver.ts,index.ts}
├── src/nestjs/{search.module.ts,health/,index.ts}
├── src/worker/{driver.ts,index.ts}
├── src/testing/{mock-search.ts,fixtures/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/search` owns `ISearchIndex`, `ISearchManager`, `ISearchQuery`, `ISearchResult`, `IFacet`, `IIndexer` and `SEARCH_MANAGER`.

## Public API — locked

```ts
interface ISearchIndex<TDocument> {
  search(query: ISearchQuery): Promise<ISearchResult<TDocument>>;
  index(document: TDocument): Promise<void>;
  remove(id: string): Promise<void>;
  bulk(operations: readonly IIndexOperation<TDocument>[]): Promise<void>;
  reindex(source: IAsyncDocumentSource<TDocument>): Promise<IReindexReport>;
}
```

Index mappings are derived from versioned schemas. Query filters are allowlisted and validated before reaching a provider.

## Discovery / configuration

Index definitions may be discovered, then registered exactly once. Provider configuration validates endpoint, credentials, index name, shard/replica settings where applicable, query limits and timeout. Credentials come from config/secret providers.

## Security

Search endpoints are not trusted. Query depth, filter count, page size and requested fields are bounded. Tenant filters are injected at the authorization boundary and cannot be removed by ordinary application queries. Sensitive fields are excluded from indexes by schema policy.

## Errors / recovery / observability

Provider failures normalize to dependency errors. Indexing is retryable only for transient failures; bulk operations report per-item failures and support idempotent document IDs. Metrics cover query/index latency, errors, result counts and indexing lag.

## Persistence / compatibility

The primary DB remains authoritative. Index versions are tied to schema versions; reindexing is explicit and resumable. Blue/green indexes may be used during migration but the cutover must be atomic from the application perspective.

## Testing / conformance

Provider contract tests cover search/filter/facet/sort/highlight/index/delete/bulk/reindex. Security tests verify tenant leakage and field exclusion. Integration tests run against at least one real search engine.

## Dependencies / exports / versioning

Provider SDKs are optional peers under provider subpaths. Root is vendor-neutral. Public query/response changes are semver-governed.

## Phases

1. Contracts/scaffold (2d); 2. query/result model (2d); 3. manager/registry (2d); 4. provider adapters (3d); 5. indexing/reindex (2d); 6. security/tenancy (1d); 7. tests/observability (2d); 8. docs/release (1d).

## Exit criteria

No vendor DSL reaches domain code; tenant isolation is enforced; indexing is resumable; provider adapters pass the same contract suite.

## Cross-references

`2026-09-03-schema-package.md`, `2026-09-03-pagination-package.md`, `2026-09-03-enterprise-tenancy-plan.md`, ADR-0090/0091.
