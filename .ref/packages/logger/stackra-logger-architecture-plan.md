# @stackra/logger — Full Architecture & Refactor Plan

## Status

**Proposed architecture / implementation plan**

This document is the logger equivalent of the Stackra Container architecture plan.

It is based on the uploaded `@stackra/logger` package and its current structure, including:

- core logger
- channel/driver model
- reporters
- enrichers
- formatters
- discovery
- React integration
- NestJS integration
- Pino reporter
- testing
- context repositories
- shutdown handling
- configuration

The goal is not to replace the current logger with a different library blindly.

The goal is to establish a **Stackra logging abstraction** that can use Pino, Winston, Consola, the native console, Cloudflare Workers, OpenTelemetry, or custom transports without coupling application code to any of them.

---

# 1. Executive Decision

`@stackra/logger` should become:

> **The canonical Stackra structured logging API, context model, routing/orchestration layer, and runtime integration boundary.**

It should NOT become:

> "A Winston wrapper."

And it should NOT become:

> "A Pino wrapper."

The application API should be Stackra-owned:

```ts
logger.info("User authenticated", {
  userId,
});
```

The application should never need to know whether the implementation is:

```text
Pino
Winston
Consola
console
Cloudflare console
OpenTelemetry
Datadog
CloudWatch
Loki
Elastic
custom reporter
```

Target architecture:

```text
                    @stackra/contracts
                 logging abstractions/tokens
                           │
                           ▼
                    @stackra/logger
              logging orchestration/kernel
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
       /pino            /winston          /console
          │                │                 │
          └────────────────┼─────────────────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
           /nestjs       /react        /worker
```

The important distinction is:

```text
Logger API
   ↓
Log Event / Context
   ↓
Pipeline
   ↓
Sink/Transport abstraction
   ↓
Pino / Winston / Console / Cloud provider
```

---

# 2. What the Current Package Already Does Well

The current logger is significantly more sophisticated than a basic wrapper.

It already has:

```text
ILogger
ILoggerManager
ILogEntry
ILogLevel
ILogReporter
ILogFormatter
ILogEnricher
ILogChannelConfig

Logger
LoggerManager

channels
stack channels
reporters
formatters
enrichers
redaction
sampling
interpolation
global context
child loggers
mutable context
timers
channel taps
emergency fallback
flush
shutdown
discovery
NestJS adapter
React adapter
testing utilities
```

These concepts are valuable and should be preserved where they make architectural sense.

The main problem is **responsibility boundaries**, not lack of functionality.

---

# 3. Current Problems

## 3.1 Winston has effectively become the conceptual architecture

The old logger architecture was Winston-oriented.

The package currently carries dependencies and concepts around:

```text
Winston
Winston transports
Winston CloudWatch
Winston rotation
Winston Slack
```

The new architecture should not repeat this problem with Pino.

Pino should be an implementation.

---

## 3.2 Pino currently lives under NestJS

Current:

```text
src/nestjs/reporters/pino.reporter.ts
```

This is the wrong architectural location.

Pino is not inherently a NestJS concern.

Pino should be available to:

```text
Node
NestJS
Fastify
HTTP servers
workers where compatible
background jobs
CLI
```

Therefore:

```text
src/pino/
```

or:

```text
src/drivers/pino/
```

should replace the NestJS-specific location.

---

## 3.3 Core ConsoleReporter depends on Consola

Current:

```text
ConsoleReporter → consola
```

That is another implementation dependency inside the conceptual default path.

Consola is useful, but it should be optional.

The lowest-level fallback should be the platform console:

```ts
console.debug()
console.info()
console.warn()
console.error()
```

Then Consola can remain an optional pretty/dev driver if desired.

---

## 3.4 LoggerManager extends `@stackra/ts-support` Manager

Current:

```ts
LoggerManager extends Manager<ILogChannel>
```

This creates the same dependency-direction concern found in the container review.

The logger core should not need a generic support package merely to implement channel caching.

The channel registry/cache should be local to logger core.

Target:

```text
@stackra/contracts
       ↓
@stackra/logger
       ↓
@stackra/ts-support
```

if support needs logger.

Never:

```text
logger → support → logger
```

---

## 3.5 Static LoggerManager.instance

Current:

```ts
LoggerManager.instance
```

This is convenient but dangerous.

It creates problems for:

```text
multiple applications
SSR
tests
Workers
parallel test suites
multi-tenant applications
```

The new architecture should make DI the primary path.

The `new Logger(ClassName.name)` convenience pattern can remain if the Stackra standards require it, but the implementation should obtain a context through a controlled runtime facade rather than a globally mutable singleton where possible.

---

# 4. Core Principle

The logger has four conceptual layers.

```text
1. API
2. Pipeline
3. Routing
4. Sinks
```

---

# 5. Layer 1 — Logging API

Application-facing interface:

```ts
ILogger
```

Recommended methods:

```ts
debug()
info()
warn()
error()
fatal()
log()
child()
withContext()
withoutContext()
time()
timeEnd()
```

Potential additions:

```ts
trace()
isLevelEnabled()
with()
```

Do not add features just because Pino/Winston has them.

The API should represent Stackra's requirements.

---

# 6. Layer 2 — Log Event

The current `ILogEntry` should become the canonical structured log event.

Recommended shape:

```ts
interface ILogEntry {
  timestamp: string | number;
  level: ILogLevel;
  message: string;

  context?: string;

  meta?: LogContext;

  error?: SerializedError;

  traceId?: string;
  spanId?: string;
  requestId?: string;

  service?: string;
  environment?: string;
  version?: string;
}
```

Avoid forcing every application to populate all fields.

The logger pipeline can enrich them.

---

# 7. Error Representation

Do not serialize errors independently in every reporter.

Create a canonical error representation:

```ts
interface ILogError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: ILogError;
  details?: Record<string, unknown>;
}
```

The logger normalizes:

```text Error
AggregateError
unknown thrown values
custom errors
```

into the canonical representation.

Pino and Winston adapters can then map this into their preferred structures.

---

# 8. Structured Logging Standard

All application logging should be structured.

Good:

```ts
logger.info("Order created", {
  orderId,
  customerId,
});
```

Avoid:

```ts
logger.info(`Order ${orderId} created for ${customerId}`);
```

unless the message is intentionally human-readable and no structured metadata is needed.

Structured fields should remain machine-queryable.

---

# 9. Message vs Metadata

Define:

```text message = human-readable event description
meta = structured machine-readable data
```

Do not concatenate structured fields into the message.

Bad:

```text
"[userId=123] User authenticated"
```

Good:

```text
message: "User authenticated"
meta: {
  userId: "123"
}
```

This is particularly important for Pino.

---

# 10. Log Context

Context should be hierarchical:

```text
Global context
      ↓
Application context
      ↓
Request context
      ↓
Logger context
      ↓
Child logger context
      ↓
Per-call metadata
```

Precedence:

```text
global < application < request < logger < child < call
```

