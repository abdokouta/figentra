# Audit Service — Observability

## Gateway/service boundary
Gateway logs transport facts; Audit logs operational/application facts. Audit never uses Gateway telemetry as authoritative evidence.

Logs contain operation, tenant, event type, record ID, result, latency and propagated correlation/request IDs; never raw restricted audit payloads, credentials or secrets. Valid Gateway request IDs remain stable.

Metrics: ingestion rate/lag, duplicates, append latency, hash/integrity failures, export throughput/failure, retention/archive/delete, legal holds, DB latency, outbox and DLQ, direct-ingress failures and trace propagation failures.

OTel spans cover ingestion, validation, dedupe, hash, DB append, exports, integrity, archive/delete, NATS and jobs. Continue W3C trace/correlation/causation context from Gateway. Sensitive fields are never span attributes.

SLOs: 99.95% query availability; p95 indexed query under 300ms; ingestion lag p95 under 30s; integrity jobs within configured windows; export backlog has explicit target.

Alerts: integrity/hash failure, ingestion lag, DLQ, export failures, DB saturation, outbox/retention backlog, SLO burn and broken propagation.

Observability remains separate from durable audit evidence.