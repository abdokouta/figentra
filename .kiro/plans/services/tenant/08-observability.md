# Tenant Service — Observability

Structured logs: operation, tenant, principal/actor IDs where safe, lifecycle transition, status, request/correlation IDs, latency and outcome. Never log domain challenges, credentials or secrets.

Metrics: tenant creation/lifecycle transitions, membership mutations, domain verification attempts/success/failure, context resolution latency, DB pool use, NATS/outbox age, job backlog/DLQ and API p50/p95/p99.

OTel spans cover controllers, application commands, repository transactions, domain verification calls, cache, outbox and consumers/jobs. Propagate trace/correlation/causation context.

SLOs: 99.95% API availability; p95 tenant context resolution under 100ms on warm path; domain verification processing p95 under 60s excluding external DNS propagation; outbox age under 30s.

Alerts: lifecycle failure spike, domain verification failures, context latency/SLO burn, DB saturation, outbox age, stream lag, DLQ growth and reconciliation lag.

Security-significant lifecycle/membership/domain events go to Audit through the durable event contract.