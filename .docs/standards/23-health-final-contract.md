# Health Module Contract

**Status: Accepted**

## Boundary

`@figentra/health` is the provider-neutral health contract. `@figentra/health/core` owns health semantics. NestJS and Worker packages are adapters over core.

## Route definition standard

Integration APIs use `define*` for declarative surfaces. Health routing MUST expose `defineHealthRoutes()` rather than `createHealthRoute()` / `createHealthHandler()` as the public standard.

A route definition is data: method, path and probe. Transport adapters execute that definition.

## NestJS

NestJS automatic indicator discovery remains supported. The adapter scans Nest providers for the adapter-specific `@HealthIndicator()` metadata and registers instances into the core `HealthService`.

The Nest controller MUST remain factory-generated. `defineHealthController()` controls route path configuration and delegates every health decision to the core service.

## Terminus

`@nestjs/terminus` is not required. FigenTra health is implemented from the ground up. Terminus may only appear later as an explicit compatibility adapter if legacy applications require it; it must never become a core dependency or a primary Nest adapter dependency.

## Indicator metadata

Indicators should declare a stable name, probes, criticality/failure policy, timeout, description and tags where useful. A failed critical indicator makes the report `down`. A non-critical/degraded indicator makes the report `degraded`. Isolated indicator failures never crash the health endpoint.

## Runtime-specific metrics

Node-only capabilities such as process memory and filesystem disk statistics are injected through `HealthRuntime`. Core contains the indicator algorithms; runtime adapters supply capabilities. Unsupported capabilities return `unknown` rather than pretending the metric exists.

## Response

Canonical JSON is a transport-neutral `HealthReport` with `status`, `probe`, `timestamp`, `durationMs` and named `checks`. HTTP status, headers and framework response objects belong to adapters. The default mapping is `down` => 503; other statuses => 200.
