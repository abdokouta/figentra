# Reporting — Runtime Manifest

Roles: `api`, `consumer`, `worker`, `scheduler`. API covers reports/query/metrics/exports/schedules/jobs. Consumers ingest domain events. Workers execute large reports, exports, rebuilds and aggregates. Scheduler triggers scheduled reports/maintenance. Dependencies: PostgreSQL, OpenSearch, S3, messaging, IAM and observability.