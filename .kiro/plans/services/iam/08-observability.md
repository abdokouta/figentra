# IAM Service — Observability

## Logs
Structured logs include operation, tenant, principal/actor identifiers where safe, action/resource, result, reason code, policy version, latency and correlation IDs. Never log policy secrets or unbounded attribute values.

## Metrics
Authorization checks, allow/deny, p50/p95/p99 latency, evaluator errors, policy publication, grant expiry, cache hit/miss, invalidation lag, stale-version rejects, DB latency, NATS lag, outbox age and DLQ depth.

## Tracing
OTel spans cover check/check-many, policy resolution/evaluation, cache access, repository transactions, outbox publication, NATS consumers and jobs. Propagate correlation/causation/trace context.

## SLOs
Target 99.99% availability for authorization checks excluding client errors; p95 local decision under 50ms and p99 under 100ms for cacheable decisions; invalidation propagation under 30s; outbox age under 30s.

## Alerts
SLO burn, deny/error anomaly, evaluator failures, stale-version rejects, cache invalidation lag, database saturation, stream lag, outbox age and DLQ growth.

## Audit
Administrative IAM mutations and configured security-significant authorization events are emitted to Audit. Telemetry remains separate from durable audit evidence.