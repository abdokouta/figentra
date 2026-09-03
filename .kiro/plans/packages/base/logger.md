---
status: canonical
component: package
package: "@stackra/logger"
---
# `@stackra/logger` — implementation plan

Production structured logging API with Pino-backed Node/NestJS sinks and explicit browser/React Native/desktop/worker adapters.

## Ownership
Logger owns levels, structured records, redaction, formatting, sinks and logger lifecycle. OpenTelemetry traces/metrics belong to `@stackra/observability`; audit records are owned by Audit.

## API
`Logger`, child/context loggers, `LogRecord`, level configuration, `LogSink`, `Redactor`, `LoggerManager`, lifecycle/flush APIs and runtime adapters. Context includes correlation/request/trace IDs without storing mutable global tenant state.

## Security/performance
Allowlist/redact secrets, auth headers, tokens and configurable PII. Bounded async buffers, backpressure/drop policy, flush on shutdown and sampling for noisy debug classes.

## Testing
Redaction, serialization, child context, sink failures, flush/drain, concurrency and runtime conformance.

## Exit criteria
Single logging abstraction across all runtimes, production Pino integration and safe structured output with no OTel ownership duplication.
