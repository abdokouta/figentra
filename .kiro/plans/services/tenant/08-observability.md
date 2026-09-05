# Tenant Service — Observability

## Gateway/service boundary
Gateway records edge transport facts. Tenant records lifecycle, membership, domain and context-resolution application facts. Tenant never depends on Gateway telemetry for correctness.

Structured logs include operation, tenant, principal/actor IDs where safe, lifecycle transition, status, request/correlation IDs, latency and outcome. Valid propagated IDs remain stable. Never log challenges, credentials or secrets.

Metrics: tenant creation/lifecycle, membership mutations, domain verification, context resolution, DB pool, NATS/outbox, job/DLQ, API p50/p95/p99, direct-ingress failures and propagation failures.

OTel spans cover controllers, commands, repositories, domain verification, cache, outbox and consumers/jobs. Continue trace/correlation/causation context from Gateway.

SLOs: 99.95% API availability; p95 tenant context resolution under 100ms warm; domain verification p95 under 60s excluding DNS propagation; outbox age under 30s.

Alerts: lifecycle failure, domain verification failures, context latency/SLO burn, DB saturation, outbox/stream/DLQ, reconciliation lag and broken propagation.

Security-significant events go to Audit through durable contracts. Observability is never the audit record.