# Identity Service — Observability

## Logs
Structured JSON logs include timestamp, level, service, runtime role, request/correlation/causation IDs, operation, result, latency, provider, principal ID where safe, and tenant ID where safe. Tokens, cookies, credentials, provider payloads and authentication secrets are always redacted.

## Metrics
Required metrics: authentication attempts/success/failure; token verification count/failure; provider latency/error/timeout; session creation/refresh/revocation; replay detections; identity-link attempts; delegation lifecycle; service-identity rotation/revocation; webhook accepted/rejected/duplicate; queue depth; outbox age; job retries/DLQ; HTTP p50/p95/p99; database pool saturation.

## Tracing
OTel spans cover HTTP handlers, provider calls, token verification, database transactions, NATS publish/consume, jobs and reconciliation. Propagate trace, correlation and causation context. Never attach token values or sensitive claims.

## SLOs
Production targets: 99.95% successful API availability excluding intentional 4xx; p95 token verification under 150ms locally and p95 authentication orchestration under 500ms excluding provider SLA; outbox publication age under 30s; provider-event processing p95 under 60s.

## Alerts
Alert on sustained authentication failure spikes, provider outage/latency, replay spikes, webhook rejection spikes, outbox age, DLQ growth, database exhaustion, readiness failure and SLO burn rate.

## Audit
Security-significant identity mutations emit durable audit facts through the Audit contract. Observability telemetry is not the audit record.