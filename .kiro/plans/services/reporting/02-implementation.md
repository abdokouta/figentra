# Reporting — Implementation

Modules: `reports`, `datasets`, `metrics`, `dimensions`, `calculations`, `queries`, `dashboards`, `exports`, `schedules`, `ingestion`, `indexes`.

Ports: `ReportingQueryProvider`, `ProjectionStore`, `ReportRepository`, `MetricRepository`, `ObjectStorage`, `JobQueue`, `AuthorizationPort`. Infrastructure contains OpenSearch, PostgreSQL, S3 and queue adapters. Controllers never expose provider DSL.