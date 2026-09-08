# Reporting Service

Reporting is Figentra's analytical/report-definition service. Source business services remain authoritative; Reporting consumes domain events, builds denormalized analytical projections in OpenSearch, compiles report definitions into provider queries, applies explicit business metrics/calculations, and renders/export results.

## Storage boundary

- PostgreSQL: report metadata, versions, datasets, metrics, dimensions, schedules, executions, permissions and checkpoints.
- OpenSearch: reporting facts, dimensions and analytical projections; rebuildable and non-authoritative.
- S3: generated XLSX/CSV/PDF and other durable report artifacts.
- SQS/platform messaging: asynchronous execution and projection jobs.

## Index ownership

Reporting owns `facts-*`, `dimensions-*` and `aggregates-*`. Search owns `search-*`. Business services never write reporting indexes directly.

## Execution

OpenSearch handles filters, buckets, grouping, metrics and aggregations. Reporting's calculation engine handles composed Figentra business metrics and formulas. Authoritative financial/business semantics remain in source services.

## Provider posture

The application uses `ReportingQueryProvider` and `ReportingProjectionStore` ports. Initial implementation is Amazon OpenSearch Service, with provider-specific capability adapters isolated behind infrastructure boundaries.