Later values override earlier values.

---

# 11. Request Context

Request context should be runtime-neutral.

Example:

```ts
interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  tenantId?: string;
  userId?: string;
  service?: string;
  environment?: string;
}
```

The Worker adapter can populate:

```text
requestId
traceId
```

The NestJS adapter can populate them from:

```text
headers
AsyncLocalStorage
OpenTelemetry
```

The logger core does not need to know where they came from.

---

# 12. Async Context

For Node/NestJS, use:

```text
AsyncLocalStorage
```

for request context.

Do not make AsyncLocalStorage part of core.

Target:

```text
@stackra/logger/nestjs
        ↓
AsyncLocalStorage
        ↓
IContextRepository
        ↓
Logger
```

For Workers:

```text
Worker request context
        ↓
RequestContext
        ↓
IContextRepository
```

For browser:

```text
explicit logger child/context
```

or a lightweight context provider.

---

# 13. Context Repository Contract

If multiple runtime adapters need it, define:

```ts
interface ILogContextRepository {
  get(): LogContext;
  set(context: LogContext): void;
  merge(context: LogContext): void;
  clear(): void;
  run<T>(context: LogContext, callback: () => T): T;
}
```

Put this in `@stackra/contracts` only if another package genuinely needs to implement it.

Otherwise keep it logger-internal.

Recommended:

```text
ILogContextRepository → contracts
ContextRepository → logger core
AsyncContextRepository → nestjs
WorkerContextRepository → worker
```

---

# 14. Layer 3 — Pipeline

The current enrichers are a good idea.

Keep:

```text
InterpolationEnricher
ContextEnricher
RedactionEnricher
SamplingEnricher
```

But formalize the pipeline.

```text
Log call
   ↓
normalize
   ↓
level check
   ↓
context merge
   ↓
enrichers
   ↓
redaction
   ↓
routing
   ↓
formatter/serializer
   ↓
sink
```

---

# 15. Enricher Contract

Keep:

```ts
ILogEnricher
```

as the abstraction.

Each enricher should be:

```text
deterministic
isolated
non-throwing
order-aware
```

An enricher may:

```text
transform entry
drop entry
add metadata
normalize fields
```

---

# 16. Redaction

Redaction should occur **before external sinks**.

This is a security boundary.

Default sensitive paths should be configurable.

Potential defaults:

```text
password
token
accessToken
refreshToken
authorization
cookie
set-cookie
secret
apiKey
clientSecret
```

Do not blindly redact every field called `key`.

Support path patterns where practical.

---

# 17. Sampling

Sampling should occur before expensive serialization/transport work.

Example:

```text
debug → 10%
info → 100%
warn → 100%
error → 100%
fatal → 100%
```

Configuration:

```ts
sampling: {
  debug: 0.1,
}
```

Sampling must never drop:

```text
fatal
critical audit events
```

unless explicitly configured.

---

# 18. Layer 4 — Channels

The current channel model is valuable.

Keep:

```text
app
audit
security
http
worker
database
```

But stop calling channels "drivers" internally.

A clearer vocabulary:

```text
Logger
Channel
Sink
Transport
Formatter
Enricher
```

Use "driver" only when Stackra standards already require it.

---

# 19. Channel Definition

Example:

```ts
channels: {
  app: {
    level: "info",
    sinks: ["console"],
  },

  audit: {
    level: "info",
    sinks: ["json"],
  },

  production: {
    type: "stack",
    channels: ["app", "audit"],
  },
}
```

If backwards compatibility requires:

```ts
reporters
```

support it as an alias during migration.

Target terminology should be:

```text sinks
```

because the destination implementation is what Pino/Winston transports ultimately represent.

---

# 20. Reporter vs Transport vs Sink

Standardize these terms.

## Sink

Stackra-level output destination abstraction.

```ts
ILogSink
```

## Transport

Implementation mechanism used by a sink.

Examples:

```text
Pino transport
Winston transport
HTTP transport
file transport
CloudWatch transport
```

## Formatter

Transforms a canonical log entry into an output representation.

## Serializer

Converts objects/errors into structured serializable data.

This separation is important.

---

# 21. Why Pino Should Be the Default Node Backend

Pino should be the recommended production Node backend.

Reasons:

- high throughput
- structured JSON by default
- low overhead
- good ecosystem
- child logger model
- serializers
- transport architecture
- good fit for containerized/server workloads

But Pino should remain optional.

Application code should never import Pino.

---

# 22. Why Winston Should Still Be Supported

Winston remains useful for:

```text
existing applications
rich transport ecosystem
legacy integrations
file transports
CloudWatch integrations
custom transports
migration compatibility
```

Therefore support:

```text
@stackra/logger/pino
@stackra/logger/winston
```

but do not make Winston the default.

Recommended:

```text
Node production → Pino
legacy/transport-specific → Winston
browser → Console
Worker → Console/structured Worker sink
```

---

# 23. Pino Integration

Move Pino implementation out of NestJS:

```text
src/pino/
├── pino.module.ts
├── pino.sink.ts
├── pino.factory.ts
├── pino.options.ts
├── pino.serializers.ts
└── index.ts
```

Public:

```ts
import {
  PinoSink,
  PinoModule,
} from "@stackra/logger/pino";
```

The Pino adapter should accept canonical `ILogEntry`.

---

# 24. Pino Child Logger

Pino naturally supports child loggers.

The Stackra adapter should map:

```ts
logger.child({
  requestId,
  service,
})
```

to a Pino child where doing so improves performance.

However, Stackra semantics remain authoritative.

Do not expose the raw Pino logger through `ILogger`.

---

# 25. Pino Serialization

Configure canonical serializers for:

```text
Error
Request
Response
unknown objects
BigInt
```

Error output should follow a consistent Stackra schema.

Do not let Pino's default error shape become the Stackra contract.

---

# 26. Pino Pretty Development Mode

Do not auto-detect and silently import `pino-pretty` inside the adapter.

Prefer explicit configuration:

```ts
PinoModule.forRoot({
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
        }
      : undefined,
});
```

Or:

```text
PinoPrettySink
```

as an optional development integration.

Production must remain predictable.

---

# 27. Pino Optional Dependency

Keep Pino optional for users who choose:

```text
console
winston
custom
```

The root logger package must not force Pino into every bundle.

Recommended dependency topology:

```text
@stackra/logger
   ├── contracts
   └── core

@stackra/logger/pino
   └── pino

@stackra/logger/winston
   └── winston
```

---

# 28. Winston Integration

Create:

```text
src/winston/
├── winston.module.ts
├── winston.sink.ts
├── winston.factory.ts
├── winston.options.ts
├── winston.formatters.ts
└── index.ts
```

Winston should receive canonical entries.

It can map:

```text
ILogLevel → Winston level
ILogEntry → Winston info object
```

without changing application semantics.

---

# 29. Winston Transport Compatibility

Do not wrap every Winston transport individually.

Expose an escape hatch:

