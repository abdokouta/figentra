---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
package: '@stackra/search'
---

# `@stackra/search` — end-to-end provider-neutral search capability

## Purpose

Provide one search contract from React/React Native applications through typed HTTP to the NestJS Search service and finally to a real search engine. The package also defines the shared index/document/query schemas used by backend indexers. Business services never import Meilisearch, Elasticsearch or another provider SDK directly.

## Ownership

The Search service owns searchable index lifecycle, projections, query policy and provider execution. `@stackra/search` owns the reusable contract, client, provider adapters and runtime integration boundary. Domain services remain source of truth for business data.

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
@stackra/search/testing
```

Provider subpaths are backend-only integration packages inside the capability. `/react` and `/react-native` never depend on provider SDKs.

## Source layout

```text
src/core/
  contracts/ query.ts result.ts document.ts index.ts schema.ts
  filters/ operators.ts parser.ts
  facets/ facet.ts
  sorting/ sort.ts
  highlighting/ highlight.ts
  pagination/
  errors/
  normalization/
  index.ts
src/http/ client.ts endpoints.ts serializers.ts index.ts
src/react/ provider.tsx hooks components index.ts
src/react-native/ provider.tsx hooks components index.ts
src/nestjs/ module.ts decorators.ts dto.ts guards.ts index.ts
src/meilisearch/ driver.ts mapper.ts index.ts
src/elasticsearch/ driver.ts mapper.ts index.ts
src/algolia/ driver.ts mapper.ts index.ts
src/testing/ mock.ts fixtures.ts conformance.ts index.ts
```

## Canonical contracts

```ts
interface SearchClient {
  query<T>(input: SearchQueryInput): Promise<SearchResult<T>>;
  suggest<T>(input: SearchSuggestInput): Promise<SearchSuggestResult<T>>;
  facets(input: SearchFacetInput): Promise<SearchFacetResult>;
}

interface SearchIndex<TDocument> {
  put(document: TDocument, version: number): Promise<void>;
  remove(id: string, version: number): Promise<void>;
  bulk(operations: readonly SearchIndexOperation<TDocument>[]): Promise<SearchBulkResult>;
}

interface SearchProvider {
  ensureIndex(spec: ProviderIndexSpec): Promise<void>;
  bulk(operations: readonly ProviderOperation[]): Promise<ProviderBulkResult>;
  delete(input: ProviderDelete): Promise<void>;
  query<T>(input: ProviderQuery): Promise<ProviderSearchResult<T>>;
  suggest(input: ProviderSuggest): Promise<ProviderSuggestResult>;
  swapAlias(input: AliasSwap): Promise<void>;
  capabilities(): SearchCapabilities;
}
```

## Frontend/mobile end-to-end flow

```text
React / React Native
  ↓ useSearch()/SearchClient
@stackra/search/http
  ↓ @stackra/http authenticated request
Gateway
  ↓ HTTPS/OpenAPI
Search Service / NestJS API
  ↓ normalize + tenant filter + IAM field policy
query compiler
  ↓ provider-neutral ProviderQuery
Meilisearch / Elasticsearch / Algolia
  ↓ normalize
SearchResult<T>
  ↓
