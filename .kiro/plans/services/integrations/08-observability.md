# Integrations Service — Observability

Logs include provider key, integration/connection IDs, tenant, operation, result, latency and correlation IDs; secrets, tokens, request bodies and sensitive response data are redacted.

Metrics: outbound request rate/latency/errors, timeout/rate-limit counts, webhook accepted/rejected/duplicate, sync throughput/lag, reconciliation discrepancy count, provider availability, credential expiry, queue/outbox age and DLQ depth.

OTel spans cover controller, provider adapter, outbound HTTP, webhook verification, DB transaction, NATS, sync/reconciliation jobs. Propagate correlation/causation/trace context.

SLOs: 99.95% API availability; p95 internal connection operation under 300ms excluding provider latency; webhook acceptance p95 under 1s; sync workers maintain configured freshness; outbound failure and rate-limit budgets are provider-specific and monitored.

Alerts: provider outage, latency spike, rate-limit saturation, webhook verification failures, sync lag, reconciliation drift, credential expiry, DLQ/outbox backlog and SLO burn.

Security-significant connection and credential operations are sent to Audit.