```ts
WinstonModule.forRoot({
  transports: [
    new WinstonTransport(...),
  ],
});
```

or:

```ts
{
  provide: WINSTON_INSTANCE,
  useFactory: ...
}
```

Keep raw Winston APIs inside the Winston adapter boundary.

---

# 30. Console Sink

Create a runtime-neutral console sink.

```text
src/sinks/console/
```

It should use:

```ts
globalThis.console
```

rather than requiring Consola.

Map:

```text
debug → console.debug
info → console.info
warn → console.warn
error → console.error
fatal → console.error
```

This works across:

```text
browser
Node
Worker
Deno
Bun
```

---

# 31. Consola

Keep Consola only as an optional pretty console implementation.

Potential:

```text
@stackra/logger/consola
```

Only if there is a real need.

Do not make it core.

---

# 32. Cloudflare Worker Logger

Add:

```text
@stackra/logger/worker
```

But keep it thin.

Cloudflare Workers already provide:

```ts
console.log
console.info
console.warn
console.error
```

Therefore the default Worker sink should likely be the standard ConsoleSink.

Worker-specific responsibilities should be:

```text
request context
execution context integration
structured runtime fields
```

not replacing Cloudflare's logging runtime.

---

# 33. Worker Logging Context

Integrate with the container Worker context:

```text
WORKER_CONTEXT
       ↓
LogContextRepository
       ↓
ContextEnricher
       ↓
ILogEntry
```

Fields can include:

```text
requestId
traceId
route
method
url
```

Do not put the entire `Request` object into every log entry.

---

# 34. NestJS Integration

Current NestJS integration is directionally correct.

Keep:

```text
NestLoggerServiceAdapter
RequestContextMiddleware
RequestLoggingInterceptor
LoggingExceptionFilter
LoggerHealthIndicator
```

but reorganize responsibilities.

Target:

```text
@stackra/logger/nestjs
    │
    ├── NestLoggerAdapter
    ├── AsyncContextRepository
    ├── RequestLoggingInterceptor
    ├── LoggingExceptionFilter
    └── health
```

NestJS should compose the core logger.

It should not implement another logger architecture.

---

# 35. Nest Logger Adapter

Implement:

```ts
NestLoggerService
```

as an adapter over:

```ts
ILogger
```

rather than directly depending on:

```text
LoggerManager
```

where possible.

Target:

```text
NestJS LoggerService
        ↓
ILogger
        ↓
Stackra pipeline
```

---

# 36. NestJS `app.useLogger()`

Support:

```ts
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});

app.useLogger(
  app.get(NestLoggerServiceAdapter),
);
```

All Nest logs should become Stackra structured events.

Context:

```text
NestJS
```

or the Nest-provided context should remain metadata, not be embedded into the message unnecessarily.

---

# 37. Request Logging

Current interceptor logs:

```text
method
url
status
duration
```

Preserve this.

Improve the schema:

```ts
{
  event: "http.request",
  method,
  route,
  statusCode,
  durationMs,
  requestId,
}
```

Do not rely only on free-form messages.

---

# 38. Event Naming

Introduce optional structured event names:

```ts
logger.info("Order created", {
  event: "order.created",
  orderId,
});
```

or:

```ts
logger.info({
  event: "order.created",
  orderId,
}, "Order created");
```

The first API may preserve current compatibility.

Long-term event names should be standardized.

---

# 39. Audit Logging

Audit should be a first-class channel:

```text
audit
```

Audit logs should have:

```text
event
actor
subject
action
resource
tenant
timestamp
requestId
traceId
result
```

Audit channel should default to:

```text
no sampling
strong redaction
structured output
durable sink where configured
```

---

# 40. Security Logging

Security channel:

```text
security
```

Events:

```text
auth.login
auth.logout
auth.failed
auth.token.invalid
permission.denied
account.locked
```

Security events should be structured.

---

# 41. Emergency Logger

The current emergency fallback is valuable.

Keep it.

But make it runtime-neutral:

```text
EmergencySink
```

Use:

```text
console.error
```

as the final fallback.

It must:

- never depend on DI
- never depend on Pino
- never depend on Winston
- never throw
- avoid recursive logger calls
- remain usable when logger initialization fails

---

# 42. Logger Must Never Crash the Application

Normal logging should be fail-open by default.

A broken:

```text
sink
formatter
enricher
transport
```

must not crash application code.

However, configuration/boot errors should be visible through the emergency sink.

---

# 43. Sync vs Async Logging

Define sink semantics.

```ts
interface ILogSink {
  write(entry: ILogEntry): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

The main logger API remains:

```ts
void
```

for normal logging.

Async sinks should buffer or internally schedule work.

Do not make every application log call await network I/O.

---

# 44. Buffered Sink

Current:

```text
BufferedReporterWrapper
```

should become a generic:

```text
BufferedSink
```

with:

```text
batch size
flush interval
max buffer
overflow strategy
```

Overflow strategy:

```text
drop-oldest
drop-newest
flush-immediately
emergency-fallback
```

Default should be safe and documented.

---

# 45. Flush Semantics

Application shutdown should:

```text
stop accepting new writes
flush buffers
flush sinks
close sinks
```

For Worker:

```text
ctx.waitUntil(logger.flush())
```

where appropriate.

Do not call process shutdown APIs in core.

---

# 46. Logger Lifecycle

Core lifecycle:

```text
create
initialize
ready
write
flush
close
```

Runtime adapters translate:

```text
Node SIGTERM
Nest shutdown
Worker execution context
browser unload
```

into the core lifecycle where appropriate.

---

# 47. Logger Configuration

Current config is good conceptually:

```text
default
channels
redact
globalContext
```

Expand it carefully:

```ts
interface ILoggerConfig {
  default: string;

  channels: Record<string, ILogChannelConfig>;

  context?: LogContext;

  redaction?: RedactionConfig;

  sampling?: SamplingConfig;

  sinks?: SinkConfig;

  level?: ILogLevel;
}
```

Avoid duplicating configuration between:

```text
core
pino
winston
nestjs
```

---

# 48. Driver/Sink Registry

Replace the current reporter registry with a generic sink registry.

```text
SinkRegistry
```

Potential API:

```ts
register(sink)
get(name)
has(name)
remove(name)
list()
```

Formatters can have their own registry.

---

# 49. Sink Discovery

Current `@Reporter()` decorator can become:

```ts
@LoggerSink("pino")
```

or:

```ts
@LogSink("pino")
```

Recommended:

```ts
@LogSink("pino")
```

because "reporter" is vague.

Maintain:

```ts
@Reporter()
```

as a compatibility alias during migration.

---

# 50. Discovery Architecture

The logger should consume the generic container discovery contract:

```ts
DISCOVERY_SERVICE
IDiscoveryService
```

It should NOT implement its own parallel provider discovery abstraction unless the runtime cannot provide the generic service.

Current:

```text
IDiscoveryAdapter
DISCOVERY_ADAPTER
ContainerDiscoveryAdapter
NestDiscoveryAdapter
```

should be simplified.

Target:

```text
@stackra/container
       ↓
