# 22 — Unified Health, Observability, Telemetry, Logging & Operational Signals

**Status:** Normative platform standard  
**Scope:** Every Figentra NestJS service, Cloudflare/Hono Worker, Vite application,
mobile application, shared package, background worker, and infrastructure component  
**Owner:** Platform / SRE / Observability  
**Related:** `09-service-communication.md`, `16-observability.md`,
`17-security-and-compliance.md`, `18-error-model-and-api-conventions.md`,
`19-environments-and-cicd.md`

> This document is the implementation contract for health, logging, telemetry,
> tracing, metrics, error reporting, uptime, and correlation across Figentra.
> The older `.kiro/specs/figentra-platform/` planning tree is reference-only and
> is not the source of truth for this standard.

---

## 1. Executive decision

Figentra will use **one conceptual operational-signal model across all runtimes**,
but will not force one runtime-specific implementation onto every platform.

The standard is:

```text
                    ┌─────────────────────────────┐
                    │       Figentra Signals       │
                    ├─────────────────────────────┤
                    │ Health / Readiness           │
                    │ Logs                         │
                    │ Traces                       │
                    │ Metrics                      │
                    │ Errors / Exceptions           │
                    │ Business Events              │
                    │ Audit Records                 │
                    └──────────────┬──────────────┘
                                   │
             ┌─────────────────────┼──────────────────────┐
             │                     │                      │
             ▼                     ▼                      ▼
       NestJS Services       Cloudflare Workers       Apps
             │                     │                      │
       Terminus + Observe     CF Observability       Sentry
       Pino / nestjs-pino     Hono + Pino             Stackra Logger
       OpenTelemetry          CF Tracing/Logs         OpenTelemetry where useful
             │                     │                      │
             └─────────────────────┼──────────────────────┘
                                   ▼
                         Central operational platform
                         Better Stack / Sentry / Cloudflare
```

The platform must preserve common identifiers and semantic fields even when the
underlying SDK differs.

### Core decisions

1. **NestJS services:** use `@nestjs/terminus` for health endpoints.
2. **NestJS services:** use `@nestjs/observe` for Nest-native telemetry where the
   deployed Nest version supports the SDK contract.
3. **NestJS services:** use structured Pino logging through the existing
   `@figentra/observability` / Stackra logging boundary; application code must
   not scatter raw `console.log`.
4. **Cloudflare Workers:** use Cloudflare Workers observability and tracing,
   Hono middleware, and the Figentra structured logging boundary; do not attempt
   to use NestJS Observe in Hono Workers.
5. **Vite/React/Expo:** use Sentry for application error/performance monitoring
   and `@stackra/logger` / `@stackra/container` for application logging/context.
6. **Health is not uptime monitoring.** Health endpoints answer whether a
   workload/dependency is currently healthy. Uptime monitoring answers whether
   an externally observable endpoint is reachable from an independent monitor.
7. **Audit is not telemetry.** Audit is a durable domain/security record owned by
   the Audit service.
8. **Business events are not logs.** Events are durable integration facts with
   contracts, versions, ownership, and delivery semantics.
9. **Correlation context must survive every synchronous and asynchronous boundary.**
10. **No signal may contain secrets, raw tokens, credentials, payment secrets, or
    unnecessary sensitive personal data.**

---

# 2. Health model

## 2.1 Why Terminus

NestJS Terminus is the standard health-check integration for NestJS services.
The current NestJS v11 documentation provides `MikroOrmHealthIndicator` as a
built-in indicator and supports custom indicators through
`HealthIndicatorService`.

Reference:
https://docs.nestjs.com/v11/recipes/terminus

Every NestJS service therefore uses:

```text
@nestjs/terminus
        │
        ├── HealthCheckService
        ├── MikroOrmHealthIndicator
        ├── HttpHealthIndicator
        ├── MemoryHealthIndicator
        ├── DiskHealthIndicator
        └── Figentra custom indicators
```

---

## 2.2 `@figentra/health`

Create a dedicated shared package:

```text
packages/health/
├── src/
│   ├── contracts/
│   ├── constants/
│   ├── decorators/
│   ├── indicators/
│   ├── nest/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   ├── health.options.ts
│   │   └── health.discovery.ts
│   ├── worker/
│   ├── testing/
│   └── index.ts
├── __tests__/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md
└── LICENSE
```

