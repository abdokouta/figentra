---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: search
runtime: nestjs
anchor_adrs: [ADR-0024]
---

# Search Service — production implementation plan

## Mission and ownership

Search is a projection/query service. It owns index metadata, index schemas, document projections, ranking configuration, query policy, indexing jobs, rebuild/reconciliation state and provider execution. Domain services remain the source of truth and publish versioned business events.

The service must support real production providers through `@stackra/search`: Meilisearch and Elasticsearch are first-class adapters, with Algolia available where product requirements justify it. The active production provider is selected by environment/configuration and must pass the provider conformance suite.

## E2E architecture

```text
React / React Native
  ↓ @stackra/search/react or /react-native
  ↓ @stackra/search/http
Gateway
  ↓ authenticated HTTPS/OpenAPI
Search API (NestJS)
  ↓ RequestContext + IAM + tenant constraints
query compiler
  ↓ provider-neutral ProviderQuery
Meilisearch / Elasticsearch / Algolia
  ↓
normalized SearchResult
  ↓
client cache / renderer

Domain service transaction
  ↓ transactional outbox
NATS JetStream
  ↓
Search consumer
  ↓ IndexJob
provider bulk/index/delete
  ↓
versioned index projection
```

## Source tree

```text
services/search/src/
├── modules/{indexes,schemas,documents,indexing,query,suggest,facets,ranking,rebuild,reconciliation,retention}
├── application/{commands,queries,services}
├── domain/{index,index-version,document,index-job,rebuild-job}
├── infrastructure/{database,nats,providers,config,locks}
├── presentation/{http,openapi}
├── workers/{indexing,rebuild,reconciliation,retention}
├── database/{entities,migrations,seeds}
├── policies/{tenant,fields,query-cost}
└── main.ts
```

## Persistence

```text
search_indexes
search_index_versions
search_documents
search_document_tombstones
search_index_jobs
search_rebuild_jobs
search_reconciliation_jobs
search_query_profiles
search_outbox
```

`search_index_versions` owns schema hash, provider index name, alias, mapping/settings version, activation state and cutover timestamps. `search_documents` records sourceVersion for ordering/reconciliation and may hold only the normalized projection required for recovery; it is not a business copy.

## Index registration

A trusted application/domain service registers a `SearchIndexDefinition`:

```ts
interface SearchIndexDefinition {
  key: string;
  documentSchemaVersion: string;
  sourceType: string;
  fields: readonly SearchFieldDefinition[];
  filterable: readonly string[];
  sortable: readonly string[];
  searchable: readonly string[];
  facets: readonly string[];
  resultFields: readonly string[];
  rankingProfile: RankingProfile;
}
```

Definitions are versioned and validated before activation. A schema change that cannot be applied safely in place creates a new index version.

## Index population

Every source event contains a stable event ID, source entity ID, source version, tenant ID and event type. Search consumes at least once.

```text
received event
 → validate contract
 → authorize source/index mapping
 → dedupe event ID
 → compare sourceVersion
 → create/update IndexJob
 → execute provider mutation
 → persist indexed sourceVersion
```

For bulk updates, jobs are grouped by index/version and sent to the provider using bounded batches. The database metadata is committed only after the provider operation is acknowledged.

## Stale event protection

The current indexed sourceVersion is authoritative for ordering. An event whose sourceVersion is lower than the current version is ignored and recorded as a stale-event metric. Equal version with a different document hash is a data-integrity conflict and enters reconciliation rather than overwriting silently.

Deletes create tombstones containing sourceVersion so a late update cannot resurrect an entity.

## Query pipeline

```text
HTTP DTO
 → schema validation
 → RequestContext
 → IAM field/query authorization
 → inject tenant predicate
 → normalize text/locale
 → validate filters/sorts/facets/fields
 → apply cost budget
 → compile ProviderQuery
 → provider
 → normalize ProviderResult
 → redact forbidden fields
 → pagination/cursor response
```

No caller can provide raw provider DSL.

## Search result model

```ts
interface SearchResult<T> {
  items: readonly T[];
  total?: number;
  cursor?: string;
  facets?: readonly SearchFacetResult[];
  highlights?: readonly SearchHighlight[];
  queryId: string;
  indexVersion: string;
}
```

`total` may be omitted where the provider cannot provide an exact count within the configured cost budget. Cursor semantics are provider-neutral.

## Suggest/autocomplete

Suggestions use dedicated allowlisted fields and short bounded inputs. They must not expose unauthorized records. Prefix/suggestion indexes may be separate physical indexes where needed.

## Ranking

