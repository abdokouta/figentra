# Observability

## Access logs

One structured access record per completed request with requestId, correlationId, traceId, applicationId, serviceId, routeId, method, normalized path template, status, duration, upstream duration, retry count, rate-limit result and response size. Never log authorization headers, cookies, credentials or full bodies.

## Error logs

Structured error category, code, route, upstream class, retry state and safe cause. Stack traces remain server-side and are redacted appropriately.

## Metrics

Request count, status classes, latency histograms, upstream latency, authentication failures, rate-limit rejections, route misses, Registry refresh failures, binding failures, upstream timeouts, retries, circuit state, cache hit/miss and streaming connection counts.

## Tracing

Extract W3C trace context and create an edge span. Propagate trace context to services. Service spans continue the same trace rather than creating unrelated traces.

## Request/correlation IDs

Gateway generates requestId when absent and always returns it. Correlation ID is propagated consistently. Services consume the values and must not replace them for the same inbound request.

## Privacy

Telemetry is minimized, tenant-safe and credential-safe. Paths are normalized to templates where possible to avoid sensitive identifiers in metric cardinality.

## SLO

Define availability, route success rate, p95/p99 edge latency, upstream error rate and Registry freshness objectives. Alerts cover sustained breach, saturation and security-control failures.