The package provides the Figentra health abstraction while delegating the
actual HTTP health implementation to the runtime's native mechanisms.

---

## 2.3 Automatic NestJS HealthModule

The desired application integration is:

```ts
@Module({
  imports: [
    FigentraHealthModule.forRoot({
      serviceName: "identity",
    }),
    IdentityModule,
  ],
})
export class AppModule {}
```

The application must **not** need to create a separate `HealthController`
manually.

`FigentraHealthModule` owns the controller.

Conceptually:

```text
AppModule
   │
   └── FigentraHealthModule
          │
          ├── HealthController
          ├── HealthCheckService
          ├── IndicatorDiscovery
          └── registered indicators
```

This is the correct abstraction because the route/controller shape is platform
standard, while indicators are service-specific.

---

## 2.4 Health indicator registration

Indicators should be discoverable through an explicit decorator.

Example conceptual API:

```ts
@FigentraHealthIndicator({
  name: "database",
  type: "readiness",
  critical: true,
})
@Injectable()
export class IdentityDatabaseHealthIndicator {
  // ...
}
```

The decorator is metadata only. It must not hide business logic.

The module discovers providers through Nest metadata / dependency injection and
builds the Terminus health checks.

### Rules

- Indicator names are stable identifiers.
- Indicator names are lowercase dotted/kebab-safe identifiers.
- Every indicator declares whether it belongs to liveness, readiness, or both.
- Critical indicators can make readiness fail.
- Non-critical indicators may report degradation without taking the service out
  of rotation.
- Indicator execution must have a timeout.
- Indicators must never perform expensive business queries.
- Indicators must never mutate state.
- Health endpoints must never expose credentials or internal secrets.
- Health responses may expose safe dependency names and statuses but not
  connection strings, host credentials, tokens, or SQL.

---

# 3. Health endpoints

Every HTTP service exposes:

```text
GET /health/live
GET /health/ready
GET /health
```

### `/health/live`

Answers:

> Is the process/runtime alive?

It must not depend on external services.

Examples:

- process event loop is functioning
- Worker invocation is functioning
- application has initialized

A database outage must not cause liveness to fail.

### `/health/ready`

Answers:

> Should this instance receive production traffic?

Typical indicators:

- PostgreSQL/MikroORM connectivity
- required Redis connectivity
- required NATS/JetStream connectivity
- required external control-plane dependency
- required configuration/secrets availability

### `/health`

Provides the aggregate human/operator view.

It may combine liveness/readiness information and include safe dependency details.

---

# 4. Health vs uptime

These are separate systems.

```text
                    Health
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
 /health/live                  /health/ready
 process alive                 ready for traffic


                    Uptime
                      │
                      ▼
             Independent monitor
                      │
                      ▼
             Public HTTPS endpoint
```

## Health

Runs **inside the application**.

It answers:

> "Am I healthy?"

## Uptime

Runs **outside the application**.

It answers:

> "Can an independent observer reach this endpoint and receive the expected
> response?"

Therefore uptime belongs to the operational monitoring layer, not the health
package.

Better Stack uptime/heartbeat monitoring can monitor:

- public Gateway endpoints
- public Portal endpoints
- production APIs
- critical Worker routes
- external webhook endpoints

It must not replace internal readiness checks.

---

# 5. Health dependency matrix

Each service must declare its health dependencies.

Example:

```yaml
health:
  liveness:
    - process
  readiness:
    - database
    - nats
    - redis
```

The manifest is declarative metadata. The actual indicator implementations
remain in code.

Example:

```text
Identity
 ├── process
 ├── PostgreSQL
 └── Supabase Auth issuer/JWKS availability where required

IAM
 ├── process
 ├── PostgreSQL
 └── policy dependencies where required

Audit
 ├── process
 ├── PostgreSQL
 └── NATS/JetStream

Gateway
 ├── Worker runtime
 └── configured upstream availability only where readiness requires it
```

Do not make Gateway readiness depend on every downstream service. Otherwise
one unhealthy service can incorrectly remove the entire Gateway from service.

---

# 6. Logging standard

## 6.1 Structured logging

Every server-side component emits structured JSON logs.

