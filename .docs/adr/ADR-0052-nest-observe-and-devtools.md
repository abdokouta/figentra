# ADR-0052 — NestJS Observe and Devtools Standard

## Status

Accepted.

## Decision

All Figentra NestJS services use the official NestJS Observe SDK as the standard
Nest-native observability integration and the official NestJS Devtools
integration for development/CI architecture inspection.

The shared implementation lives in `@figentra/observability/nest`; services only
bind their stable service identifier.

## Observe

`@nestjs/observe` is initialized through `createObserveModule()` and the
returned `ObserveInstrument` is passed to `NestFactory.create()` as the
`instrument` application option. This is required for Nest lifecycle-aware
auto-instrumentation. It covers HTTP and, when used, Nest microservices,
GraphQL, BullMQ and scheduled jobs.

Credentials are runtime secrets:

- `OBSERVE_APP_KEY`
- `OBSERVE_APP_SECRET`

Non-secret deployment metadata:

- `OBSERVE_SERVICE_ID`
- `OBSERVE_SERVICE_VERSION` (normally the Git SHA)
- optional `OBSERVE_ENDPOINT`

Observe telemetry must never become an availability dependency: an inability to
export telemetry must not prevent the business service from starting.

## Source context

Observe source context is enabled with bounded stack-frame context. Source maps
are disabled by default to avoid shipping additional source artifacts through
telemetry.

## Devtools

Every Nest service includes `@nestjs/devtools-integration` through the shared
platform package. Devtools HTTP introspection is explicit opt-in through
`NEST_DEVTOOLS_HTTP=true` and is disabled in production. Graph snapshots are
also explicit opt-in through `NEST_DEVTOOLS_SNAPSHOT=true`.

CI graph publishing may be enabled later using the official GraphPublisher
workflow and a dedicated `DEVTOOLS_API_KEY`; credentials must never be
committed.

## MCP

NestJS Observe MCP is a read-only external telemetry interface. It is not
embedded into individual services. Access is controlled by Nest Observe MCP
tokens and project permissions.

## Existing telemetry

Better Stack remains the uptime/operational monitoring layer. Existing Sentry
integrations are not automatically removed because non-Nest runtimes may still
use them; Nest Observe is the canonical Nest application telemetry layer.

## Versioning

Figentra is currently standardized on NestJS 12.0.x. The current NestJS Observe
SDK documentation requires Nest core 11.1.4 or later, while the current Nest
core release is 12.0.1, so the integration is compatible with the repository's
Nest major line.

> Superseded/extended by ADR-0053 for the unified `@figentra/observability`
> package, Pino runtime logging, Worker logging, and web/native Stackra logging
> boundaries.
