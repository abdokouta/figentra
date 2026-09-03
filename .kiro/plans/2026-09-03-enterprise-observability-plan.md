---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra enterprise observability — logs, metrics, traces, telemetry context and operational monitoring

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0092, ADR-0021  
**Depends on:** `@stackra/contracts`, `@stackra/logger`, `@stackra/errors`, `@stackra/container`, `@stackra/config`  
**Design effort:** 22 days across 10 phases

## Purpose

Define one operational observability architecture for every Figentra runtime. OpenTelemetry is the canonical telemetry model for traces, metrics, resource/context propagation and telemetry correlation. The logger remains the ergonomic application logging API and integrates with the same trace/resource context.

The target signals are:

```text
LOGS       → structured application/system logs
TRACES     → distributed request/job/message execution paths
METRICS    → quantitative operational measurements
BAGGAGE    → explicitly propagated low-volume execution context
AUDIT      → durable security/business accountability records
```

Product/ad behavioral telemetry is deliberately outside this boundary and belongs to `@stackra/tracking`. Analytical storage/query belongs to `@stackra/analytics`. Marketing activation belongs to `@stackra/marketing`.

## Non-goals

- Product/ad event collection or consent SDK.
- Business analytics warehouse, attribution dashboards or BI ownership.
- Marketing campaigns or customer journeys.
- Durable security/business audit storage ownership.
- Billing/usage metering.
- Vendor-specific dashboard ownership inside the library package.

## Boundary rules

### `@stackra/logger`

Owns the developer-facing logging API, log levels, structured entries, logger context, redaction pipeline, sinks and logger-specific lifecycle.

### `@stackra/observability`

Owns OpenTelemetry context, tracer/meter abstractions, SDK lifecycle, instrumentation helpers, resource detection, propagators, exporters, sampling policy, telemetry processors and cross-signal correlation.

### Infrastructure/operations

Owns the OpenTelemetry Collector deployment, telemetry backends, retention, dashboards, alert rules, SLOs, recording rules, on-call routing and capacity policies.

### Audit

Owns immutable security/business accountability records. Audit is not reconstructed from logs or traces and is not sampled away when compliance requires the record.

### Tracking

Owns user/product/ad behavioral collection and consent. Tracking events are not automatically emitted for every operational span/log/metric.

### Analytics

Owns durable ingestion, aggregation, attribution, analytical read models and analytical queries. It may consume tracking/domain events but never becomes the source of operational telemetry.

## Manager pattern

`ObservabilityManager` coordinates the configured OTel SDK lifecycle and instrumentations. `MeterManager` and `TracerManager` provide configured instances; exporter/processor instances are managed through the canonical multi-instance manager pattern where multiple providers are configured.

No package-level singleton may hide tenant/request state.

## Subpath layout

```text
packages/observability/
├── src/core/
│   ├── context/                  # trace/span/baggage/request correlation
│   ├── metrics/                  # meters/instruments + conventions
│   ├── tracing/                  # tracer/span helpers
│   ├── propagation/              # W3C Trace Context + baggage
│   ├── resources/                # service/runtime/deployment resource attrs
│   ├── instrumentation/          # HTTP/DB/NATS/queue/runtime helpers
│   ├── sampling/                 # parent/rate/error-aware sampling policy
│   ├── processors/               # enrichment/filter/redaction
│   ├── exporters/                # provider-neutral exporter contracts
│   ├── audit/                    # audit boundary integration only
│   ├── errors/
│   ├── lifecycle/
│   └── index.ts
├── src/otel/                     # OpenTelemetry SDK implementation
├── src/nestjs/                   # Nest lifecycle/interceptors/instrumentation
├── src/worker/                   # Worker context + waitUntil flushing
├── src/browser/                  # browser-safe tracing/metrics hooks
├── src/react/                    # React instrumentation helpers
├── src/native/                   # React Native instrumentation helpers
├── src/desktop/                  # Electron/Tauri instrumentation helpers
├── src/testing/                  # deterministic telemetry fixtures/exporters
└── __tests__/
```

## Contracts / API

