# Audit Service — Observability

Logs contain operation, tenant, event type, record ID, result, latency, correlation ID and job state; never raw audit payloads containing restricted values, credentials or secrets.

Metrics: ingestion rate/lag, duplicate rate, append latency, hash failures, integrity-check failures, export throughput/failure, retention/archive/delete throughput, legal holds, DB latency, outbox age and DLQ depth.

OTel spans cover ingestion, validation, deduplication, hash computation, DB append, exports, integrity checks, archive/delete, NATS and jobs. Sensitive record fields are not span attributes.

SLOs: 99.95% query API availability; p95 query under 300ms for indexed filters; ingestion lag p95 under 30s; integrity-check jobs complete within their configured window; export backlog has an explicit operational target.

Alerts: hash/integrity failure, ingestion lag, DLQ growth, export failures, DB saturation, outbox age, retention backlog and SLO burn.

Observability is not the authoritative audit record; durable evidence is stored in audit tables.