client hook/cache/render
```

The client receives result metadata, facets, highlights, pagination/cursors and typed records. Provider-specific scoring explanations and DSLs remain backend-only unless explicitly represented by a portable contract.

## Client capabilities

React and Native hooks support:

```text
useSearch
useSearchInfinite
useSearchSuggestions
useSearchFacets
useSearchFilters
useSearchSort
useSearchResult
```

Client state integrates with `@stackra/query` for server-state caching and cancellation. Cache keys include tenant/application context, index key/version, normalized query and locale. Search clients never store credentials for the engine.

## Query contract

A portable query supports:

```text
text
filters
facets
sort
requested fields
highlight configuration
page/cursor
locale
ranking profile
```

Filtering operators are typed and allowlisted:

```text
eq neq lt lte gt gte in notIn exists
contains prefix range dateRange boolean groups
```

The compiler rejects unknown fields, unsupported operators, excessive nesting, unbounded page sizes and provider-specific syntax passed through a portable field.

## Search facts and metadata

Search results may expose safe facts useful to UI without making the index the source of truth:

```text
matched fields
highlight snippets
facet counts
score bucket
index revision
source version
availability flags
```

These are derived index/query facts, not domain facts. Critical business facts such as price, entitlement, inventory or authorization-sensitive status must be revalidated by the owning service when required.

## Index document contract

Each index has a versioned schema:

```ts
interface SearchDocumentEnvelope {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceVersion: number;
  documentSchemaVersion: string;
  searchable: Record<string, unknown>;
}
```

Only explicitly mapped and classified fields may enter the searchable document. Secrets, provider tokens, raw credentials and restricted fields are rejected before indexing.

## Meilisearch adapter

`@stackra/search/meilisearch` adapts the provider-neutral contract to the Meilisearch JavaScript SDK. It owns mapping of filterable/searchable/sortable attributes, ranking configuration, facets and task lifecycle. Provider task IDs never leak to business code; they are normalized to operation/job status.

Health checks verify connectivity, index existence and expected schema hash. Index settings are treated as versioned infrastructure and are applied idempotently during deployment/rebuild.

## Elasticsearch adapter

`@stackra/search/elasticsearch` adapts to the official Elasticsearch client. It owns mappings, analyzers, keyword/text distinctions, aliases, PIT/search-after where supported and bulk error normalization. Raw Elasticsearch DSL is confined to this adapter.

Index aliases provide zero-downtime version cutover. Mapping changes that are incompatible create a new physical index version and migrate rather than mutating a production mapping unsafely.

## Algolia adapter

`@stackra/search/algolia` maps portable search semantics to Algolia's index/query model. Features unavailable in a selected provider are reported through explicit capability negotiation; the adapter must not silently weaken security or filter semantics.

## NestJS integration

`/nestjs` exports `SearchModule`, `SearchControllerFactory`, `SearchProviderToken`, DTOs, validation pipes, index decorators and health integration. It provides DI wiring only. The Search service owns durable index metadata and authorization.

## HTTP contract

```text
POST /v1/search/query
POST /v1/search/suggest
POST /v1/search/facets
GET  /v1/search/indexes/:key
POST /v1/search/indexes/:key/rebuild
POST /v1/search/indexes/:key/reconcile
```

Search responses include opaque continuation cursors where applicable; engine-native offsets are not exposed as the only pagination model.

## Event/indexing integration

Domain services publish versioned change events after their transaction commits. Search consumes them through NATS JetStream/outbox flow:

```text
Domain transaction
 → outbox
 → NATS event
 → Search consumer
 → idempotent IndexJob
 → provider bulk
 → indexed sourceVersion
```

If an event with an older sourceVersion arrives after a newer one, the indexer discards it. Deletes persist a tombstone/version guard so late updates cannot resurrect deleted records.

## Rebuild/reindex

Rebuild is versioned:

```text
create index vN+1
 → apply snapshot
 → replay event range
 → reconcile counts/checksums
 → warm/search smoke tests
 → acquire cutover fence
 → swap alias
 → retire vN after retention
```

Jobs are checkpointed and resumable. Provider outages leave the rebuild pending rather than corrupting the active alias.

## Tenancy and authorization

The client never chooses a tenant filter as its authorization boundary. RequestContext supplies tenant/principal. Search service injects hard tenant constraints and IAM field permissions before provider compilation. Cross-tenant searches require explicit system authorization.

## Caching

Search result caching is optional and safe only when the query is deterministic for the authorization context. Public catalog search may be edge/cacheable; personalized or permission-sensitive search is private. Cache keys include tenant, principal authorization profile, index revision, locale and normalized query.

## Reliability

Transient provider failures are retried with bounded exponential backoff and jitter. Non-retryable mapping/auth/schema errors fail fast. Bulk operations report item-level failures and enqueue retryable items. Queue depth and provider throttle responses feed backpressure controls.

## Security

Reject arbitrary provider DSL, unsafe regex-like queries, script queries, unrestricted sort fields, unbounded facets, excessive result sizes and protected-field access. Provider credentials live in secret references. Log query shape, not sensitive free-text or private result bodies.

## Observability

Metrics cover client request duration, API p50/p95/p99, zero-result rate, facet latency, provider latency, bulk throughput, indexing lag, rebuild progress, alias health and stale-event drops. OTel links request→query compiler→provider operation and event→index job→provider operation.

## Testing

Conformance is mandatory across Meilisearch, Elasticsearch and Algolia adapters where supported:

```text
query / suggest / facets / sort / filters / highlighting
put / delete / bulk / stale-version / rebuild / alias-cutover
```

End-to-end tests must run a real NestJS service against at least one real provider and a real HTTP client. React and React Native tests verify hooks, cache behavior, pagination, cancellation, loading/error/empty states and tenant context propagation.

## Performance limits

Compile-time and runtime limits define maximum text length, filter depth, facet count, requested fields, page size, result bytes, provider timeout and concurrency. Large reindexes use bounded batches and leases.

## Production exit criteria

- React and React Native can search through one typed HTTP contract.
- No frontend/mobile package imports a search-engine SDK.
- Meilisearch and Elasticsearch adapters satisfy the same conformance contract.
- At least one real provider is exercised in production acceptance.
- Search documents are versioned projections and never business truth.
- Stale events, deletes, rebuilds and tenant isolation are tested end-to-end.
