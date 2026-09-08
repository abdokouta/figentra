# Reporting — Data Model

PostgreSQL control-plane entities: `ReportDefinition`, `ReportVersion`, `DatasetDefinition`, `MetricDefinition`, `DimensionDefinition`, `Schedule`, `ReportExecution`, `ExportJob`, `QueryPlan`, `ProjectionCheckpoint`.

OpenSearch projections: `facts-*`, `dimensions-*`, `aggregates-*`. Every document carries tenant, source entity identity/version, event metadata and reportable fields. Financial source facts preserve source precision/currency and reference the authoritative source record.