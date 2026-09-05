# Registry — Observability

## Logs

Structured JSON logs include requestId, correlationId, traceId, applicationId, environmentId, publicationId, operation, route, status, duration and safe error code. Never log credentials, authorization headers, raw manifests or sensitive claims.

## Metrics

Request count/error/latency; D1 latency/errors; KV hit/miss/errors; publication success/failure/conflict; manifest validation failures; resolution failures; rate-limit rejects; cache invalidations; reconciliation lag.

## Tracing

Create Worker request span, validation span, D1 operation spans and publication/resolution spans. Propagate W3C trace context through Service Bindings and authenticated upstream calls. Sampling must retain errors and publication operations.

## SLO

Define availability, p95/p99 read latency, publication success latency, error budget and cache-resolution objectives per environment. Alerts cover sustained 5xx, D1 failure, publication conflicts spike, resolution failures, cache corruption and error-budget burn.

## Privacy

Telemetry is metadata-only and redacted. Dashboards use aggregate dimensions and do not expose tenant secrets or manifest contents.