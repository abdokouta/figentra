---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/logger"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/config", "@stackra/support"]
---
# `@stackra/logger` — implementation plan

## Purpose and boundary
Production structured logging abstraction shared by Node/NestJS, Worker, browser, React Native and desktop runtimes. Logger owns levels, structured records, redaction, context propagation, sinks, buffering and lifecycle. OpenTelemetry belongs to `@stackra/observability`; durable audit records belong to Audit.

## Public API
```ts
interface Logger {
  trace(message:string,meta?:LogMeta):void;
  debug(message:string,meta?:LogMeta):void;
  info(message:string,meta?:LogMeta):void;
  warn(message:string,meta?:LogMeta):void;
  error(error:unknown,message?:string,meta?:LogMeta):void;
  child(context:LogContext):Logger;
  flush():Promise<void>;
}
interface LoggerManager { create(scope:string,context?:LogContext):Logger; setLevel(level:LogLevel):void; flush(deadlineMs?:number):Promise<void>; }
interface LogSink { write(record:LogRecord):Promise<void>|void; flush?():Promise<void>; close?():Promise<void>; }
interface Redactor { redact(record:LogRecord):LogRecord; }
```

`LogRecord` contains timestamp, level, scope, message, request/correlation/trace IDs, optional tenant/principal classification, structured metadata and error-safe diagnostics.

## Source tree
```text
packages/logger/
├── src/core/{logger.ts,manager.ts,record.ts,context.ts,levels.ts,redactor.ts,sink.ts,errors/,index.ts}
├── src/sinks/{console,pino,remote}/
├── src/runtime/{node,nestjs,browser,worker,native,desktop}/
├── src/testing/{memory-sink,log-recorder,assertions,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Context semantics
Context is immutable and inherited by child loggers. Tenant/principal/request identifiers are copied only when explicitly supplied by trusted RequestContext. There is no mutable global tenant context. Child loggers cannot remove security redaction rules.

## Pino/Node adapter
Node/NestJS production uses Pino-compatible structured output. The adapter maps canonical records to Pino fields and controls transport configuration. Console output in local development is allowed, but production sink configuration is explicit. Provider SDKs remain inside sink adapters.

## Runtime behavior
Workers use bounded asynchronous buffers with flush on invocation shutdown. Browser/native use lightweight console/remote sinks and prohibit server-only metadata. Unsupported sink capability returns a configuration error rather than silently discarding production logs.

## Redaction/security
Redaction runs before every sink. Default blocked fields include Authorization, Cookie, Set-Cookie, access/refresh tokens, API keys, private keys, passwords and secret-reference values. PII fields are classification-configurable. Raw request/response bodies are never logged by default.

## Reliability/performance
Buffers have hard item/byte limits. On overload a documented drop policy applies by level; error/security records have higher retention priority. Sink failure must not crash the application by default. `flush(deadline)` attempts bounded drain and reports failure to shutdown diagnostics.

## Errors
`LoggerConfigurationError`, `SinkWriteError`, `LogSerializationError`, `RedactionConfigurationError`. Logging errors never replace the original business error.

## Observability
The logger emits its own health metrics through the observability package without recursive logging. Metrics include records written/dropped, sink latency/errors, buffer depth and flush duration.

## Testing
Redaction fixtures; nested child context; error serialization; sink outage; buffer overflow/drop policy; concurrent writes; flush deadlines; Pino schema compatibility; browser/Worker/native conformance. Security tests assert no secrets survive redaction.

## Dependencies and exports
Core has no Pino dependency. Node/Pino is an adapter. Public exports are explicit and versioned. Audit and OTel packages must not import internal logger implementation details.

## Implementation phases
1. Core record/context/level API.
2. Redaction and sink lifecycle.
3. Pino/Node/NestJS adapter.
4. Browser/Worker/native/desktop adapters.
5. Testing/observability/flush/backpressure.
6. Security/load/conformance and release.

## Exit criteria
- One logger abstraction is used across all runtimes.
- Production Node/NestJS uses a real structured sink.
- Redaction is enforced before output.
- Buffer and shutdown behavior are bounded/tested.
- No telemetry/audit duplication is introduced.
