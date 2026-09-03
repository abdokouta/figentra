---
status: canonical
component: service
service: search
version: v1
runtime: nestjs
---
# Search Service — implementation-complete plan

## Mission
Own search indexes and query execution while domain services remain the source of truth. Search owns documents, mappings, index lifecycle, ranking configuration, indexing/rebuild/reconciliation and query APIs.

## Models
`SearchIndex(id,tenantId,key,version,status,engine,alias,documentSchema)`; `SearchDocument(indexId,tenantId,sourceType,sourceId,version,body,updatedAt)`; `IndexJob(id,indexId,sourceId,sourceVersion,operation,status,attempt)`; `SearchQuery(id,tenantId,indexKey,filters,sort,page,requestedAt)`; `RebuildJob(id,indexId,sourceSnapshot,checkpoint,status)`.

## API
`GET/POST/PATCH/DELETE /v1/indexes`; `POST /v1/indexes/:id/rebuild`; `POST /v1/indexes/:id/reconcile`; `POST /v1/search/query`; `GET /v1/indexes/:id/jobs/:jobId`.

## Interfaces
`SearchService.query`; `IndexService.create/update/delete/rebuild`; `DocumentIndexer.index/delete`; `RankingService.rank`; `ReconciliationService.compare/repair`; `SearchProvider` with createIndex/bulk/upsert/delete/query/alias capabilities.

## Indexing semantics
Domain events are at-least-once. Each document carries source version; stale events are ignored. Bulk indexing is bounded and idempotent. Deletes use tombstones/version guards so late updates cannot resurrect documents. Rebuild creates a new versioned index, backfills it, verifies counts/checksums, then atomically swaps the alias.

## Identity/IAM/Tenant
Identity provides principal context. IAM authorizes index administration and protected query fields. Tenant is embedded into index namespace and query predicates. Search never trusts a tenant ID supplied solely in query parameters.

## Provider boundary
The production search engine is selected by explicit deployment configuration/ADR. Provider types stay inside adapters. In-memory search is test-only. Capability gaps fail explicitly rather than silently degrading query semantics.

## Persistence
PostgreSQL metadata: `search_indexes`, `search_documents`, `index_jobs`, `rebuild_jobs`, `search_query_audit` where required, `outbox`. Search engine stores the queryable index. Metadata is authoritative for lifecycle state.

## Workers/scheduler
Consumer turns domain events into index jobs; worker performs bulk index/delete/rebuild; scheduler reconciles drift and cleans stale indexes. Leases/fencing protect concurrent rebuilds.

## Security/reliability
Field allowlists prevent restricted data from entering documents. Query filters are bounded and validated. Tenant isolation is enforced at index and query levels. Backpressure, retry/DLQ and provider circuit behavior are explicit.

## Observability
Query latency, result counts, index lag, bulk throughput, rebuild progress, provider errors and source/index drift. No raw query values or restricted document content in telemetry.

## Testing
Provider conformance, ranking fixtures, stale-event ordering, delete resurrection prevention, tenant isolation, rebuild cutover, reconciliation, provider outage and load tests.

## Completion gate
Real provider adapter, versioned indexes, deterministic rebuild/cutover, tenant-safe queries and replayable indexing are implemented; no domain service writes the search engine directly.