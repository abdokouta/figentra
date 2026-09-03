---
status: canonical
component: service
name: reporting
---
# Reporting Service — implementation plan

Own operational/reporting read models and report generation. Analytical truth remains Analytics; transactional ownership remains with domain services.

## Modules
`report-definition`, `query`, `read-model`, `export`, `schedule`, `access`, `persistence`, `http`, `messaging`.

## Runtime
NestJS `api` for report catalog/query/export initiation; `consumer` for source events; `worker` for materialization and large exports; `scheduler` for scheduled reports.

## Contracts
Versioned report/query/export contracts in `@stackra/contracts`; report definitions validate against allowed fields and tenant scopes.

## Persistence/reliability
Dedicated read-model storage; projections are replayable and versioned; exports use durable job records, object storage and signed retrieval. Idempotent projections, retry/DLQ and rebuild/reconciliation are mandatory.

## Security / observability
Tenant-scoped query enforcement, field-level authorization, export access control and retention. OTel query/export latency, failures, backlog and projection lag; no sensitive row data in telemetry.

## Testing/deployment
Contract, query authorization, projection replay, large-export, concurrency, migration and isolation tests. Docker roles + Terraform resources, readiness and graceful shutdown.

## Exit criteria
Deterministic report definitions/read models, secure exports and replayable projections with production operational controls.