IDiscoveryService
       ↓
Logger SinkLoader
```

The logger only asks:

```text
find providers with LOG_SINK metadata
```

---

# 51. Reporter/Sink Discovery

The loader:

```text
ReporterLoader
```

becomes:

```text
SinkLoader
```

Responsibilities:

1. discover decorated sink providers
2. validate them
3. register them
4. report invalid providers through emergency logging

No Nest-specific logic.

---

# 52. Discovery Swapping

Because the container now supports a generic discovery abstraction, the logger should work with:

```text
runtime container discovery
static manifest discovery
Nest discovery
test discovery
```

without changing logger code.

This is a major reason not to keep `IDiscoveryAdapter` as the logger's primary abstraction.

---

# 53. Formatters

Current:

```text
JsonFormatter
PrettyFormatter
```

are useful.

Keep:

```text
ILogFormatter
```

but clarify the distinction:

```text
Formatter = presentation/output representation
Serializer = canonical object/error encoding
```

JSON should be the default machine format.

Pretty is development-oriented.

---

# 54. JSON Schema

Define a canonical JSON log schema.

Example:

```json
{
  "timestamp": "2026-09-03T00:00:00.000Z",
  "level": "info",
  "message": "Order created",
  "context": "OrderService",
  "event": "order.created",
  "requestId": "req_123",
  "traceId": "trace_456",
  "service": "orders",
  "environment": "production",
  "meta": {
    "orderId": "ord_123"
  }
}
```

The exact schema should be finalized in contracts.

---

# 55. Contracts Ownership

Shared logging contracts should live in:

```text
@stackra/contracts
```

when consumed by other packages.

Recommended:

```text
ILogger
ILoggerManager
ILogEntry
ILogLevel
LogContext
ILogError
ILogSink
ILogFormatter
ILogEnricher
ILogChannelConfig
ILoggerModuleConfig
ILogContextRepository
```

Tokens:

```text
LOGGER
LOGGER_MANAGER
LOGGER_CONFIG
LOG_CONTEXT
LOG_CONTEXT_REPOSITORY
DISCOVERY_SERVICE
```

only when cross-package injection requires them.

---

# 56. What Should NOT Go Into Contracts

Do not move implementation details into contracts:

```text
LoggerManager
SinkRegistry
ChannelRegistry
PinoSink
WinstonSink
ConsoleSink
BufferedSink
EmergencySink
JsonFormatter implementation
metadata indexes
```

Contracts should define behavior, not implementations.

---

# 57. Logger Token Strategy

Prefer:

```ts
LOGGER
```

for injecting the application logger.

Then:

```ts
constructor(
  @Inject(LOGGER)
  private readonly logger: ILogger,
) {}
```

For context-specific loggers, use a factory:

```text
LOGGER_FACTORY
```

or an injectable logger factory.

---

# 58. LoggerFactory

Introduce:

```ts
interface ILoggerFactory {
  create(context: string, options?: LoggerOptions): ILogger;
}
```

This allows:

```ts
const logger = loggerFactory.create(OrderService.name);
```

and avoids application services directly importing:

```text
LoggerManager
```

---

# 59. `new Logger(ClassName.name)` Compatibility

If existing Stackra standards require:

```ts
private readonly logger = new Logger(OrderService.name);
```

keep it as a convenience API.

But the preferred architecture should be:

```ts
@Inject(LOGGER)
private readonly logger: ILogger
```

or:

```ts
@Inject(LOGGER_FACTORY)
private readonly loggerFactory: ILoggerFactory
```

The global static manager should become an implementation fallback, not the architectural foundation.

---

# 60. Child Logger Semantics

Keep:

```ts
logger.child(meta)
```

This maps naturally to:

```text
Pino child logger
Winston defaultMeta
Stackra context wrapper
```

The Stackra behavior must remain consistent across all backends.

---

# 61. Mutable Context

Current:

```ts
withContext()
withoutContext()
```

should be reconsidered.

Mutable logger context is dangerous for singleton services:

```text
Request A sets context
Request B sets context
Request A logs
```

This can cause cross-request contamination.

Preferred:

```ts
logger.child(requestContext)
```

or request-scoped logger.

If `withContext()` remains, document that it is not safe on shared singleton loggers for request-specific state.

---

# 62. Request-Scoped Logger

Recommended architecture:

```text
Application singleton logger
        │
        ▼
Request-scoped logger
        │
        ├── requestId
        ├── traceId
        ├── tenantId
        └── userId
