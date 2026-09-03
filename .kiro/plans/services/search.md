---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: search
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024]
---
# Search Service — implementation plan

## Mission and boundary
Search owns queryable indexes and the index lifecycle. Domain services remain source of truth. Search owns mappings, searchable document projections, indexing jobs, query execution, ranking configuration, rebuilds, alias cutover and source/index reconciliation. It never becomes the system of record for domain entities.

## Source tree
```text
services/search/src/
├── modules/{indexes,documents,indexing,query,ranking,rebuild,reconciliation}
├── application/{commands,queries,services}
├── domain/{index,document,index-job}
├── infrastructure/{database,search-provider,nats,config}
├── presentation/{http,openapi}
├── workers/{indexing,rebuild,reconciliation}
├── database/{entities,migrations}
└── main.ts
```

## Models
`SearchIndex(id,tenantId,key,version,status,engine,alias,documentSchemaHash,createdAt)`
`SearchDocument(indexId,tenantId,sourceType,sourceId,sourceVersion,body,updatedAt)`
`IndexJob(id,indexId,tenantId,sourceId,sourceVersion,operation,status,attempt,nextRunAt)`
`RebuildJob(id,indexId,targetVersion,checkpoint,status,startedAt,completedAt)`
`SearchQuery(id,tenantId,indexKey,filters,sort,page,principalId,requestedAt)` where query audit is retained only when contractually/legally required.

## Public API
```ts
interface SearchService {
  query<T>(ctx:RequestContext,input:SearchQueryInput):Promise<SearchResult<T>>;
}
interface IndexService {
  create(ctx:RequestContext,input:CreateIndexInput):Promise<SearchIndexView>;
  rebuild(ctx:RequestContext,indexId:string):Promise<RebuildJobView>;
  reconcile(ctx:RequestContext,indexId:string):Promise<ReconciliationView>;
}
interface SearchProvider {
  createIndex(input:ProviderIndexSpec):Promise<void>;
  bulk(input:readonly ProviderDocumentOperation[]):Promise<ProviderBulkResult>;
  delete(input:ProviderDelete):Promise<void>;
  query<T>(input:ProviderQuery):Promise<ProviderSearchResult<T>>;
  swapAlias(input:AliasSwap):Promise<void>;
  capabilities():SearchCapabilities;
}
```

DTOs: `CreateIndexDto`, `UpdateIndexDto`, `SearchQueryDto`, `IndexDocumentDto`, `RebuildIndexDto`, `ReconcileIndexDto`. Query schemas impose explicit field/sort/filter allowlists and payload limits.

## HTTP controllers
```text
GET    /v1/indexes
POST   /v1/indexes
GET    /v1/indexes/:id
PATCH  /v1/indexes/:id
DELETE /v1/indexes/:id
POST   /v1/indexes/:id/rebuild
POST   /v1/indexes/:id/reconcile
GET    /v1/indexes/:id/jobs/:jobId
POST   /v1/search/query
```

## Indexing execution
Domain services publish versioned change events after commit. Search consumes at least once, creates idempotent jobs and carries source version. A job is applied only when the incoming version is newer than the currently indexed version. Deletes create tombstone/version state so late updates cannot resurrect a document.

## Rebuild/cutover
A rebuild creates a new index version, loads a consistent source snapshot/event stream, validates document counts/checksums and then swaps an alias atomically. Old index versions remain until the configured retention window. Rebuild has a durable checkpoint and fencing token so two workers cannot cut over concurrently.

## Provider boundary
The production search engine is selected by deployment configuration/ADR. Provider SDK types stay behind `SearchProvider`. An in-memory driver may exist only under testing. Unsupported provider capabilities return explicit errors rather than silently changing query semantics.

## Identity/IAM/Tenant
Identity supplies principal context. IAM authorizes index administration and protected-field query access. Tenant is embedded in index namespace/query constraints. A tenant ID in a user query is never sufficient authority. System operators require explicit cross-tenant IAM permission.

## Persistence
PostgreSQL metadata: `search_indexes`, `search_documents`, `index_jobs`, `rebuild_jobs`, `outbox`. The search engine stores the actual optimized index; database metadata owns lifecycle/version/alias state. Index/query filters use `(tenant_id, ...)` constraints. Migrations use expand/contract.

## Reliability
Indexing is at-least-once with bounded batch sizes, retry budgets, backoff and DLQ. Provider outages do not lose source events; jobs remain pending/retryable. Reconciliation compares source event/version state and index metadata. Backpressure caps queue depth and worker concurrency.

## Security
Documents are field-allowlisted. Secrets, access tokens and restricted PII cannot enter search documents. Queries have bounded filter depth, sort fields, page size and free-text length. Result fields are also allowlisted. Provider credentials are secret references.

## Runtime roles
`api` serves index management and query APIs; `consumer` creates index jobs from domain events; `worker` executes indexing/rebuild/delete; `scheduler` runs reconciliation and stale-index cleanup. One service source tree only.

## Observability
Metrics: query p50/p95/p99 latency, zero-result rate, indexing throughput/lag, bulk failure rate, rebuild duration, alias cutover status, provider throttling and source/index drift. OTel spans connect event→index job→provider operation. Raw restricted document/query text is excluded.

## Testing
Provider conformance; query/ranking fixtures; stale-event ordering; delete resurrection prevention; tenant isolation; rebuild consistency/cutover; alias fencing; provider outage/retry/DLQ; mapping compatibility; migration; load/backpressure tests.

## Implementation phases
1. Provider-neutral contracts and database metadata.
2. Index/document mapping and event ingestion.
3. Query/ranking API and authorization integration.
4. Bulk indexing/delete/rebuild and alias cutover.
5. Reconciliation/retention and workers.
6. Security/observability/load/failure verification.

## Exit criteria
- A real production search adapter is configured and passes conformance.
- Domain events can be replayed without stale resurrection.
- Rebuilds are versioned, checkpointed and atomically cut over.
- Every query enforces tenant and field access constraints.
- No domain service writes directly to the search provider.
