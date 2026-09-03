# Observability Package — Kiro Implementation Specification

**Package:** `@figentra/observability`  
**Path:** `packages/observability`  
**Purpose:** Operational observability: OpenTelemetry context, traces, metrics, instrumentation, exporters and correlation across all supported runtimes.

## 1. Boundary

This package is the operational telemetry boundary. It owns **logs integration, traces, metrics, context propagation, instrumentation and exporter lifecycle**, but does not own product/ad tracking, analytics, marketing, billing usage or durable audit storage.

`@figentra/logger` remains the ergonomic application logging API. Observability integrates logger output with OTel/resource/trace context.

Monitoring means the operational system built on telemetry: collector deployment, backends, dashboards, alerts, SLOs and on-call configuration belong to infrastructure/operations, not this library.

## 2. API design

- Use OpenTelemetry as the canonical telemetry model.
- Use W3C Trace Context for distributed propagation.
- Root exports are provider-neutral; raw vendor SDK types are not public contracts.
- Use stable semantic names and bounded attributes.
- Never expose secrets through telemetry APIs.

## 3. Source layout

```text
src/
├── core/
│   ├── context/
│   ├── propagation/
│   ├── resources/
│   ├── tracing/
│   ├── metrics/
│   ├── instrumentation/
│   ├── sampling/
│   ├── processors/
│   ├── exporters/
│   ├── lifecycle/
│   └── index.ts
├── otel/
├── nestjs/
├── worker/
├── browser/
├── react/
├── native/
├── desktop/
└── testing/
```

## 4. Contracts

`@figentra/contracts/observability` owns:

- `IObservabilityContext`
- `ITracer`, `ISpan`, `ISpanContext`
- `IMeter`, `ICounter`, `IHistogram`, `IUpDownCounter`
- `ITelemetryExporter`, `ITelemetryProcessor`
- `IResourceAttributes`
- `IInstrumentation`
- `OBSERVABILITY`, `TRACER`, `METER`, `TELEMETRY_CONTEXT` tokens

## 5. Signal ownership

| Signal | Owner | Meaning |
|---|---|---|
| Logs | `@figentra/logger` + OTel integration | operational/application diagnostics |
| Traces | `@figentra/observability` | distributed execution path |
| Metrics | `@figentra/observability` | operational measurements/SLOs |
| Audit | audit service/boundary | immutable accountability |
| Tracking | `@figentra/tracking` | product/ad behavioral collection |
| Analytics | `@figentra/analytics` | durable analytical facts/read models |
| Marketing | `@figentra/marketing` | campaigns/activation |
| Usage | Usage service | billable metering |

These signals MUST NOT be reconstructed from each other by default.

## 6. Required instrumentation

Day-one instrumentation covers:

- HTTP server/client;
- NestJS lifecycle;
- Cloudflare Worker lifecycle;
- NATS publish/consume/request-reply;
- queue enqueue/consume/retry/DLQ;
- database and connection-pool operations;
- ORM operations at bounded granularity;
- external provider calls;
- object storage operations;
- cache operations when operationally relevant;
- authentication/identity operations without credentials;
- workflow/job execution;
- notification delivery;
- sync/search/media processing;
- runtime/process/container/Worker resource signals where supported.

## 7. Context propagation

Every execution boundary propagates, where applicable:

```text
trace_id
span_id
trace_flags
trace_state
request_id
correlation_id
causation_id
service.name
service.version
deployment.environment.name
service.instance.id
```

Tenant/principal/application identifiers are allowlisted and treated as sensitive context. Never place tokens, cookies, credentials or secrets in baggage, span attributes or metric labels.

Async jobs create child execution context and preserve parent/correlation/causation relationships.

## 8. Metrics

Use OpenTelemetry semantic conventions first. Custom Figentra metrics require documented units and bounded attributes. High-cardinality IDs such as request ID, message ID and arbitrary URLs MUST NOT be metric labels.

Core operational families include HTTP, service, database, messaging, queue, worker, cache, external dependency and authentication metrics. Business/product metrics belong to analytics or the owning domain, not operational OTel metrics.

## 9. Logs

The logger emits structured records with trace/span/resource context. Redaction occurs before export. Canonical errors are serialized through the errors boundary.

Logging/telemetry failure is non-fatal to normal business execution and uses bounded fallback behavior.

## 10. Traces

Trace spans are mandatory at HTTP, messaging, queue and other distributed execution boundaries. Attributes follow OpenTelemetry semantic conventions. Raw request bodies and authorization material are prohibited unless an explicit safe schema exists.

Sampling is configurable by environment but must preserve error/diagnostic policy. Sampling never controls mandatory audit records.

## 11. Runtime matrix

| Runtime | Role |
|---|---|
| Node/NestJS | full SDK, auto/manual instrumentation, graceful flush |
| Worker | Worker-compatible context/instrumentation and bounded `waitUntil` export |
| Browser/React | selected client tracing/metrics with privacy/sampling limits |
| React Native | app/network telemetry with bounded offline behavior |
| Desktop | app/IPC/network telemetry with failure isolation |
| Test | deterministic in-memory exporters and context assertions |

## 12. Export and infrastructure boundary

The library defines exporter interfaces and runtime adapters. Infrastructure owns the OpenTelemetry Collector topology, OTLP endpoints, authentication, routing, telemetry backends, retention, dashboards, alerting, SLOs and on-call integration.

Exporter/provider SDKs remain isolated under runtime/provider subpaths.

## 13. Security

- Central secret redaction.
- No authentication tokens, cookies or provider credentials in telemetry.
- No unbounded PII/high-cardinality metric labels.
- Tenant/principal context is allowlisted.
- Export credentials are infrastructure secrets.
- Operational telemetry and behavioral tracking have separate privacy policies.

## 14. Errors and recovery

Telemetry exporters use bounded buffers, batching, concurrency limits and explicit overflow/drop policy. Exporter/collector outage MUST NOT take down business traffic. Shutdown flushes within a hard deadline.

## 15. Testing

- HTTP/NATS/queue trace propagation.
- Log ↔ trace correlation.
- Metric naming/unit/cardinality tests.
- Redaction negative tests.
- Exporter outage/drop/backpressure tests.
- Shutdown/flush tests.
- Worker `waitUntil` tests.
- Concurrent context isolation.
- Credential leakage tests.
- Real collector smoke test in CI with ephemeral credentials.

## 16. Versioning

Telemetry context and semantic attributes are compatibility contracts. Breaking changes require migration notes and operational dashboard/query impact review.

## 17. Acceptance

`lint` + `typecheck` + `test` + `build` + export validation pass; all distributed boundaries propagate trace context; logs correlate with traces; operational metrics remain bounded; exporters fail safely; and tracking/analytics/marketing/audit remain separate.
