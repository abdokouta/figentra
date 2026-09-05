# Identity Service — Observability

## Gateway/service boundary
Gateway records edge transport facts: route, upstream, status, edge latency, rate-limit outcome and propagated IDs. Identity records authentication/application facts: operation, principal outcome, provider result, session/replay state and domain result. Neither duplicates the other's authority.

## Logs
Structured JSON logs include timestamp, level, service, runtime role, request/correlation/causation IDs, operation, result, latency and safe principal/tenant identifiers. Tokens, cookies, credentials, provider payloads and authentication secrets are always redacted. A valid Gateway request ID is preserved.

## Metrics
Authentication attempts/success/failure; token verification; provider latency/error/timeout; sessions; replay; identity linking; delegation; service identity; webhooks; queue/outbox/job/DLQ; HTTP latency; DB saturation; Gateway-propagation failures and direct-ingress authentication failures.

## Tracing
OTel spans cover HTTP, provider calls, token verification, DB, NATS, jobs and reconciliation. Continue W3C trace/correlation/causation context from Gateway. Never attach token values or sensitive claims.

## SLOs
99.95% API availability excluding intentional 4xx; p95 token verification under 150ms locally; p95 authentication orchestration under 500ms excluding provider SLA; outbox age under 30s.

## Alerts
Authentication failure spikes, provider outage/latency, replay spikes, webhook rejection, outbox/DLQ, DB exhaustion, readiness failure, SLO burn and broken trace/request propagation.

## Audit
Security-significant identity mutations emit durable Audit facts. Logs/traces remain telemetry and are never treated as audit evidence.