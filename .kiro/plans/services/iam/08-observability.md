# IAM Service — Observability

## Gateway/service boundary
Gateway logs transport facts; IAM logs authorization/application facts. IAM does not duplicate edge telemetry and does not depend on Gateway logs for security decisions.

## Logs
Structured logs include operation, tenant, principal/actor identifiers where safe, action/resource, result, reason code, policy version, latency and request/correlation IDs. Propagated IDs remain stable. Never log policy secrets or unbounded attributes.

## Metrics
Authorization checks/allow/deny, p50/p95/p99, evaluator errors, policy publication, grant expiry, cache hit/miss, invalidation lag, stale rejects, DB/NATS/outbox/DLQ, direct-ingress failures and trace propagation failures.

## Tracing
OTel spans cover check/check-many, policy resolution/evaluation, cache, repositories, outbox, NATS and jobs. Continue W3C trace/correlation/causation context from Gateway. No sensitive policy values as attributes.

## SLOs
99.99% authorization availability excluding client errors; p95 local decision under 50ms and p99 under 100ms for cacheable decisions; invalidation under 30s; outbox age under 30s.

## Alerts
SLO burn, deny/error anomaly, evaluator failures, stale-version rejects, cache invalidation lag, DB saturation, stream lag, outbox/DLQ, direct-ingress anomalies and propagation failures.

## Audit
Administrative IAM mutations and configured security-significant authorization events go to Audit. Telemetry remains separate from durable evidence.