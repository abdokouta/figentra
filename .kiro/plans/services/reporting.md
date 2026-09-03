---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: reporting
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024]
---
# Reporting Service — implementation plan

## Mission and boundary
Reporting owns operational/reporting read models, report definitions, authorized query execution, durable export jobs and scheduled report delivery requests. Transactional domain services remain authoritative for writes. Analytics owns analytical facts/metrics. Reporting never executes arbitrary SQL supplied by a client.

## Source tree
```text
services/reporting/src/
├── modules/{definitions,query,read-models,exports,schedules,authorization,reconciliation}
├── application/{commands,queries,services}
├── domain/{report-definition,report-job,schedule,projection}
├── infrastructure/{database,messaging,object-storage,config}
├── presentation/{http,openapi}
├── workers/{projection,export,schedule,reconciliation}
├── database/{entities,migrations}
└── main.ts
```

## Models
`ReportDefinition(id,tenantId,key,version,status,columns,filters,sort,authorizationProfile,createdBy,updatedAt)`
`ReportView(id,definitionId,tenantId,refreshMode,lastBuiltAt,sourceVersion,version)`
`ReportJob(id,tenantId,definitionId,requestedBy,status,cursor,rowCount,objectRef,checksum,expiresAt)`
`ReportSchedule(id,tenantId,definitionId,cron,timezone,recipients,status,nextRunAt)`
`ProjectionCheckpoint(source,tenantId,version,updatedAt)`

Definitions contain an allowlisted projection model, typed filter operators, sort fields and authorization profile; they never store raw SQL.

## Public API
```ts
interface ReportService {
  create(ctx:RequestContext,input:CreateReportInput):Promise<ReportDefinitionView>;
  update(ctx:RequestContext,key:string,input:UpdateReportInput):Promise<ReportDefinitionView>;
  query(ctx:RequestContext,key:string,input:ReportQueryInput):Promise<ReportResult>;
}
interface ExportService { start(ctx:RequestContext,input:StartExportInput):Promise<ReportJobView>; status(ctx:RequestContext,id:string):Promise<ReportJobView>; }
interface ProjectionService { apply(event:DomainProjectionEvent):Promise<void>; rebuild(ctx:RequestContext,definitionId:string):Promise<RebuildView>; }
```
DTOs: `CreateReportDto`, `UpdateReportDto`, `ReportQueryDto`, `StartExportDto`, `ScheduleReportDto`, `ReportJobQueryDto`.

## Controllers
```text
GET    /v1/reports
POST   /v1/reports
GET    /v1/reports/:key
PATCH  /v1/reports/:key
DELETE /v1/reports/:key
POST   /v1/reports/:key/query
POST   /v1/reports/:key/exports
GET    /v1/report-jobs/:id
POST   /v1/report-schedules
PATCH  /v1/report-schedules/:id
DELETE /v1/report-schedules/:id
```

## Projection semantics
Domain events arrive at least once. Projection handlers are idempotent and use source version guards. A checkpoint advances only after the batch and its read-model changes commit. Rebuild creates a new projection version, validates row counts/checksums and swaps the report view atomically. Projection lag is observable and does not corrupt source data.

## Query execution
The query compiler maps report-definition fields/operators to a safe query AST. Only approved columns, joins and operators are available. Query cost is bounded by row/time/byte budgets. Page size, filter depth and sort count are limited. Expensive reports are automatically routed to durable export jobs.

## Exports
Requests below configured thresholds may stream. Large exports create `ReportJob`, materialize to Files/object storage and return a short-lived signed URL. Export artifacts inherit tenant classification and retention. Partial jobs are resumable and checksummed.

## Identity/IAM/Tenant
Identity supplies principal context. IAM authorizes report administration, protected fields, execution, export and schedule operations. Tenant is a hard isolation boundary across definitions, projections, queries, jobs and artifacts. Scheduled recipients must be validated against notification/tenant contracts and may not bypass suppression policies.

## Persistence
PostgreSQL metadata/read-model tables: `report_definitions`, `report_views`, `report_jobs`, `report_schedules`, `projection_checkpoints`, `outbox`. Read-model storage may use optimized relational tables; source transaction tables are never queried through unrestricted report definitions. Index tenant/key/status/nextRunAt/checkpoint.

## Runtime roles
`api` serves definition/query/export control-plane operations; `consumer` applies domain events; `worker` builds projections and exports; `scheduler` claims due report schedules and retention jobs; all use one service source tree with bounded concurrency/leases.

## Security
Tenant filters are injected at compilation and cannot be removed by callers. Field-level authorization is evaluated by IAM. Export artifact access uses short-lived signed URLs and object classification. Logs/traces exclude row data and recipient lists. Arbitrary SQL, filesystem paths and provider credentials are never accepted in report definitions.

## Reliability
Projection consumers use bounded retries/DLQ. Rebuilds checkpoint progress and can resume after crash. Export jobs have finite retry budgets. Schedule dispatch is idempotent by schedule occurrence ID. Object storage failure leaves export job pending/retryable.

## Observability
Metrics: report query latency/cost, projection lag, event failures, rebuild duration, export throughput/size, schedule lag and failed jobs. OTel spans connect query/projection/export operations while excluding sensitive row data.

## Testing
Definition/query AST validation; authorization; tenant isolation; projection replay/determinism; stale-event guards; rebuild/cutover; export size/expiry/checksum; scheduled occurrence idempotency; large-query limits; provider/object failures; migrations and load tests.

## Implementation phases
1. Scaffold/contracts/database/read-model framework.
2. Report definition compiler and query API.
3. Event projections/replay/rebuild.
4. Export jobs/object storage.
5. Schedules and delivery integration.
6. Security/observability/load/failure verification.

## Exit criteria
- No report can execute arbitrary SQL.
- Projections are replayable and version-guarded.
- Tenant and field authorization applies to every query/export.
- Large exports are durable, checksummed and resumable.
- Analytics remains a separate analytical truth layer.