NestJS:

```text
nestjs-pino / Pino
        +
@figentra/observability
```

Workers:

```text
Hono
  +
Pino-compatible structured logger
  +
Cloudflare Workers Logs
```

Applications:

```text
React / Expo
   +
@stackra/logger
   +
Sentry
```

---

## 6.2 Required log fields

Where applicable:

```text
timestamp
level
service
service_version
environment
region
request_id
correlation_id
trace_id
span_id
operation
route
method
status_code
duration_ms
actor_id
actor_type
principal_id
tenant_id
application_id
error.code
error.type
error.message
```

Not every field is mandatory on every log line. Fields are mandatory whenever
the corresponding context exists.

---

# 7. Correlation context

The canonical context is:

```text
request_id
correlation_id
trace_id
span_id
```

## Request ID

Identifies one inbound request.

## Correlation ID

Groups related operations that may contain multiple requests/jobs.

## Trace ID

Identifies a distributed trace.

## Span ID

Identifies one operation inside a trace.

---

# 8. Context propagation

The context must survive:

```text
Browser
  ↓
Gateway
  ↓
HTTP
  ↓
Nest Service
  ↓
Repository
  ↓
Outbox
  ↓
NATS
  ↓
Consumer
  ↓
Another Service
```

and:

```text
Gateway
  ↓
Worker
  ↓
Queue
  ↓
Worker
```

and:

```text
Service
  ↓
Workflow
  ↓
Workflow step
```

### HTTP

Use standard W3C Trace Context where supported:

```text
traceparent
tracestate
```

and Figentra headers:

```text
x-request-id
x-correlation-id
```

### NATS

The event envelope carries the correlation/trace metadata.

Example:

```json
{
  "eventId": "evt_...",
  "eventType": "identity.created",
  "eventVersion": 1,
  "occurredAt": "...",
  "producer": {
    "service": "identity",
    "version": "..."
  },
  "context": {
    "requestId": "req_...",
    "correlationId": "cor_...",
    "traceId": "..."
  },
  "actor": {
    "id": "...",
    "type": "user"
  },
  "tenant": {
    "id": "..."
  },
  "payload": {}
}
```

Consumers create a child span/operation while preserving the original
correlation context.

---

# 9. Async context rules

A message must not lose its originating context merely because it is asynchronous.

The consumer must record:

```text
producer_service
consumer_service
event_id
event_type
event_version
correlation_id
trace_id
delivery_attempt
```

Retry attempts must retain the same event/correlation identity while each
delivery attempt may have its own span.

---

# 10. NestJS Observe

NestJS Observe is the official NestJS-native observability SDK.

The current NestJS documentation states that it instruments Nest request
lifecycle elements such as controllers, providers, resolvers, and queue
consumers and integrates through Nest's `instrument` application option.

Reference:

https://docs.nestjs.com/observability/overview

https://docs.nestjs.com/observability/sdk

## Figentra rule

NestJS Observe is used for **NestJS services**, not as a universal telemetry
SDK for every runtime.

A service using Observe must configure:

```text
serviceId
serviceVersion
environment
deployment metadata
```

and use the Figentra correlation context.

Observe must not replace:

- Pino application logging
- Terminus health
- Audit
- business events
- S2S security
- metrics required by the platform

It is the Nest-native instrumentation layer.

---

# 11. NestJS application initialization

The final service bootstrap concept is:

```ts
const app = await NestFactory.create(AppModule, {
  instrument: ObserveInstrument,
});
```

The exact implementation must follow the installed NestJS Observe SDK version.

The Observe SDK requires a compatible Nest core version; do not silently
downgrade Nest to satisfy an incompatible telemetry package.

---

# 12. Workers

NestJS Observe is **not** the Worker observability implementation.

Workers use:

```text
Cloudflare Workers Observability
        +
Cloudflare tracing
        +
Hono middleware
        +
@figentra/observability/worker
        +
structured logs
```

Cloudflare Workers provides native tracing instrumentation without requiring an
application SDK for basic tracing.

Reference:

https://developers.cloudflare.com/workers/observability/traces/

Cloudflare Workers Logs automatically captures Worker invocation logs, custom
logs, errors, and uncaught exceptions.

Reference:

