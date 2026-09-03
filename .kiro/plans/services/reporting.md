---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: reporting
runtime: nestjs
anchor_adrs: [ADR-0024]
---

# Reporting Service — production implementation plan

## Mission and boundary

Reporting owns operational/reporting read models, report definitions, safe query compilation, report execution, durable exports and report schedules. Transactional services remain authoritative for business writes. Analytics owns analytical facts, metrics, funnels and attribution. Reporting may consume analytics outputs but must not become a second analytics truth layer.

The service provides two forms of reports:

```text
System report
  trusted definition shipped with application

Custom report
  tenant/admin-authored definition built from registered datasets/fields
```

Neither form accepts arbitrary SQL.

## E2E architecture

```text
React / React Native
  ↓ @stackra/reporting/react|native
  ↓ @stackra/reporting/http
Gateway → Reporting API (NestJS)
  ↓ RequestContext + IAM + tenant policy
Report definition resolver
  ↓ safe query AST compiler
read model / approved analytical source
  ↓
ReportResult
  ↓
Dashboard widget / table / chart / export

Domain events
  ↓ outbox/NATS
Reporting consumer
  ↓ projection
versioned read model
```

## Source tree

```text
services/reporting/src/
├── modules/{catalog,definitions,datasets,fields,query,compiler,read-models,exports,schedules,authorization,reconciliation}
├── application/{commands,queries,services}
├── domain/{report-definition,report-revision,report-job,report-schedule,projection}
├── infrastructure/{database,nats,files,queue,config,locks}
├── presentation/{http,openapi}
├── workers/{projection,export,schedule,reconciliation}
├── policies/{query-cost,fields,tenant}
├── database/{entities,migrations,seeds}
└── main.ts
```

## Dataset registry

Custom reports are possible only over explicitly registered datasets. A dataset describes a safe read surface:

```ts
interface ReportDatasetDefinition {
  key: string;
  version: string;
  title: LocalizedText;
  sourceKind: 'read-model' | 'analytics' | 'service-contract';
  fields: readonly ReportFieldDefinition[];
  relations: readonly ReportRelationDefinition[];
  allowedAggregations: readonly AggregationKind[];
  allowedFilters: readonly FilterOperator[];
  allowedSorts: readonly string[];
  authorizationProfile: string;
}
```

A relation is a named, pre-approved join path. Callers cannot invent table names, join conditions or database functions.

## Field definition

Each field declares type, label, visibility, sensitivity, filter operators, sortability, grouping support and formatting metadata. Restricted fields are excluded from definitions returned to unauthorized callers.

```ts
interface ReportFieldDefinition {
  key: string;
  type: ReportFieldType;
  label: LocalizedText;
  sensitive: boolean;
  filterOperators: readonly FilterOperator[];
  sortable: boolean;
  groupable: boolean;
  aggregations: readonly AggregationKind[];
}
```

## Custom report authoring

```text
GET /datasets
  ↓
choose dataset
  ↓
choose fields
  ↓
add aggregations/calculated fields
  ↓
add filters
  ↓
select grouping + sorting
  ↓
preview
  ↓
save report revision
  ↓
run / share / schedule / export
```

The React/Natively supplied Report Builder is schema-driven by the dataset catalog returned by the backend. Every control corresponds to a typed AST node. The UI never composes SQL strings.

## Query AST

Supported nodes:

```text
FieldRef
Literal
Comparison
Between
In
Contains
Prefix
Exists
DateRange
And
Or
Not
Aggregate
GroupBy
OrderBy
CalculatedField
```

Built-in calculated functions are allowlisted. Function signatures define argument and return types. Query validation rejects unknown fields, type mismatches, forbidden aggregates, excessive nesting and unbounded cardinality.

## Example custom report

```json
{
  "dataset": "orders",
  "fields": ["createdAt", "status", "customer.name"],
  "aggregates": [{"field": "grandTotal", "fn": "sum", "as": "revenue"}],
  "groupBy": ["status"],
  "filters": [{"field": "createdAt", "op": "dateRange", "value": "last_30_days"}],
  "sort": [{"field": "revenue", "direction": "desc"}]
}
```

The service compiles this definition into the approved backend query plan. The persisted report contains the logical definition and version, never generated SQL.

## Read models

Operational reports should use service-owned reporting read models populated from versioned events rather than querying hot transactional tables for arbitrary joins. Analytical reports can point at Analytics datasets through an explicit service contract.

A read-model projection records source versions/checkpoints and can be rebuilt. Source systems remain authoritative.

## Public API