```

This is especially important for:

```text
Workers
NestJS
serverless
```

---

# 63. Logger Scope

Potential standard:

```text
LOGGER_FACTORY → singleton
LOGGER → context-specific
REQUEST_LOGGER → request scoped
```

Avoid making the root logger request-scoped if it is expensive.

---

# 64. React Integration

Current React integration should remain:

```text
@stackra/logger/react
```

It should expose:

```ts
LoggerProvider
useLogger()
useLoggerChannel()
```

It must depend only on:

```text
ILogger
ILoggerFactory
IContainerResolver
```

where necessary.

No Pino/Winston dependency.

---

# 65. Browser Logging

Browser default:

```text
ConsoleSink
```

Optional:

```text
HttpSink
```

for sending logs to a backend.

Current React:

```text
HttpReporter
NetworkCaptureReporter
```

should become optional sinks.

---

# 66. Network Logging

An HTTP sink must have:

```text
batching
retry
backoff
sampling
redaction
offline behavior
payload limits
```

It must not block the UI.

Potential:

```text
@stackra/logger/http
```

---

# 67. Worker Logging

Worker default:

```text
ConsoleSink
```

Optional:

```text
HttpSink
QueueSink
```

For durable asynchronous logs, prefer:

```text
Queue
```

rather than doing arbitrary outbound HTTP for every log.

The Worker adapter can use:

```ts
ExecutionContext.waitUntil()
```

for flush operations.

---

# 68. OpenTelemetry

Do not make OpenTelemetry a logger dependency.

Instead support correlation:

```text
traceId
spanId
```

through the context repository.

A future:

```text
@stackra/logger/opentelemetry
```

can integrate:

```text
OTel span events
OTel logs
trace correlation
```

without changing application logging code.

---

# 69. Metrics

Do not make metrics part of logger core.

A logger may emit:

```text
LogWritten
```

events internally, but metrics belong to:

```text
@stackra/telemetry
```

or another observability package.

---

# 70. Events

Current `LOGGER_EVENTS` / `MessageLogged` behavior is useful.

Keep an optional internal/public event:

```text
LogWritten
```

But it should not be the primary logging mechanism.

Do not make every log require a PubSub round trip.

---

# 71. PubSub

Current `IPubSubDriver` integration should remain optional.

Use it for:

```text
audit/event consumers
debug tooling
analytics
```

not for the primary sink pipeline.

---

# 72. Commands

Current:

```text
log-tail.command.ts
log-clear.command.ts
```

should not live in logger core.

Move CLI integration to:

```text
@stackra/logger/cli
```

or a platform CLI package.

Logger core should not own filesystem/database log management commands.

---

# 73. File Logging

File logging should be Node-only.

Move:

```text
file.reporter.ts
```

out of NestJS:

```text
@stackra/logger/node
```

or:

```text
@stackra/logger/winston
```

if it is purely a Winston transport.

Cloudflare/browser bundles must never include it.

---

# 74. Syslog

Syslog is a transport/integration concern.

Move:

```text
syslog.reporter.ts
```

to:

```text
@stackra/logger/syslog
```

or keep it under Winston if implemented through Winston.

Do not expose it from the root package.

---

# 75. CloudWatch

Do not put:

```text
winston-aws-cloudwatch
```

in the logger core.

If CloudWatch support is required:

```text
@stackra/logger/cloudwatch
```

or a dedicated AWS observability package.

The logger should not force AWS dependencies onto every application.

---

# 76. Slack

Slack should be a notification sink/integration, not a core logging reporter.

Potential:

```text
@stackra/logger/slack
```

Use it for:

```text
fatal alerts
security alerts
operational alerts
```

not every normal application log.

---

# 77. Daily Rotation

File rotation is a Node/file transport concern.

Do not put:

```text
winston-daily-rotate-file
```

into core.

Containerized production should normally write structured logs to stdout/stderr and let the platform handle rotation.

---

# 78. Recommended Default Environments

## Development

```text
default: app
sink: console
formatter: pretty
level: debug
```

## Production Node

```text
default: app
sink: pino
formatter: json
level: info
```

## Production NestJS

```text
default: app
sink: pino
formatter: json
level: info
```

## Cloudflare Worker

```text
default: app
sink: console
formatter: json
level: info
```

## Browser

```text
default: app
sink: console
formatter: pretty
level: info
```

---

# 79. Recommended Channel Set

Standard channels:

```text
app
http
audit
security
system
worker
```

Applications may add:

```text
database
queue
billing
integration
```

Do not force every application to configure every channel.

---

# 80. Logger Module

Current:

```ts
LoggerModule.forRoot()
LoggerModule.forRootAsync()
```

should remain.

But the module should register:

```text
config
context repository
logger factory
logger manager/pipeline
default sinks
sink loader
shutdown service
```

Do not register Pino/Winston automatically.

---

# 81. Pino Module

Target:

```ts
LoggerModule.forRoot({
  channels: {
    app: {
      level: "info",
      sinks: ["pino"],
    },
  },
});

PinoModule.forRoot({
  ...
});
```

Or:

```ts
LoggerModule.forRoot({
  sinks: [
    PinoSink,
  ],
});
```

Prefer one clear configuration pattern.

Do not require NestJS to use Pino.

---

# 82. Better Composition Model

Recommended:

```ts
LoggerModule.forRoot({
  default: "app",
  channels: {
    app: {
      level: "info",
      sinks: ["console"],
    },
  },
});
```

Then runtime-specific modules register sinks:

```ts
PinoLoggerModule.forRoot(...)
```

The core resolves:

```text sink name → sink instance
```

---

# 83. Testing Architecture

`@stackra/logger/testing` needs a significant refactor, similar to the container package.

It should have:

```text
MockLogger
MockLoggerFactory
MockSink
InMemorySink
TestLoggerModule
assertable log recorder
context test utilities
```

---

# 84. In-Memory Sink

The most important testing primitive should be:

```ts
InMemorySink
```

It records canonical `ILogEntry` objects.

Example:

```ts
const sink = new InMemorySink();

logger.info("User created", {
  userId: "123",
});
```

Then:

```ts
expect(sink.entries).toContainEqual(...)
```

This tests the actual Stackra pipeline rather than mocking every method.

---

# 85. MockLogger

Keep:

```ts
createMockLogger()
```

for isolated unit tests.

But it should implement:

```ts
ILogger
```

from contracts.

No custom interface that drifts from production.

---

# 86. Mock Logger Factory

Add:

```ts
createMockLoggerFactory()
```

for services that use:

```ts
ILoggerFactory
```

It should record:

```text contexts
child loggers
calls
```

---

# 87. Testing Full Pipeline

Add a real testing module:

```ts
const logger = await TestLogger.create({
  config,
});
```

It should use:

```text actual Logger
actual pipeline
actual enrichers
actual level filtering
InMemorySink
```

This allows feature tests to validate real behavior.

---

# 88. Testing Sink Overrides

Support:

```ts
.overrideSink("pino")
.useValue(mockSink)
```

or:

```ts
.overrideProvider(LOG_SINK)
```

depending on final container architecture.

---

# 89. Testing Discovery

Support:

```ts
.overrideProvider(DISCOVERY_SERVICE)
.useValue(fakeDiscovery)
```

to test:

```text SinkLoader
```

without relying on runtime discovery.

---

# 90. Testing Context

Provide:

```ts
runWithLogContext({
  requestId: "req_123",
}, () => {
  logger.info("hello");
});
```

Then assert:

```ts
expect(entry.meta.requestId).toBe("req_123");
```

Test:

```text nested contexts
override precedence
cleanup
parallel isolation
```

---

# 91. Worker Testing

Add:

```text
@stackra/logger/testing/worker
```

with:

```ts
createWorkerLoggerTestContext()
```

It should simulate:

```text env
request
executionContext
request log context
flush via waitUntil
```

---

# 92. NestJS Testing

Add:

```text
@stackra/logger/testing/nestjs
```

only if useful.

At minimum:

```text
NestLoggerServiceAdapter
RequestLoggingInterceptor
ExceptionFilter
AsyncContextRepository
```

must be integration-tested against a real Nest application.

---

# 93. React Testing

Add:

```text
@stackra/logger/testing/react
```

if React-specific helpers are needed.

Do not put React providers into generic testing.

---

# 94. Package Structure

Target:

```text
src/
├── core/
│   ├── logger.ts
│   ├── logger-manager.ts
│   ├── logger-factory.ts
│   ├── pipeline/
│   ├── channels/
│   ├── sinks/
│   ├── enrichers/
│   ├── formatters/
│   ├── context/
│   ├── lifecycle/
│   ├── decorators/
│   ├── discovery/
│   ├── errors/
│   └── index.ts
│
├── pino/
│   ├── pino.sink.ts
│   ├── pino.module.ts
│   ├── pino.factory.ts
│   ├── serializers/
│   └── index.ts
│
├── winston/
│   ├── winston.sink.ts
│   ├── winston.module.ts
│   ├── winston.factory.ts
│   └── index.ts
│
├── worker/
│   ├── worker.module.ts
│   ├── worker-context.repository.ts
│   └── index.ts
│
├── nestjs/
│   ├── services/
│   ├── middleware/
│   ├── interceptors/
│   ├── filters/
│   ├── health/
│   └── index.ts
│
├── react/
│   ├── providers/
│   ├── hooks/
│   └── index.ts
│
└── testing/
    ├── in-memory-sink.ts
    ├── mock-logger.ts
    ├── mock-factory.ts
    ├── testing-module.ts
    ├── context.ts
    ├── react/
    ├── worker/
    └── index.ts