https://developers.cloudflare.com/workers/observability/logs/workers-logs/

Tail Workers are an advanced processing/export mechanism, not the default
application logging layer.

Reference:

https://developers.cloudflare.com/workers/observability/logs/tail-workers/

---

# 13. Worker telemetry

Every Worker must have:

```text
observability enabled
structured logging
request ID
correlation ID
trace propagation
exception capture
safe error serialization
service/version/environment metadata
```

Cloudflare-native tracing remains the source of truth for Worker execution
traces.

Do not add unnecessary Node-only telemetry libraries to Workers.

---

# 14. Sentry

Sentry is the application error/performance monitoring layer for:

```text
Portal
Landing Page
Family / other Vite apps
Mobile / Expo applications
```

Sentry is not the authoritative audit store.

It is not the authoritative business-event store.

It is not a replacement for service logs.

It is not a replacement for health checks.

---

# 15. Sentry + Cloudflare

Cloudflare Workers can export OpenTelemetry telemetry to destinations including
Sentry, and Cloudflare also provides native observability.

Reference:

https://developers.cloudflare.com/workers/observability/

Figentra therefore uses:

```text
Workers
   │
   ├── Cloudflare native Logs
   ├── Cloudflare native Traces
   └── OTEL export → central platform / Sentry where configured
```

Sentry should be enabled for Worker exception/error visibility where the
operational requirement justifies it, but Cloudflare-native telemetry remains
the first-class Worker runtime signal.

Do not install multiple overlapping instrumentation agents.

---

# 16. Metrics

Metrics are divided into three classes.

## Runtime metrics

```text
CPU
memory
event loop lag
invocations
worker duration
process uptime
```

## Service metrics

```text
HTTP request count
HTTP latency
HTTP errors
DB latency
NATS publish latency
NATS consumer latency
queue depth
retry count
DLQ count
cache hit ratio
outbox backlog
```

## Business metrics

```text
tenant creation
active users
subscription state
usage
revenue
entitlements
```

Business metrics must derive from domain events/usage pipelines where possible.
Do not continuously query production transactional databases for analytics.

---

# 17. SLOs

Every production service must define:

```text
availability target
latency target
error-rate target
dependency availability target
event processing target
```

Examples:

```text
HTTP availability
HTTP p50/p95/p99
5xx rate
NATS consumer lag
outbox age
DLQ depth
health readiness failures
```

SLO definitions belong to the service's operational specification.

---

# 18. Errors

Every runtime uses a normalized error model.

Required properties:

```text
code
message
status
requestId
correlationId
traceId
details
```

Internal errors may contain diagnostic details in logs but must not expose
internal stack traces or secrets to clients.

Sentry receives exception information after redaction.

---

# 19. Redaction

The observability package owns reusable redaction primitives.

Never emit:

```text
password
access_token
refresh_token
id_token
client_secret
api_secret
private_key
database_url
authorization header
cookie contents
payment card data
security answers
raw session credentials
```

Sensitive identifiers must be hashed or replaced with stable non-secret
identifiers when correlation is required.

---

# 20. Audit boundary

Audit is separate:

```text
Technical telemetry
   ├── logs
   ├── traces
   ├── metrics
   └── errors

Business integration
   └── events

Compliance/security
   └── audit
```

The Audit service owns durable audit records.

A log saying:

```text
"user changed role"
```

does not replace the durable audit record.

---

# 21. Business events

Events are durable facts.

Example:

```text
identity.created
tenant.created
role.assigned
policy.updated
approval.requested
approval.approved
entitlement.granted
usage.recorded
notification.sent
```

Events use the existing Figentra event envelope and transactional outbox.

Observability context is metadata on the event; it does not turn an operational
log into an event.

---

# 22. Outbox observability

Every service using an outbox exposes metrics:

```text
outbox.pending_count
outbox.oldest_age_seconds
outbox.publish_success_total
outbox.publish_failure_total
outbox.retry_total
outbox.dlq_total
```

Alert conditions include:

```text
oldest event age > threshold
retry growth
DLQ growth
relay stopped
consumer lag
```

---

# 23. NATS observability

NATS/JetStream telemetry must expose:

```text
stream
consumer
subject
event type
event version
delivery attempt
ack latency
processing duration
consumer lag
redelivery count
DLQ state
```

