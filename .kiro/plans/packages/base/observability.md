---
status: canonical
component: package
package: "@stackra/observability"
---
# `@stackra/observability` — implementation plan

Own OpenTelemetry SDK integration: tracing, spans, metrics, propagation, instrumentation, exporters and telemetry context. It is distinct from logging, audit, tracking and monitoring infrastructure.

## API/layout
`src/context`, `src/tracing`, `src/metrics`, `src/instrumentation`, `src/exporters`, `src/resources`, `src/sampling`, `src/runtime`, `src/index.ts`; expose provider-neutral telemetry interfaces and OTel adapters.

## Runtime
Node/NestJS and worker integrations are first-class; browser/native/desktop adapters are explicit and constrained by runtime capabilities. Collector/exporter endpoints are configuration-driven.

## Security
No tokens, raw audit payloads, credentials or uncontrolled PII in spans/metrics. Attribute allowlists, sampling and payload-size limits are mandatory.

## Reliability/performance
Telemetry failure must not fail business requests by default. Bounded exporters, batch limits, shutdown flush deadlines and exporter circuit behavior are required.

## Testing
Propagation across HTTP/NATS/queues, span lifecycle, metrics, sampling, exporter outage, shutdown flush and runtime conformance.

## Exit criteria
All operational traces/metrics use one OTel implementation and monitoring infrastructure consumes its output without introducing a second telemetry package.
