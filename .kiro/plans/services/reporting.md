---
status: canonical
component: service
service: reporting
version: v1
runtime: nestjs
---
# Reporting Service — implementation-complete plan

## Mission
Provide operational reports over service-owned read models. Reporting owns report definitions, projections, query/export jobs and schedules. Analytics owns analytical facts/metrics; transactional services remain authoritative for business writes.

## Models
`ReportDefinition(id,tenantId,key,version,status,columns,filters,sort,authorizationProfile)`; `ReportView(id,definitionId,tenantId,refreshMode,lastBuiltAt,version)`; `ReportJob(id,tenantId,definitionId,requestedBy,status,cursor,objectRef)`; `ReportSchedule(id,tenantId,definitionId,cron,timezone,recipients,status,nextRunAt)`; `ProjectionCheckpoint(source,tenantId,version,updatedAt)`.

## DTOs/interfaces
`CreateReportDto`, `UpdateReportDto`, `ReportQueryDto`, `StartExportDto`, `ReportJobDto`, `ScheduleReportDto`. `ReportService.create/update/query`; `ProjectionService.apply/rebuild`; `ExportService.start/status`; `ScheduleService.create/pause/resume`.

## API
`GET/POST/PATCH/DELETE /v1/reports`; `POST /v1/reports/:key/query`; `POST /v1/reports/:key/exports`; `GET /v1/report-jobs/:id`; `POST/DELETE /v1/report-schedules`.

## Data model/projections
Source domain events update versioned read models through idempotent projections. A projection checkpoint advances only after the corresponding batch is committed. Rebuild creates a new projection version and swaps it after validation. Report definitions reference allowlisted fields rather than arbitrary SQL.

## Identity/IAM/Tenant
Identity establishes principal context. IAM authorizes report administration, protected columns, execution and exports. Tenant isolation is mandatory in definition, projection, query and export paths. Recipient lists for scheduled reports are validated against IAM/notification contracts.

## Exports
Small results may stream through API within strict row/byte limits. Large exports create durable jobs and write to Files/object storage, returning short-lived signed retrieval. Export artifacts inherit tenant/classification/retention rules.

## Persistence
PostgreSQL metadata/read models: `report_definitions`, `report_views`, `report_jobs`, `report_schedules`, `projection_checkpoints`, `outbox`. Index tenant/key/status/nextRunAt. Large report rows remain in projection/read storage, not transactional source tables.

## Workers/scheduler
Consumer applies source events; worker builds projections and exports; scheduler claims due schedules. All roles use the same NestJS service source tree with bounded concurrency and leases.

## Security/reliability
Field-level allowlists, row-level tenant filters, query cost limits, export authorization, idempotent projections, retry/DLQ, rebuild checkpoints and reconciliation. No arbitrary SQL from report definitions.

## Observability
Query latency/cost, projection lag, export throughput, failed jobs, schedule lag and read-model drift. Sensitive row data is excluded from logs/traces.

## Testing
Definition validation, authorization, projection replay/determinism, schema evolution, export limits, scheduled execution, duplicate events, tenant isolation, rebuild cutover and migration tests.

## Completion gate
Operational reporting is replayable and tenant-safe; analytics is not duplicated; exports are durable and access-controlled; no report definition can execute unrestricted database queries.