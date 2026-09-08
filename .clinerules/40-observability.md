# Cline Rule: Observability and Signals

## Signal ownership
- Logger = operational/application logs.
- OpenTelemetry = technical traces and metrics.
- Tracking = behavioral/product collection.
- Analytics = analytical interpretation and metrics.
- Marketing = campaign decisions and activation.
- Audit = durable governance records.
- Usage = metering.
- Domain events = business facts.
- Notifications = delivery.

Never collapse these into a generic event/logging system.

## OpenTelemetry
Instrument API, worker and scheduler runtimes with OpenTelemetry. Propagate W3C trace context end to end. Preserve request ID and correlation ID across async boundaries.

## Gateway boundary
Cloudflare Gateway emits edge transport telemetry: route, method, status, latency, edge region, upstream, rate-limit result and worker failures. Services emit application/domain telemetry. The central observability system correlates them by trace/request/correlation IDs.

## Logging
Logs are structured. Include service, module, operation, environment, request ID, trace ID and relevant tenant/principal identifiers only when safe. Never log secrets, tokens, credentials, raw authorization headers, or sensitive payloads unnecessarily.

## Metrics
Every runtime exposes health/readiness and operational metrics. HTTP services expose request rate, latency and errors. Workers expose consumer lag, throughput, processing latency, retries and dead letters. Schedulers expose dispatch count, lateness, failures and duration.

## Audit separation
Do not turn every log into an audit record. Audit records are explicit durable governance facts with attribution, tenant context, integrity and retention semantics.

## Failure behavior
Observability failure must not normally take business traffic down. Use bounded buffers, backpressure and graceful degradation. Never add an observability dependency that creates a circular runtime dependency.
