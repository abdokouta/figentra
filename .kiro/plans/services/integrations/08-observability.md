# Integrations Service — Observability

## Gateway/service boundary
Gateway logs transport facts; Integrations logs provider/connection/sync/reconciliation application facts. Integrations never depends on Gateway telemetry for correctness.

Logs include provider key, integration/connection IDs, tenant, operation, result, latency and propagated request/correlation IDs; secrets, tokens, bodies and sensitive response data are redacted. Valid Gateway IDs remain stable.

Metrics: outbound rate/latency/errors, timeout/rate-limit, webhook accepted/rejected/duplicate, sync lag, reconciliation discrepancies, provider availability, credential expiry, queue/outbox/DLQ, direct-ingress failures and propagation failures.

OTel spans cover controllers, provider adapters, outbound HTTP, webhook verification, DB, NATS, sync/reconciliation jobs. Continue W3C trace/correlation/causation context from Gateway.

SLOs: 99.95% API availability; p95 internal operation under 300ms excluding provider latency; webhook acceptance p95 under 1s; sync freshness and provider-specific error/rate budgets.

Alerts: provider outage, latency, rate saturation, webhook verification failures, sync/reconciliation lag, credential expiry, DLQ/outbox, SLO burn and broken propagation.

Security-significant connection/credential operations are sent to Audit.