```

---

# 95. Public Subpaths

Recommended:

```text
@stackra/logger
@stackra/logger/pino
@stackra/logger/winston
@stackra/logger/worker
@stackra/logger/nestjs
@stackra/logger/react
@stackra/logger/testing
@stackra/logger/testing/worker
@stackra/logger/testing/react
```

Potential future:

```text
@stackra/logger/http
@stackra/logger/opentelemetry
@stackra/logger/cloudwatch
@stackra/logger/slack
@stackra/logger/syslog
```

Only create these when needed.

---

# 96. Root Entry Rules

Root:

```text
@stackra/logger
```

must not import:

```text
pino
winston
react
nestjs
Node filesystem
Cloudflare packages
```

Root should be safe for:

```text
browser
Worker
Node
```

where core APIs permit.

---

# 97. Dependency Graph

Target:

```text
@stackra/contracts
        │
        ▼
@stackra/logger
        │
        ├── /pino → pino
        ├── /winston → winston
        ├── /nestjs → NestJS
        ├── /react → React
        ├── /worker → Worker types
        └── /testing → @stackra/testing
```

No reverse dependencies.

---

# 98. Remove Core Support Dependency

Current `LoggerManager` extends:

```text
Manager from @stackra/ts-support
```

Replace with internal:

```text
ChannelRegistry
```

This avoids unnecessary coupling.

The same principle used for `@stackra/container` applies here.

---

# 99. Configuration Ownership

Logger configuration belongs to:

```text
@stackra/logger
```

but runtime environment resolution belongs to:

```text
runtime adapter/config package
```

Examples:

```text
Node → process/env adapter
Worker → WORKER_ENV
Browser → explicit config
```

Do not make core call:

```ts
process.env
```

---

# 100. Environment Configuration

Use explicit:

```ts
LoggerModule.forRoot({
  level: ...
});
```

or:

```ts
LoggerModule.forRootAsync({
  inject: [CONFIG],
});
```

Worker:

```text
WORKER_ENV → LOGGER_CONFIG provider
```

Nest:

```text
ConfigService → LOGGER_CONFIG
```

---

# 101. Static Global State

Remove or minimize:

```text
LoggerManager.instance
NestLoggerModule.moduleOptions
global context state
```

`NestLoggerModule.moduleOptions` is particularly problematic because multiple Nest applications/tests can overwrite it.

Configuration should be instance/module scoped.

---

# 102. Module Configuration

Instead of static:

```ts
NestLoggerModule.moduleOptions
```

provide a token:

```text
NEST_LOGGER_CONFIG
```

and inject it into:

```text
middleware
interceptor
filter
```

where required.

---

# 103. Decorator Metadata

Current:

```ts
@Reporter("pino")
```

becomes:

```ts
@LogSink("pino")
```

Metadata belongs to logger.

The generic discovery engine only exposes metadata.

---

# 104. Sink Validation

At registration time verify:

```text
name
write
optional flush
optional close
```

If invalid:

```text
configuration error
emergency log
```

Do not silently ignore malformed sinks.

---

# 105. Channel Validation

At bootstrap validate:

```text
default channel exists
sink names exist
levels valid
formatter exists
stack channels do not recursively cycle
```

Fail fast for configuration errors where possible.

Runtime dispatch errors can still fail-open.

---

# 106. Stack Channels

Current stack channels are useful.

Keep them.

Prevent:

```text
a → b
b → a
```

and:

```text
a → a
```

with validation.

---

# 107. Channel Taps

Current:

```text
IChannelTap
```

can remain.

Rename only if needed.

Use taps for:

```text
channel metrics
debug inspection
routing adjustments
```

Do not allow taps to mutate security-sensitive fields after redaction.

---

# 108. Redaction Ordering

Recommended:

```text
construct
→ context merge
→ enrich
→ normalize
→ redact
→ format/serialize
→ sink
```

No sink should receive unredacted sensitive metadata.

---

# 109. Level Filtering

Level filtering should happen as early as possible.

For:

```text
debug
```

with channel level:

```text
info
```

avoid executing expensive enrichment where possible.

Potential optimization:

```text
canLog(channel, level)
```

before full metadata construction.

---

# 110. Lazy Sink Initialization

Pino/Winston clients may be initialized lazily.

But avoid repeated initialization.

Use:

```text
Promise deduplication
```

for async setup.

The first concurrent log writes must not create multiple sink instances.

---

# 111. Browser / Worker Bundle Size

The root package must not pull:

```text
Pino
Winston
Nest
React
Node transports
AWS SDK
filesystem
```

Worker should be extremely small.

---

# 112. Browser Bundle

Browser default should be:

```text
console sink
```

Optional:

```text HTTP sink
```

No Node dependencies.

---

# 113. Worker Bundle

Worker default:

```text
console sink
```

Optional:

```text queue/http sink
```

No:

```text Node process
fs
Winston
Pino Node transports
```

unless a specific Worker-compatible Pino build is intentionally supported and verified.

---

# 114. Pino in Workers

Do not assume standard Node Pino works in Cloudflare Workers.

If a future Pino edge-compatible implementation is desired, validate it independently.

Until then:

```text
Worker → native console / structured console sink
```

is the default.

---

# 115. Performance Model

Target:

```text
application logging call
    ↓
cheap level check
    ↓
entry construction
    ↓
small enrichment pipeline
    ↓
sink write
```

Avoid:

```text
JSON.stringify
deep cloning
reflection
network I/O
```

unless the selected sink requires it.

---

# 116. Logger API Performance

`logger.info()` should remain synchronous from the application perspective:

```ts
void logger.info(...)
```

No:

```ts
await logger.info(...)
```

for ordinary usage.

Flush is explicitly asynchronous:

```ts
await logger.flush()
```

---

# 117. Error Handling

Logger internals should never recursively log errors through the same logger.

Bad:

```text
sink fails
 → logger.error()
 → sink fails
 → ...
