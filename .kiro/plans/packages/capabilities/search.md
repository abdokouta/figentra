---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
package: '@stackra/search'
---
# `@stackra/search` — end-to-end provider-neutral search capability

## Purpose
One search contract from React/React Native through authenticated HTTP/OpenAPI to the NestJS Search service and finally to a real engine. The same package also defines index/document/query contracts for backend indexing. Vendor SDKs never reach business code.

## Subpaths
```text
@stackra/search
@stackra/search/http
@stackra/search/react
@stackra/search/react-native
@stackra/search/nestjs
@stackra/search/meilisearch
@stackra/search/elasticsearch
@stackra/search/algolia
@stackra/search/indexer
@stackra/search/testing
```

## Exact source tree
```text
packages/capabilities/search/
├── package.json
├── README.md
├── src/core/
│   ├── contracts/{query,result,document,index,schema}.ts
│   ├── filters/{operators,parser}.ts
│   ├── facets/facet.ts
│   ├── sorting/sort.ts
│   ├── highlighting/highlight.ts
│   ├── pagination/pagination.ts
│   ├── normalization/{query,result}.ts
│   ├── errors/index.ts
│   └── index.ts
├── src/http/{client,endpoints,serializers,index.ts}
├── src/react/{provider,hooks,components,index.ts}
├── src/react-native/{provider,hooks,components,index.ts}
├── src/nestjs/{module,controllers,dto,guards,health,index.ts}
├── src/meilisearch/{driver,mapper,settings,index.ts}
├── src/elasticsearch/{driver,mapper,settings,aliases,index.ts}
├── src/algolia/{driver,mapper,index.ts}
├── src/indexer/{index-job,version-guard,bulk,rebuild,index.ts}
└── src/testing/{mock,fixtures,conformance,e2e,index.ts}
```

## Public API
```ts
interface SearchClient {
  query<T>(input: SearchQueryInput): Promise<SearchResult<T>>;
  suggest<T>(input: SearchSuggestInput): Promise<SearchSuggestResult<T>>;
  facets(input: SearchFacetInput): Promise<SearchFacetResult>;
}
interface SearchIndex<TDocument> {
  put(document:TDocument, version:number): Promise<void>;
  remove(id:string, version:number): Promise<void>;
  bulk(operations:readonly SearchIndexOperation<TDocument>[]): Promise<SearchBulkResult>;
}
interface SearchProvider {
  ensureIndex(spec:ProviderIndexSpec):Promise<void>;
  bulk(ops:readonly ProviderOperation[]):Promise<ProviderBulkResult>;
  delete(input:ProviderDelete):Promise<void>;
  query<T>(input:ProviderQuery):Promise<ProviderSearchResult<T>>;
  suggest(input:ProviderSuggest):Promise<ProviderSuggestResult>;
  facets(input:ProviderFacetQuery):Promise<ProviderFacetResult>;
  swapAlias(input:AliasSwap):Promise<void>;
  capabilities():SearchCapabilities;
}
```

## Frontend/mobile E2E
```text
React/RN hook
 → @stackra/search/http
 → @stackra/http
 → Gateway
 → authenticated HTTPS/OpenAPI
 → SearchController
 → RequestContext + IAM + tenant policy
 → query normalizer/compiler
 → SearchProvider
 → Meilisearch/Elasticsearch/Algolia
 → normalized SearchResult
 → @stackra/query cache/cancellation
 → UI
```
The browser/mobile client never receives search-engine credentials or native DSL.

React hooks: `useSearch`, `useSearchInfinite`, `useSearchSuggestions`, `useSearchFacets`, `useSearchFilters`, `useSearchSort`. Native exposes equivalent hooks/sheets/results without DOM assumptions.

## Portable query
Supports text, typed filters, facets, sort, fields, highlights, cursor/page, locale and ranking profile. Allowlisted operators: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `notIn`, `exists`, `contains`, `prefix`, `range`, `dateRange`, `and`, `or`, `not`. Unknown fields/operators or excessive depth/size are rejected.

## Facts vs search-derived metadata
Results may contain matched-field metadata, safe snippets, facet counts, score buckets, index revision and source version. These are search facts, not domain truth. Price, inventory, commercial entitlement or authorization-sensitive facts are revalidated by their owning service when necessary.

## Indexing E2E
```text
Domain transaction
 → transactional outbox
 → NATS JetStream event
 → Search consumer
 → durable IndexJob
 → version guard
 → provider mapper
 → bulk operation
 → indexed sourceVersion
```
Older source versions are discarded. Deletes create durable version/tombstone protection against resurrection. Provider failure leaves jobs retryable/DLQ.

## Rebuild
```text
create physical index vN+1
 → snapshot source
 → replay event window
 → reconcile count/checksum
 → smoke search
 → cutover fence
 → alias swap
 → retain vN
```
Rebuilds are checkpointed and resumable; active alias remains untouched until validation succeeds.

## Provider contracts
`/meilisearch` imports only the supported Meilisearch JS client and maps settings/tasks/filter syntax. `/elasticsearch` imports only the official client and owns mappings/analyzers/bulk/PIT/search-after/aliases. `/algolia` maps the portable contract to Algolia capabilities. Unsupported behavior returns explicit capability errors rather than weakening semantics.

## NestJS
Exports `SearchModule`, `SearchController`, `SearchProviderToken`, DTOs, validation guards and health integration. Controllers expose:
```text
POST /v1/search/query
POST /v1/search/suggest
POST /v1/search/facets
GET  /v1/search/indexes/:key
POST /v1/search/indexes/:key/rebuild
POST /v1/search/indexes/:key/reconcile
GET  /v1/search/indexes/:key/jobs/:id
```

## Tenancy/security
RequestContext is authoritative. Tenant constraints and IAM field permissions are injected before provider compilation. A client-supplied tenant ID cannot grant access. Secrets, credentials and restricted fields are rejected from documents and results. Provider DSL, scripts and unbounded regex-like constructs are forbidden.

## Cache
Result caching is optional and private-by-default. Keys include tenant, principal authorization profile, application, index revision, locale and normalized query hash. Public catalog search may be CDN/cacheable only when the authorization contract permits it.

## Reliability/limits
Finite provider timeout, request/result bytes, filter depth, facets, requested fields, concurrency and batch sizes are mandatory. Retry only transient failures using bounded exponential backoff + jitter. Provider task IDs are normalized. Queue depth drives backpressure.

## Observability
Measure query p50/p95/p99, zero-result rate, provider latency/throttle/error, indexing lag, stale-event drops, bulk success, rebuild progress, alias health and reconciliation drift. OTel connects request→provider and event→job→provider; sensitive query text is not logged.

## Testing
Provider conformance; React/RN client integration; pagination/cancellation; stale ordering; delete resurrection; schema compatibility; tenant isolation; rebuild/cutover; provider outages; real NestJS + HTTP + at least one real provider in release acceptance.

## Exit criteria
A real React and RN client can search through Gateway/API using the same typed contract; real Meilisearch/Elasticsearch adapters pass conformance; the Search service owns all index state; no vendor DSL leaks outward; all stale/delete/rebuild/security paths have E2E coverage.
