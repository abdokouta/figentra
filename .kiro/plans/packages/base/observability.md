---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/observability"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/config", "@stackra/contracts", "@stackra/support", "@opentelemetry/api"]
---
# `@stackra/observability` — implementation plan

## Purpose and boundary
Canonical OpenTelemetry boundary for traces, metrics, propagation and instrumentation. It owns telemetry context, SDK integration, sampling, exporters and runtime instrumentation. Logging is `@stackra/logger`; durable audit is Audit; behavioral analytics is Tracking/Analytics; dashboards/alerts/SLOs are infrastructure.

## Public API
```ts
interface Tracer {
  startSpan(name:string,options?:SpanOptions):SpanHandle;
  startActiveSpan<T>(name:string,fn:(span:SpanHandle)=>T):T;
}
interface Meter {
  counter(name:string,options?:MetricOptions):Counter;
  histogram(name:string,options?:MetricOptions):Histogram;
  gauge(name:string,options?:MetricOptions):Gauge;
}
interface Propagator { inject(carrier:Record<string,string>):void; extract(carrier:Record<string,string>):TelemetryContext; }
interface ObservabilityManager { initialize():Promise<void>; flush(deadlineMs:number):Promise<void>; shutdown():Promise<void>; }
```

## Source tree
```text
packages/observability/
├── src/core/{manager,context,tracing,metrics,propagation,attributes,sampling,index.ts}
├── src/instrumentation/{http,nats,nestjs,database,worker}
├── src/exporters/{otlp,console}
├── src/runtime/{node,browser,worker,native,desktop}
├── src/testing/{memory-exporter,test-context,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Context/propagation
Trace, span, request, correlation and causation context is propagated explicitly across HTTP, NATS and worker boundaries. Context never carries secret values. Tenant/principal attributes are optional and allowlisted. Baggage size is bounded.

## Instrumentation
HTTP creates client/server spans with sanitized URL/route metadata. NATS instruments publish/consume/ack and records delivery attempt. Database instrumentation records operation type and duration, not full SQL parameters. NestJS lifecycle integrates bootstrap/shutdown. Custom manual spans use the same tracer API.

## Metrics
Canonical metric types are counter, histogram and observable gauge. Attributes are allowlisted and cardinality-bounded. Untrusted IDs cannot become unbounded metric labels. Export names/units are stable and documented.

## Sampling/export
Production sampling is configuration-driven. Export uses OTLP where enabled, with bounded batch size, queue size, retry budget and shutdown flush deadline. Telemetry exporter failure never fails the business request. A circuit/failure state prevents infinite export retries.

## Security/privacy
No access tokens, API keys, raw audit records, passwords, secrets or uncontrolled PII may be emitted. URL/query/body attributes are sanitized by default. Sensitive attributes require an explicit classification allowlist. Telemetry payload size is bounded.

## Runtime behavior
Node/NestJS has full tracing/metrics/export support. Workers use invocation-safe context and flush deadlines. Browser/native instrumentation is restricted to client-safe attributes and configured exporters. Unsupported exporters/capabilities produce configuration errors rather than silent production loss.

## Reliability
Telemetry is best-effort. In-memory/export queues have hard bounds and backpressure/drop rules. Shutdown attempts a bounded flush. Export retry is only for transient failures. SDK initialization failure may degrade telemetry but must not bring down application startup unless the deployment explicitly marks observability mandatory.

## Error model
`ObservabilityConfigurationError`, `ExporterError`, `AttributeLimitError`, `TelemetryContextError`. Errors are reported through safe diagnostics and never replace business errors.

## Testing
Trace parent/child relationships, HTTP/NATS propagation, metric cardinality limits, attribute redaction, exporter outage/backoff, queue overflow, sampling, flush deadline and runtime conformance. Integration tests verify one trace across ingress→service→NATS→worker.

## Dependencies/exports
Core depends on OTel API only. SDK/exporter/runtime dependencies remain adapters. No package may directly initialize a second OTel SDK instance. Initialization ownership belongs to runtime bootstrap.

## Implementation phases
1. Core context/tracer/meter/propagation APIs.
2. Node/NestJS SDK bootstrap and OTLP export.
3. HTTP/NATS/database/worker instrumentation.
4. Sampling/security/cardinality controls.
5. Browser/native/desktop adapters.
6. Testing/failure/load/shutdown verification.

## Exit criteria
- One OTel implementation is used across runtimes.
- Trace propagation works across HTTP/NATS/worker boundaries.
- Metric cardinality and attribute safety are enforced.
- Exporter failure is bounded and non-fatal to business logic.
- No second telemetry framework or audit/logging implementation exists.
