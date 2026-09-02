# FigenTra Health Standard

**Status: Accepted**

## Boundary

`@figentra/health` is the provider-neutral health contract. `@figentra/health/core` owns health semantics. NestJS and Worker packages are adapters over core.

## Naming

Use `define*` for declarative integration surfaces:

- `defineHealthService()` — defines the core health service.
- `defineHealthRoutes()` — declares route definitions.
- `defineHealthController()` — defines the Nest controller class from adapter configuration.

Do not standardize `createHealthRoute()` or `createHealthHandler()`. Use `create*` only where construction of a runtime object is itself the public abstraction.

## NestJS

NestJS automatic indicator discovery remains supported. The adapter scans Nest providers for the adapter-specific `@HealthIndicator()` metadata and registers instances into the core `HealthService`.

The health controller remains factory-generated so route paths and adapter configuration are controlled at module-definition time. The controller must not contain health evaluation, indicator orchestration, timeout handling, failure policy or aggregation logic.

## Terminus

`@nestjs/terminus` is not required. FigenTra health is implemented from the ground up. Terminus may only appear in a separately named legacy compatibility adapter; it must never become a core dependency or a primary Nest adapter dependency.

## Core responsibilities

- indicator contracts and metadata;
- instance-scoped registration;
- probe selection;
- parallel execution and failure isolation;
- per-indicator/default timeouts;
- latency measurement;
- critical/degraded/ignore failure policy;
- stable `HealthReport` JSON model;
- runtime-capability abstraction for environment-specific metrics.

## Adapter responsibilities

Adapters own only:

- route/controller definitions;
- framework lifecycle/discovery;
- HTTP status codes;
- HTTP headers/serialization;
- framework-specific dependency injection.

## Response

Canonical JSON is a transport-neutral `HealthReport` with `status`, `probe`, `timestamp`, `durationMs` and named `checks`. HTTP status, headers and framework response objects belong to adapters.