Do not log full event payloads by default.

Payload logging is opt-in and must be redacted.

---

# 24. Database observability

MikroORM/database integrations must provide:

```text
query duration
connection acquisition time
pool saturation
transaction duration
rollback count
deadlock count
migration state
```

Do not log full SQL with secrets or tenant-sensitive values.

Health uses a lightweight database ping/check. It must not execute expensive
application queries.

---

# 25. Cache observability

Cache metrics:

```text
cache.hit
cache.miss
cache.set
cache.invalidate
cache.error
cache.latency
```

Cache logs must not contain secret values.

Cache health is readiness-critical only when the service cannot function
correctly without that cache.

A normal cache outage should generally degrade performance rather than make
the service unavailable.

---

# 26. Logging ownership

Application code uses the application's injected logger.

### NestJS

```text
Pino
  ↓
nestjs-pino / Figentra logger integration
```

### Worker

```text
Hono
  ↓
Figentra structured logger
  ↓
Cloudflare Workers Logs
```

### Frontend/mobile

```text
@stackra/logger
  ↓
Sentry / application telemetry
```

No production application code should use:

```ts
console.log(...)
```

as its primary logging mechanism.

Raw `console.error` may only be used at a runtime bootstrap boundary when
required by the runtime before the structured logger is initialized.

---

# 27. Logger levels

Standard:

```text
trace
debug
info
warn
error
fatal
```

Production defaults:

```text
info
```

Development may use:

```text
debug
```

Never enable verbose/debug production logging globally without an explicit
operational reason.

---

# 28. Request logging

The Gateway logs:

```text
incoming request
authentication result
authorization decision
routing target
upstream latency
final response
```

But sensitive credentials are never logged.

Services log:

```text
request start/end
business operation
dependency failures
transaction outcome
event publication
```

Avoid duplicate request logs at every layer if the same event is already
captured by framework instrumentation.

---

# 29. Correlation across frontend

The frontend starts/receives request context where appropriate:

```text
Browser
   ↓
Gateway
```

The Gateway becomes the authoritative server-side request context boundary.

Frontend logs and Sentry events should attach:

```text
request_id
correlation_id
trace_id
application
version
environment
```

where available.

---

# 30. Mobile

Mobile uses:

```text
@stackra/logger
@stackra/container
Sentry
```

The mobile app must capture:

```text
application version
build number
device/platform metadata
environment
session identifier
correlation context where available
```

Do not collect unnecessary personal/device data.

---

# 31. Health response security

Health endpoints are operational endpoints.

Public endpoints must return only safe information.

Internal endpoints may provide more dependency information but must still never
return:

```text
credentials
connection strings
JWTs
secrets
environment variable dumps
database URLs
NATS credentials
```

If detailed diagnostics are required, protect them through the operational
network/access boundary.

---

# 32. Authentication and authorization

Health checks should normally bypass business authorization only for
liveness/readiness probes where infrastructure needs unauthenticated access.

However:

```text
public diagnostic endpoints
```

must not become information disclosure endpoints.

Use separate detail endpoints or protected operational endpoints when required.

---

# 33. Health indicator categories

Standard categories:

```text
process
database
cache
messaging
external_http
storage
configuration
identity
dependency
workflow
```

Every indicator should expose:

```text
name
status
duration
criticality
dependency
safe metadata
```

---

# 34. Indicator timeouts

Every external health check has a hard timeout.

Health must fail fast.

A health request must not wait indefinitely for:

```text
PostgreSQL
Redis
NATS
Supabase
HTTP dependency
```

The timeout must be shorter than the infrastructure probe timeout.

---

# 35. Graceful shutdown

NestJS services must enable shutdown hooks.

Health readiness must transition to failing/terminating state before the process
fully exits so load balancers stop sending traffic.

Workers must respect Cloudflare execution/lifecycle constraints rather than
assuming Node process shutdown semantics.

---

# 36. Health package API

The intended package API is conceptually:

```text
@figentra/health
@figentra/health/contracts
@figentra/health/nest
@figentra/health/worker
@figentra/health/testing
```

### Contracts

Framework-neutral:

```text
HealthStatus
HealthIndicatorDefinition
HealthIndicatorResult
HealthCheckContext
HealthDependency
```