`@stackra/contracts/observability` owns:

- `IObservabilityContext`
- `ITracer`, `ISpan`, `ISpanContext`
- `IMeter`, `ICounter`, `IHistogram`, `IUpDownCounter`
- `ITelemetryExporter`, `ITelemetryProcessor`
- `IResourceAttributes`
- `IInstrumentation`
- `IAuditEvent` / audit integration contracts where shared
- `OBSERVABILITY`, `TRACER`, `METER`, `TELEMETRY_CONTEXT` tokens

Public operations are intentionally small:

```ts
startSpan(name, options?): SpanHandle
getTracer(name, version?): ITracer
getMeter(name, version?): IMeter
withContext(context, fn)
getContext()
recordMetric(...)
flush(options?)
shutdown(options?)
```

The package does not expose raw vendor SDK types from its root export.

## Locked telemetry context

Every executable boundary propagates, where technically applicable:

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

Tenant/principal/application identifiers are added only when safe and explicitly allowlisted. Never put raw tokens, cookies, credentials or secrets in baggage, span attributes or metric labels.

Use W3C Trace Context as the cross-runtime propagation protocol. Async queue/NATS/workflow jobs create a child execution context and preserve trace/correlation/causation relationships explicitly.

## Signal semantics

| Signal | Owner | Durable? | Sampling | Primary use |
|---|---|---:|---:|---|
| Logs | logger + OTel integration | backend-defined | level/filter based | diagnostics |
| Traces | observability | backend-defined | yes, policy-controlled | distributed execution |
| Metrics | observability | backend-defined | generally no per-event sampling | SLO/capacity/health |
| Audit | audit boundary | yes | no for mandatory records | accountability |
| Tracking | tracking | yes/retained analytically | consent/policy | product/ad behavior |
| Analytics | analytics | yes | event/data policy | analysis/attribution |

## Required instrumentation

Day one instrumentation covers:

- inbound/outbound HTTP;
- NestJS request lifecycle;
- Cloudflare Worker request lifecycle;
- NATS publish/consume/request-reply;
- queue enqueue/consume/retry/DLQ;
- database queries and connection-pool health;
- ORM operations at bounded/high-value granularity;
- external provider calls;
- object storage operations;
- cache operations where latency/failure is operationally relevant;
- authentication/identity operations without credential values;
- workflow/job execution;
- notification delivery;
- sync/search/media processing;
- runtime/process/container/Worker resource signals where supported.

Business-domain spans are opt-in and must not turn every domain event into telemetry.

## Metrics standard

Use OTel semantic conventions first. Custom Figentra metrics use stable names, documented units and bounded attributes. Never use unbounded tenant IDs, principal IDs, request IDs, URLs with arbitrary paths, message IDs or other high-cardinality values as metric dimensions.

Required platform metric families include:

```text
http.*
service.*
db.*
messaging.*
queue.*
worker.*
cache.*
external.*
auth.*
notification.*
```

SLO metrics are derived from operational metrics, not from log scraping where a direct metric is possible.

## Logs

`@stackra/logger` remains the primary application logging API. Observability provides correlation/export integration so logs can carry trace/span/resource context without forcing applications to depend directly on OTel vendor APIs.

Required structured fields include level, timestamp, service resource, environment, message/event name and safe request/correlation/trace context.

Central redaction runs before export. Error objects use canonical `@stackra/errors` serialization. Logging must fail open for normal business execution, with bounded emergency fallback behavior.

## Traces

Tracing is mandatory at platform transport boundaries. HTTP, NATS, queues and workflows propagate parent context and create spans around meaningful operations.

Span attributes follow OTel semantic conventions. Authentication credentials, raw authorization headers, full request bodies and arbitrary PII are forbidden unless explicitly classified safe.

Sampling is configurable by environment but must support deterministic rules for errors and compliance-required operations. Sampling never controls audit persistence.

## Monitoring / operations

Monitoring is **not another platform package**. It is the operational system built on observability output.

Infrastructure plans MUST define:

- OpenTelemetry Collector topology;
- OTLP endpoints and authentication;
- telemetry routing by environment;
- metrics backend;
- trace backend;
- log backend;
- retention and deletion policy;
- dashboards;
- alert rules;
- SLO/SLI definitions;
- alert severity and ownership;
- dead-letter/backlog alerts;
- exporter/collector health alerts;
- telemetry-loss detection.

Application packages expose instrumentation and health signals; they do not own organization-wide dashboards.

## Security / privacy

- Redact secrets centrally.
- Do not send credentials or authentication tokens to telemetry backends.
- Treat tenant/principal IDs as sensitive context and allowlist their use.
- Do not use PII/high-cardinality identifiers as metric labels.
- Tracking consent does not automatically govern mandatory operational/security telemetry; each signal follows its own legal/security policy.
- Audit access is separately authorized and immutable.
- Telemetry export credentials are infrastructure secrets and never package configuration literals.

## Errors / recovery

Telemetry exporters are non-blocking for normal application execution. Use bounded queues/buffers, explicit overflow policy and `waitUntil`/shutdown drains where supported.

Exporter/collector outage must not take down business traffic. If mandatory audit persistence fails, the audit boundary decides fail-open/fail-closed behavior according to the operation's compliance classification.

## Concurrency / resource limits

- Bound in-memory telemetry buffers.
- Batch exports with size/time limits.
- Bound exporter concurrency.
- Drop lower-priority telemetry first under pressure.
- Never block request handling indefinitely on telemetry export.
- Apply CPU/memory limits to instrumentation overhead and test them.

## Runtime matrix

| Runtime | Day-one role |
|---|---|
| Node/NestJS | full OTel SDK + auto/manual instrumentation + graceful flush |
| Cloudflare Worker | request/context instrumentation with Worker-compatible exporters/buffering |
| Browser/React | selected client traces/metrics with privacy and sampling limits |
| React Native | app/network lifecycle telemetry with offline-safe bounded buffering |
| Desktop | process/app/IPC/network telemetry with local failure isolation |
| Test | deterministic in-memory exporter and context assertions |

## Testing / conformance

- trace parent/child propagation across HTTP → NATS → worker;
- correlation between logs and spans;
- metric naming/unit/cardinality tests;
- redaction negative tests;
- exporter outage/fill/drop behavior;
- graceful shutdown/flush tests;
- Worker `waitUntil` behavior;
- concurrent request context isolation;
- instrumentation does not leak raw credentials;
- OTel semantic convention conformance where applicable;
- smoke test against a real collector in CI with ephemeral credentials;
- load test instrumentation overhead and memory bounds.

## Persistence / compatibility

Operational telemetry retention is backend/operations-owned. The package does not create a second telemetry database.

Telemetry attribute names and propagation fields are compatibility contracts. Changes require migration notes and dashboard/query impact review.

## Dependencies / exports / versioning

OTel SDK/exporter packages are isolated behind `/otel` and provider-specific subpaths. Root consumers depend on Figentra contracts rather than raw OTel SDK objects. Runtime adapters are explicit.

## Phases

1. Contracts/context model (2d)
2. OTel SDK lifecycle/resource model (3d)
3. Tracing/propagation (3d)
4. Metrics/instrumentation (3d)
5. Logger/error correlation and redaction (2d)
6. Nest/Worker/browser/native/desktop runtime adapters (3d)
7. Export/buffering/failure controls (2d)
8. Audit integration and security policy (1d)
9. Conformance/load tests (2d)
10. Operations dashboards/SLO specification and docs (1d)

Every phase includes implementation files, contracts, tests, observability of the observability pipeline itself, security controls and migration impact before completion.

## Exit criteria

Every supported runtime emits correlated operational logs, traces and metrics; HTTP/messaging/queue/database boundaries propagate context; telemetry is bounded and redacted; exporter failure cannot take down business traffic; audit remains durable and separate; and tracking/analytics/marketing remain cleanly outside operational observability.

## Cross-references

`2026-09-03-logger-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-tracking-package.md`, `2026-09-03-analytics-package.md`, `2026-09-03-marketing-package.md`, `2026-09-03-enterprise-security-plan.md`.