Ranking profiles are versioned server-side. Business code selects a named profile and approved ranking parameters rather than sending provider-specific ranking scripts. Ranking changes require fixture tests and measurable rollback criteria.

## Rebuild and cutover

```text
lock rebuild target
 → create physical index N+1
 → load source snapshot
 → replay events from snapshot boundary
 → verify counts/checksums
 → run query smoke/conformance suite
 → acquire fencing token
 → atomically swap alias
 → mark N+1 active
 → retain N for rollback window
 → delete N after retention
```

A checkpoint is persisted after each batch. Crash recovery resumes from the last committed checkpoint. Two rebuild workers cannot own the same cutover fence.

## Reconciliation

Scheduled reconciliation compares source version expectations with Search projection state. It detects missing, stale, extra/tombstoned and hash-conflicting documents. Repairs are emitted as idempotent jobs and are rate-limited to avoid destabilizing the provider.

## Provider adapters

### Meilisearch
Use `@stackra/search/meilisearch`. Map index settings, searchable/filterable/sortable/faceted attributes and ranking rules. Provider tasks are polled/normalized by infrastructure workers. Task failures become typed provider-operation failures.

### Elasticsearch
Use `@stackra/search/elasticsearch`. Map field types, analyzers, aliases, bulk API, search-after/PIT where required and index templates. Breaking mapping changes require a new physical index version and alias cutover.

### Algolia
Use `@stackra/search/algolia` when selected. Restrict the portable contract to supported semantics and require explicit capability negotiation.

## Runtime roles

The same NestJS source tree runs:

- `api`: HTTP search/index administration.
- `consumer`: NATS event consumption and durable IndexJob creation.
- `worker`: indexing, bulk, rebuild and delete execution.
- `scheduler`: reconciliation, retention and stale-job cleanup.

A separate `workers/search` application is prohibited without an ADR.

## Security and tenancy

Tenant scope is derived from RequestContext, never accepted as the sole security control from a client. IAM authorizes index administration, sensitive fields, ranking profiles and cross-tenant operations. Index field schemas classify data. Secrets, credentials and restricted PII are prohibited from index payloads.

Public search endpoints have strict result/filter/facet limits and abuse controls.

## Failure/recovery

Transient provider failures retry with finite budgets and jitter. Permanent schema/auth/mapping failures fail fast and surface diagnostics through typed error categories. Poison events enter DLQ/quarantine with enough metadata for replay. Provider outages never delete source events or advance checkpoints.

## Observability

Metrics include request latency, query cost, zero-result rate, provider latency/errors, index lag, job queue depth, stale-event drops, tombstone collisions, rebuild progress, alias state and reconciliation drift. OTel propagates from originating event through job/provider call. Search text/results are not logged unless explicitly classified safe.

## HTTP API

```text
GET  /v1/indexes
POST /v1/indexes
GET  /v1/indexes/:key
PATCH /v1/indexes/:key
POST /v1/indexes/:key/rebuild
POST /v1/indexes/:key/reconcile
GET  /v1/search/:key
POST /v1/search/:key/query
POST /v1/search/:key/suggest
POST /v1/search/:key/facets
GET  /v1/jobs/:id
```

## Testing

Provider contract suite:

```text
index/create/update/delete
bulk success + item failures
query/filters/facets/sorts/highlights/suggest
cursor pagination
alias swap
mapping/schema compatibility
```

Service E2E:

```text
Domain event
 → NATS
 → Search consumer
 → IndexJob
 → real provider
 → HTTP query
 → React hook
 → rendered results
```

Also test stale ordering, delete resurrection prevention, rebuild crash/resume, alias fencing, provider outage, rate limits, tenant isolation, field-level permissions and migration rollback.

## Performance targets

The plan must establish measured SLOs per deployment. Baseline acceptance should cover p95 query latency, indexing throughput, rebuild duration, provider error budget, maximum result bytes and bounded concurrent jobs. Workloads are tested with realistic tenant distributions rather than single-tenant synthetic data.

## Deployment

Provider credentials are environment/secret references. Index settings and aliases are declaratively versioned. Development/staging/production use isolated provider endpoints/index namespaces. Deployment validates provider connectivity, schema compatibility and health before serving traffic.

## Exit criteria

- React and React Native clients use only typed HTTP contracts.
- A real Meilisearch or Elasticsearch deployment passes conformance and E2E acceptance.
- Domain events flow through outbox/NATS into version-safe projections.
- Rebuild, alias cutover and reconciliation are resumable and fenced.
- Tenant/field authorization is enforced before provider execution.
- Provider SDKs and DSLs remain behind `@stackra/search/*` subpaths.