### Nest

```text
FigentraHealthModule
FigentraHealthController
FigentraHealthExplorer
FigentraHealthIndicator
```

### Worker

```text
createWorkerHealthHandler
createWorkerHealthRegistry
```

### Testing

```text
createHealthyIndicator
createFailingIndicator
assertHealthResponse
```

---

# 37. Dynamic controller decision

**Yes: use one shared controller implementation.**

Do not generate one physical `health.controller.ts` in every service.

Instead:

```text
@figentra/health/nest
       │
       └── HealthController
```

is imported by:

```text
Identity AppModule
IAM AppModule
Tenant AppModule
...
```

The controller is generic.

The service contributes indicators.

This gives:

```text
one implementation
many registrations
service-specific dependencies
consistent endpoint behavior
```

---

# 38. Dynamic indicator discovery

Decorator registration is allowed and preferred.

However, discovery must remain explicit enough to be statically analyzable.

Avoid magical runtime filesystem scanning.

Recommended:

```text
Decorator metadata
      +
Nest dependency injection
      +
module provider registration
```

rather than:

```text
scan entire src directory at runtime
```

---

# 39. Observability package responsibilities

`@figentra/observability` owns:

```text
contracts
context
correlation
redaction
logger adapters
Nest Observe integration
Worker logging integration
telemetry testing
```

It does not own:

```text
health
audit
business events
NATS
database
billing
```

Those remain separate bounded packages.

---

# 40. Health package responsibilities

`@figentra/health` owns:

```text
health contracts
indicator registration
Terminus integration
health controller
health response format
timeouts
health testing
Worker health adapter
```

It does not own:

```text
logging backend
Sentry
Better Stack
NATS
audit
business metrics
```

---

# 41. Operational signal routing

Recommended target:

```text
                     ┌───────────────┐
                     │   Figentra    │
                     │ applications  │
                     └───────┬───────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
          Logs             Traces           Errors
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                    Central telemetry
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
           Better Stack                Sentry
                 │
                 ▼
             Alerts/SLO
```

Cloudflare Workers additionally retain native Cloudflare observability.

---

# 42. Better Stack

Better Stack is an operational aggregation/alerting destination, not an
application library.

Use it for:

```text
logs
uptime
alerts
incident workflows
on-call
status page
operational dashboards
```

Infrastructure configuration is Terraform-managed.

Application code should not contain Better Stack-specific business logic.

---

# 43. Sentry

Sentry is primarily:

```text
frontend errors
mobile errors
application exceptions
performance diagnostics
release/source-map diagnostics
```

Sentry is not:

```text
audit database
business event bus
primary database
health endpoint
service authorization system
```

---

# 44. Cloudflare

Workers use Cloudflare-native:

```text
Workers Logs
Tracing
Real-time logs
Tail Workers when justified
OTEL export where configured
```

Cloudflare's current documentation explicitly states that Workers tracing is
automatically instrumented and that Workers Logs collect invocation logs,
custom logs, errors, and uncaught exceptions.

---

# 45. Alerting

Alerts should be based on actionable conditions.

Examples:

```text
5xx rate > threshold
p95 latency > threshold
readiness failures
outbox oldest age
NATS consumer lag
DLQ depth
database pool saturation
cache failure rate
Worker error rate
SLO burn rate
uptime failure
```

Do not alert on every individual error.

---

# 46. SLO burn-rate model

Production alerts should eventually use SLO burn-rate logic rather than
simple threshold-only alerts for critical services.

Minimum:

```text
fast burn alert
slow burn alert
```

The exact thresholds are defined per service in its operational specification.

---

# 47. Release correlation

Every deployment must emit:

```text
service
version
environment
deployment_id
commit_sha
build_id
```

Telemetry must allow an operator to answer:

> Did this regression begin with deployment X?

---

# 48. Feature flags

Feature flag evaluations should include:

```text
flag key
flag version
environment
application
tenant where permitted
```

Do not log full flag payloads when they contain sensitive configuration.

---

# 49. Sampling

Tracing may be sampled.

Errors and critical security signals must not be blindly dropped.

Recommended model:

```text
normal traces      sampled
slow traces        retained
errors             retained
critical flows     elevated sampling
health probes      low-value / configurable
```