```

Use:

```text
EmergencySink
```

directly.

---

# 118. Health Indicator

Current:

```text
LoggerHealthIndicator
```

is useful for NestJS.

Health should report:

```text
configured sinks
initialized sinks
failed sinks
last error
buffer size
```

Do not report a healthy logger merely because configuration exists.

---

# 119. Observability of the Logger

Optional internal metrics:

```text
logs_written
logs_dropped
logs_failed
sink_write_latency
buffer_overflow
```

Expose them through a future observability abstraction rather than coupling core to metrics.

---

# 120. Security Requirements

Never log by default:

```text
passwords
access tokens
refresh tokens
authorization headers
cookies
secrets
private keys
credentials
```

Redaction must happen centrally.

Applications can explicitly override only where appropriate.

---

# 121. PII

Provide configurable PII redaction.

Potential:

```text
email
phone
nationalId
passport
address
```

Do not hard-code domain-specific PII rules globally.

Allow application configuration.

---

# 122. Logger Context and Tenancy

Stackra applications are often multi-tenant.

Request context should support:

```text
tenantId
organizationId
actorId
```

But logger core should not require them.

They are optional structured context.

---

# 123. Correlation Standard

Standardize:

```text
requestId
correlationId
traceId
spanId
```

Do not create four IDs automatically for every application.

Define precedence and propagation.

---

# 124. HTTP Headers

Nest/HTTP adapters can read:

```text
traceparent
x-request-id
x-correlation-id
```

and populate context.

Worker adapter can do the same.

The core logger only receives the resulting context.

---

# 125. Documentation

Add:

```text
docs/
├── architecture/
│   ├── overview.md
│   ├── logging-model.md
│   ├── pipeline.md
│   ├── contexts.md
│   ├── channels.md
│   ├── sinks.md
│   └── lifecycle.md
│
├── runtimes/
│   ├── browser.md
│   ├── workers.md
│   ├── node.md
│   └── nestjs.md
│
├── drivers/
│   ├── pino.md
│   ├── winston.md
│   └── console.md
│
├── testing/
│   ├── unit.md
│   ├── integration.md
│   ├── worker.md
│   └── nestjs.md
│
├── security/
│   ├── redaction.md
│   └── pii.md
│
└── migration/
    └── current-to-v2.md
```

---

# 126. ADR Plan

## ADR-LOGGER-001 — Logger Role and Boundary

`@stackra/logger` is the canonical Stackra logging abstraction and pipeline.

---

## ADR-LOGGER-002 — Driver/Sink Independence

Pino/Winston/Console are implementations, not application APIs.

---

## ADR-LOGGER-003 — Structured Log Schema

Define canonical `ILogEntry`.

---

## ADR-LOGGER-004 — Logging Context

Define global/application/request/logger/child context precedence.

---

## ADR-LOGGER-005 — Runtime Adapters

Browser, Worker, Node, NestJS, and React integrate without contaminating core.

---

## ADR-LOGGER-006 — Pino as Recommended Node Backend

Pino is the default recommended production Node implementation.

---

## ADR-LOGGER-007 — Winston Compatibility

Winston remains an optional integration for legacy and transport-specific requirements.

---

## ADR-LOGGER-008 — Discovery

Logger consumes the container's `IDiscoveryService` instead of maintaining its own runtime-specific discovery system.

---

## ADR-LOGGER-009 — Contracts Ownership

Shared logging interfaces/tokens live in `@stackra/contracts`; implementation classes stay in logger.

---

## ADR-LOGGER-010 — Testing Architecture

Testing provides mocks plus a real in-memory pipeline.

---

## ADR-LOGGER-011 — Logging Security

Central redaction and safe error serialization are mandatory.

---

## ADR-LOGGER-012 — Fail-Open Logging

Logging failures must not normally crash application execution.

---

# 127. Steering / Standards

Add:

```text
logger-architecture.md
logging-standards.md
logging-security.md
logging-testing.md
```

---

# 128. `logger-architecture.md`

Rules:

```text
1. Application code depends on ILogger.
2. Application code never imports Pino/Winston.
3. Root logger package is runtime-neutral.
4. Runtime integrations live in subpaths.
5. Sinks are swappable.
6. Discovery is provided by the container.
7. Context is request-safe.
8. Core has no filesystem or process dependencies.
9. Logger failures use emergency fallback.
10. Logging is structured by default.
```

---

# 129. `logging-standards.md`

Define:

```text
level semantics
message/meta rules
event naming
context fields
channel names
sink naming
error structure
request IDs
trace IDs
child loggers
```

---

# 130. `logging-security.md`

Define:

```text
default redaction
PII handling
token handling
error serialization
authorization/cookie redaction
audit log rules
security event rules
```

---

# 131. `logging-testing.md`

Define:

```text
MockLogger for unit tests
InMemorySink for pipeline tests
real configuration tests
sink override tests
context isolation tests
redaction tests
Nest integration tests
Worker integration tests
```

---

# 132. Migration Strategy

## Phase 0 — Inventory

```text
[ ] list all current logger consumers
[ ] list all direct Winston imports
[ ] list all direct Pino imports
[ ] list all direct Consola imports
[ ] list all reporter implementations
[ ] list all logger contracts
[ ] list all tokens
[ ] list all discovery usage
[ ] list all NestJS integrations
[ ] list all React integrations
```

---

# 133. Phase 1 — Contracts

```text
[ ] normalize ILogger
[ ] normalize ILoggerManager
[ ] normalize ILogEntry
[ ] normalize ILogError
[ ] normalize ILogSink
[ ] normalize ILogFormatter
[ ] normalize ILogEnricher
[ ] normalize context contracts
[ ] define logger tokens
```

---

# 134. Phase 2 — Core Decoupling

```text
[ ] remove @stackra/ts-support Manager inheritance
[ ] implement local channel registry
[ ] remove runtime dependencies
[ ] remove Nest dependencies
[ ] remove React dependencies
[ ] remove Pino/Winston dependencies
[ ] isolate emergency sink
```

---

# 135. Phase 3 — Context

```text
[ ] implement context repository contract
[ ] implement child context
[ ] implement request-safe context
[ ] remove unsafe mutable global request context
[ ] test parallel isolation
```

---

# 136. Phase 4 — Sink Architecture

```text
[ ] rename reporter concept to sink
[ ] create ILogSink
[ ] create SinkRegistry
[ ] migrate ConsoleReporter → ConsoleSink
[ ] migrate JsonReporter → JsonSink
[ ] migrate SilentReporter → SilentSink
[ ] migrate BufferedReporter → BufferedSink
[ ] retain compatibility aliases
```

---

# 137. Phase 5 — Discovery

```text
[ ] remove IDiscoveryAdapter as primary abstraction
[ ] inject DISCOVERY_SERVICE
[ ] use container discovery
[ ] implement @LogSink
[ ] migrate @Reporter compatibility
[ ] implement SinkLoader
```

---

# 138. Phase 6 — Pino

```text
[ ] move Pino out of nestjs
[ ] implement PinoSink
[ ] implement Pino serializers
[ ] implement Pino config
[ ] make Pino optional
[ ] test structured output
[ ] test child contexts
[ ] test flush
```

---

# 139. Phase 7 — Winston

```text
[ ] implement WinstonSink
[ ] preserve transport escape hatch
[ ] migrate legacy usage
[ ] remove Winston from core
[ ] mark Winston integration optional
```

---

# 140. Phase 8 — Runtime Adapters

```text
[ ] Worker logging
[ ] Worker request context
[ ] NestJS context
[ ] Node lifecycle
[ ] React integration
[ ] Browser console
```

---

# 141. Phase 9 — Testing

```text
[ ] MockLogger
[ ] MockLoggerFactory
[ ] InMemorySink
[ ] TestLogger
[ ] context test utilities
[ ] sink override
[ ] discovery override
[ ] Worker tests
[ ] Nest integration tests
[ ] React tests
```

---

# 142. Phase 10 — Security

```text
[ ] canonical error serializer
[ ] default redaction
[ ] configurable PII redaction
[ ] audit channel
[ ] security channel
[ ] secret leakage tests
```

---

# 143. Phase 11 — Encapsulation

```text
[ ] review root exports
[ ] hide SinkRegistry if internal
[ ] hide channel internals
[ ] hide metadata internals
[ ] expose only stable contracts
[ ] add /internals only if necessary
```

---

# 144. Phase 12 — Documentation

```text
[ ] rewrite README
[ ] architecture docs
[ ] Pino guide
[ ] Winston guide
[ ] Worker guide
[ ] Nest guide
[ ] React guide
[ ] testing guide
[ ] security guide
[ ] migration guide
```

---

# 145. Phase 13 — Release

Potentially:

```text
@stackra/logger v2
```

if contracts and exports change significantly.

Breaking changes should be intentional.

---

# 146. Acceptance Criteria

## Core

```text
[ ] no Pino dependency
[ ] no Winston dependency
[ ] no Nest dependency
[ ] no React dependency
[ ] no Node-only APIs
[ ] no filesystem APIs
[ ] no @stackra/ts-support dependency
```

## API

```text
[ ] ILogger stable
[ ] structured metadata stable
[ ] canonical errors stable
[ ] child logger stable
[ ] context precedence documented
```

## Sinks

```text
[ ] console works
[ ] Pino works
[ ] Winston works
[ ] custom sink works
[ ] sink failure does not crash application
[ ] flush works
```

## Discovery

```text
[ ] discovery uses IDiscoveryService
[ ] sinks can be discovered
[ ] sink implementation can be replaced
[ ] no Nest-specific discovery in core
```

## Runtime

```text
[ ] browser works
[ ] React works
[ ] Worker works
[ ] NestJS works
[ ] Node works
```

## Testing

```text
[ ] MockLogger implements ILogger
[ ] InMemorySink tests real pipeline
[ ] request contexts are isolated
[ ] redaction tested
[ ] Pino output tested
[ ] Winston output tested
[ ] Worker context tested
[ ] Nest bridge tested
```

---

# 147. Final Architecture

```text
                         @stackra/contracts
                                  │
              ┌───────────────────┼──────────────────┐
              │                   │                  │
              ▼                   ▼                  ▼
          ILogger            ILogEntry          ILogSink
              │
              ▼
                     @stackra/logger/core
              ┌─────────────────────────────┐
              │ Logger                      │
              │ LoggerFactory               │
              │ Pipeline                    │
              │ ContextRepository           │
              │ ChannelRegistry              │
              │ SinkRegistry                 │
              │ Enrichers                    │
              │ Formatters                   │
              │ EmergencySink                │
              └──────────────┬──────────────┘
                             │
                 ┌───────────┼───────────────┐
                 │           │               │
                 ▼           ▼               ▼
             Console       Pino           Winston
               Sink         Sink             Sink
                 │           │               │
                 ▼           ▼               ▼
              Runtime     Node/Server      Legacy/
              Console     production       custom
                 │
       ┌─────────┼───────────────┐
       │         │               │
       ▼         ▼               ▼
    Browser    Worker          NestJS
       │         │               │
       ▼         ▼               ▼
     React    Worker ctx     AsyncLocalStorage