```text
GET    /v1/report-datasets
GET    /v1/report-datasets/:key
GET    /v1/reports
POST   /v1/reports
GET    /v1/reports/:key
PATCH  /v1/reports/:key
POST   /v1/reports/:key/preview
POST   /v1/reports/:key/query
POST   /v1/reports/:key/exports
GET    /v1/report-jobs/:id
POST   /v1/reports/:key/schedules
PATCH  /v1/report-schedules/:id
DELETE /v1/report-schedules/:id
POST   /v1/reports/:key/revisions/:revision/publish
POST   /v1/reports/:key/revisions/:revision/restore
```

## Versioning and publishing

Every report is a versioned definition. Draft revisions may be edited. Published revisions are immutable. Executions capture the exact definition version so a report job never changes meaning because another user edited the report later.

A custom report lifecycle is:

```text
DRAFT → VALIDATED → PUBLISHED → ARCHIVED
```

Publish requires IAM permission and validation against the current dataset catalog. If the dataset schema changed, the report is marked incompatible rather than silently reinterpreted.

## Preview

Preview executes the exact production compiler under stricter budgets: maximum rows, execution time, result bytes and grouping cardinality. Preview cannot create durable export artifacts or bypass field-level authorization.

## Query execution

```text
ReportQueryDto
 → definition/version resolution
 → tenant injection
 → IAM field authorization
 → AST validation
 → cost estimation
 → source/read-model selection
 → provider/query adapter
 → normalized result
 → pagination
```

The query planner can reject an expensive query before execution and recommend an asynchronous export/job path.

## Exports

Small exports may stream when within hard limits. Large exports create `ReportJob` and materialize through Files/object storage. The job records definition version, query hash, tenant, requester, row count, byte count, checksum and expiry.

Exports are resumable and use short-lived signed download URLs. XLSX/PDF are optional exporters behind explicit capability registrations; CSV/JSON are baseline portable formats.

## Schedules

A schedule binds a published report revision to cron/timezone/recipients and an execution policy. Each occurrence has a deterministic occurrence ID for idempotent delivery. Notifications owns delivery; Reporting only requests the delivery with a report artifact/reference.

## Dashboard integration

Dashboard widgets reference `reportKey + parameterSchema`. The widget receives a normalized `ReportResult` and knows nothing about SQL/read-model structure. Report metadata can advertise chart/table-compatible output hints so the dashboard can select an appropriate renderer.

## Security and tenancy

Tenant scope is mandatory and server-derived. IAM controls report administration, dataset visibility, sensitive fields, exports, schedules and cross-tenant system reporting. Recipient validation is performed before schedule activation. Report definitions cannot contain credentials, filesystem paths or raw SQL.

## Persistence

```text
report_datasets
report_definitions
report_definition_revisions
report_views
report_jobs
report_schedules
report_projection_checkpoints
report_outbox
```

Definitions and revisions are JSON-schema-backed logical documents plus relational metadata for indexing/queryability. Projection tables are optimized for read workloads and are rebuildable.

## Runtime roles

Same NestJS tree:

- `api`: report catalog, CRUD, preview/query control, export/schedule commands.
- `consumer`: consumes domain/Analytics events and maintains projections.
- `worker`: executes exports, heavy queries and projection rebuilds.
- `scheduler`: claims due report occurrences and retention tasks.

Independent reporting workers are prohibited.

## Failure/recovery

Projection consumers are at-least-once and version-guarded. Jobs retry transient provider/object failures with bounded budgets; poison jobs move to DLQ. Rebuilds checkpoint. Schedules are idempotent. A failed export never deletes the definition or advances a successful completion state.

## Observability

Metrics cover query latency/cost, rows/bytes returned, preview rejection, projection lag, rebuild duration, export throughput, queue depth, schedule lag and job retries. Traces correlate HTTP→compiler→source query and event→projection. Sensitive rows and raw report parameter values are excluded from logs/telemetry.

## Testing

Required tests:

```text
Dataset registration/security
custom definition creation/update/publish
AST compilation/type checking/filter/sort/group limits
field + tenant authorization
preview/query/export
projection replay + stale event handling
revision immutability
schedule occurrence idempotency
job retry/resume/checksum/expiry
Dashboard widget integration
real NestJS HTTP E2E against representative read models
```

## Performance

Set explicit per-tenant query CPU/time/row/byte budgets, maximum group cardinality, page size and concurrent heavy jobs. Query cost estimation must be measured against production-like data distributions. Large jobs leave the request process and execute through durable queues.

## Completion criteria

- Tenants can build reports from registered datasets without writing SQL.
- The same logical definition works for preview, synchronous query, dashboard widgets and asynchronous exports.
- Published revisions are immutable and executable against the version they were validated against.
- Projections are replayable and source-version guarded.
- Every query/export/schedule is tenant and IAM constrained.
- Reporting integrates cleanly with Analytics, Dashboard, Files and Notifications without creating a new service boundary.
