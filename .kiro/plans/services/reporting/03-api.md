# Reporting — API

Routes: `POST /v1/reports`, `GET /v1/reports/:id`, `POST /v1/reports/:id/run`, `POST /v1/reports/query`, `GET /v1/metrics`, `POST /v1/exports`, `POST /v1/reports/:id/schedules`, `GET /v1/jobs/:id`.

Requests describe dimensions, measures, filters, sorting, time windows, pagination and export format. No raw OpenSearch DSL is accepted. Run responses return a typed result schema or asynchronous job reference.