Audit and durable business events are never controlled by telemetry sampling.

---

# 50. Privacy

Observability follows data minimization.

Before adding a field ask:

1. Is it operationally necessary?
2. Is it sensitive?
3. Can it be pseudonymized?
4. Does it require retention?
5. Does it cross a regional boundary?
6. Is it allowed under the applicable privacy policy?

---

# 51. Testing

## Health unit tests

Every indicator:

```text
healthy
unhealthy
timeout
dependency exception
safe metadata
criticality
```

## Health integration tests

Every service:

```text
/health/live
/health/ready
/health
```

must be tested.

## Observability tests

Verify:

```text
request_id propagation
correlation_id propagation
trace context
log fields
redaction
error serialization
```

## Async tests

Verify:

```text
event context
NATS context
retry context
DLQ context
outbox context
```

---

# 52. Contract tests

The shared packages must provide contract tests proving that:

```text
Gateway → service
Service → service
Service → NATS
Worker → Worker
Frontend → Gateway
```

preserve the required operational context.

---

# 53. E2E verification

At least one full trace must be verifiable:

```text
Portal
 ↓
Gateway
 ↓
Identity
 ↓
IAM
 ↓
Tenant
 ↓
Outbox
 ↓
NATS
 ↓
Audit
```

The exact flow can be substituted with another representative production flow,
but it must demonstrate cross-boundary context preservation.

---

# 54. Operational dashboards

Minimum dashboards:

### Platform

```text
availability
latency
5xx
active deployments
dependency health
```

### Messaging

```text
outbox
NATS
consumer lag
retry
DLQ
```

### Database

```text
latency
pool
errors
transactions
locks
```

### Workers

```text
invocations
duration
errors
CPU
subrequests
```

### Applications

```text
JS errors
mobile crashes
performance
release health
```

---

# 55. Runbooks

Each critical alert must link to a runbook.

Minimum runbooks:

```text
database unavailable
NATS unavailable
Redis unavailable
outbox stuck
DLQ growth
Gateway 5xx
identity unavailable
IAM unavailable
Worker elevated errors
Sentry crash spike
SLO burn
uptime outage
```

---

# 56. What is intentionally NOT combined

Do not create one giant package containing:

```text
health
logging
metrics
audit
events
NATS
Sentry
Better Stack
```

Instead:

```text
@figentra/health
@figentra/observability
@figentra/events
@figentra/messaging
@figentra/outbox
@figentra/audit contracts/client where appropriate
```

They share contracts and context, not ownership.

---

# 57. Final runtime matrix

| Runtime | Health | Logging | Tracing | Errors | Uptime |
|---|---|---|---|---|---|
| NestJS | Terminus | Pino/nestjs-pino | Nest Observe / OTEL | Sentry where appropriate | Better Stack |
| Hono Worker | Worker health handler | Hono/Pino + CF Logs | Cloudflare tracing | Sentry/CF | Better Stack |
| Vite | browser health only where useful | Stackra Logger | browser tracing where justified | Sentry | Better Stack |
| Mobile | app diagnostics | Stackra Logger | mobile tracing where justified | Sentry | external monitoring |
| NATS consumers | process/readiness | Pino | event trace context | Sentry/central telemetry | service monitor |
| Infrastructure | platform checks | platform logs | provider telemetry | provider tooling | Better Stack |

---

# 58. Golden rules

1. Health is not uptime.
2. Logs are not audit.
3. Events are not logs.
4. Sentry is not the source of truth for audit.
5. Terminus owns NestJS health orchestration.
6. `@figentra/health` owns the common health abstraction.
7. One shared HealthController is preferable to duplicating controllers.
8. Indicators belong to the service that owns the dependency/domain.
9. Liveness must not depend on external services.
10. Readiness may depend on critical dependencies.
11. Health checks must be fast and bounded.
12. Correlation survives HTTP and asynchronous boundaries.
13. W3C Trace Context is the preferred distributed trace context.
14. `request_id` and `correlation_id` remain Figentra operational identifiers.
15. Every production log is structured.
16. Secrets are never logged.
17. NestJS services use Nest-native observability.
18. Workers use Cloudflare-native observability.
19. Vite/mobile use Sentry + Stackra logging.
20. Business metrics should be derived from domain/event/usage pipelines.
21. Audit remains a durable security/compliance record.
22. Outbox telemetry is mandatory wherever outbox is used.
23. NATS delivery metadata is observable.
24. Deployment identity is attached to telemetry.
25. Alerts must be actionable.
26. Every critical alert has a runbook.
27. Runtime-specific SDKs must not leak into framework-neutral contracts.
28. No raw `console.log` as application logging.
29. No duplicate telemetry agents without an ADR.
30. Operational observability must never become a hidden business dependency.