```

---

# 148. The Most Important Architectural Rule

The application should depend on:

```text
ILogger
```

not:

```text
PinoLogger
WinstonLogger
ConsoleLogger
NestLogger
CloudflareLogger
```

The runtime should decide the implementation.

---

# 149. The Most Important Package Rule

The root package:

```text
@stackra/logger
```

must be safe and lightweight.

Backend integrations belong in:

```text
@stackra/logger/pino
@stackra/logger/winston
```

Framework integrations belong in:

```text
@stackra/logger/nestjs
@stackra/logger/react
@stackra/logger/worker
```

Testing belongs in:

```text
@stackra/logger/testing
```

This mirrors the architecture established for `@stackra/container`.

---

# 150. Final Recommendation: Pino vs Winston

Do **not** choose one globally.

Use both behind Stackra's abstraction.

Recommended default policy:

```text
Node production:
    Pino

NestJS:
    Pino

Cloudflare Worker:
    native structured console

Browser/React:
    native console / optional HTTP

Legacy applications:
    Winston

Special transport requirements:
    Winston or custom sink

Future observability:
    OpenTelemetry adapter
```

The application never changes:

```ts
logger.info("Payment completed", {
  paymentId,
  amount,
});
```

Only the runtime configuration changes.

---

# 151. Relationship to `@stackra/container`

The logger should use the container exactly the way the new container architecture intends.

```text
Container
    │
    ├── LOGGER_CONFIG
    ├── LOGGER
    ├── LOGGER_FACTORY
    ├── DISCOVERY_SERVICE
    └── sinks
            │
            ▼
         Logger
```

Runtime adapters provide:

```text
Worker env
Worker request
Nest AsyncLocalStorage
Browser context
Node lifecycle
```

The logger consumes these abstractions.

---

# 152. Relationship to `@stackra/contracts`

The final dependency direction should be:

```text
@stackra/contracts
       ▲
       │
@stackra/container
       ▲
       │
@stackra/logger
       ▲
       │
 ┌─────┼─────────────┐
 │     │             │
React Worker       NestJS
```

Other packages should be able to say:

```ts
import {
  ILogger,
  LOGGER,
} from "@stackra/contracts";
```

without importing the concrete logger package merely to type a dependency.

This is the same boundary principle used for the container.

---

# 153. Final Outcome

After this refactor, Stackra will have a coherent platform architecture:

```text
                 STACKRA PLATFORM
                       │
        ┌──────────────┴───────────────┐
        │                              │
   @stackra/contracts             Runtime adapters
        │                              │
        ▼                              │
 @stackra/container                   │
        │                              │
        ├───────────────┐              │
        │               │              │
        ▼               ▼              ▼
      Logger          Modules       Worker/Nest/React
        │
        ▼
   Logging Pipeline
        │
   ┌────┼────┬──────────┐
   ▼    ▼    ▼          ▼
Console Pino Winston   Custom
```

The strategic result is that **Pino and Winston become interchangeable infrastructure**, rather than architectural decisions embedded throughout Stackra.

That gives Stackra:

- one logging API
- one structured event model
- one context model
- one security/redaction pipeline
- one discovery integration
- one testing model
- multiple runtime adapters
- multiple backend implementations
- NestJS compatibility
- React compatibility
- Worker compatibility
- future OpenTelemetry compatibility

without turning `@stackra/logger` into another framework-specific wrapper.