---

# 59. Implementation checklist

## Health package

- [ ] Create `@figentra/health`
- [ ] Define contracts
- [ ] Define indicator decorator
- [ ] Define indicator metadata
- [ ] Define Nest `FigentraHealthModule`
- [ ] Define dynamic `HealthController`
- [ ] Define Terminus adapter
- [ ] Define indicator discovery
- [ ] Define timeout handling
- [ ] Define readiness/liveness separation
- [ ] Define worker adapter
- [ ] Define testing utilities
- [ ] Add OpenAPI documentation
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Add README
- [ ] Add package exports
- [ ] Add TSDoc

## NestJS services

- [ ] Import shared health module
- [ ] Register service indicators
- [ ] MikroORM health
- [ ] NATS health where required
- [ ] Redis health where required
- [ ] External dependency health where required
- [ ] Enable shutdown hooks
- [ ] Configure Nest Observe
- [ ] Configure Pino
- [ ] Configure correlation
- [ ] Configure redaction
- [ ] Configure metrics
- [ ] Test health endpoints

## Workers

- [ ] Worker health endpoint
- [ ] Worker structured logging
- [ ] Request ID
- [ ] Correlation ID
- [ ] Trace propagation
- [ ] Cloudflare observability
- [ ] Error reporting
- [ ] Source maps
- [ ] SLO metrics
- [ ] Integration tests

## Applications

- [ ] Sentry
- [ ] Stackra logger
- [ ] release/version metadata
- [ ] correlation context
- [ ] source maps
- [ ] browser/mobile performance telemetry
- [ ] critical-flow E2E coverage

## Operations

- [ ] Better Stack monitors
- [ ] Uptime checks
- [ ] SLOs
- [ ] Alerts
- [ ] Dashboards
- [ ] Runbooks
- [ ] Deployment correlation
- [ ] Incident workflow
- [ ] DR observability verification

---

# 60. Acceptance criteria

This standard is complete only when:

- every NestJS service has standardized health endpoints;
- no service manually duplicates the standard HealthController;
- every critical dependency has a bounded readiness indicator;
- Worker health follows Worker-native constraints;
- all runtime logs contain the required context where available;
- HTTP context propagates end-to-end;
- NATS context propagates end-to-end;
- errors are captured and redacted;
- Sentry is configured for supported application runtimes;
- Cloudflare observability is configured for Workers;
- NestJS Observe is configured for Nest services;
- uptime monitors are independent from health endpoints;
- audit remains separate;
- business events remain separate;
- outbox and messaging telemetry exists;
- dashboards and alerts exist for production;
- critical alerts have runbooks;
- unit/integration/E2E tests prove the signal contract;
- no production secret is present in telemetry;
- deployment/version metadata is queryable;
- the complete request-to-event trace can be followed across service boundaries.

---

## 61. Authoritative references

NestJS Terminus v11:

https://docs.nestjs.com/v11/recipes/terminus

NestJS Observability:

https://docs.nestjs.com/observability/overview

NestJS Observe SDK:

https://docs.nestjs.com/observability/sdk

Cloudflare Workers Observability:

https://developers.cloudflare.com/workers/observability/

Cloudflare Workers Traces:

https://developers.cloudflare.com/workers/observability/traces/

Cloudflare Workers Logs:

https://developers.cloudflare.com/workers/observability/logs/workers-logs/

Cloudflare Tail Workers:

https://developers.cloudflare.com/workers/observability/logs/tail-workers/

---

**Last reviewed:** 2026-09-01  
**Classification:** Platform Standard  
**Implementation policy:** No placeholder/shim/stub implementation is considered
complete. Runtime-specific differences must be explicit adapters behind the
common Figentra operational-signal contract.
