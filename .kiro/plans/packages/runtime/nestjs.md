---
status: canonical
component: package
package: "@stackra/nestjs"
---
# NestJS Runtime — implementation plan

Canonical NestJS adapter over the runtime-neutral platform. Owns bootstrap, modules, DI integration, HTTP/NATS/queue role adapters, validation, OpenAPI, lifecycle and health/readiness integration.

## Baseline
NestJS v12-aligned `@nestjs/*` versions; Fastify where repository standards require it; Standard Schema validation; versioned OpenAPI; NATS v3 transport; graceful shutdown and hybrid roles where needed.

## API/layout
`bootstrap`, `modules`, `di`, `http`, `microservices`, `queues`, `validation`, `openapi`, `health`, `lifecycle`, `testing`.

## Rules
No business modules inside the runtime package. Runtime role is explicit (`api|consumer|worker|scheduler`); request scope is explicit; no global mutable tenant state.

## Testing
Bootstrap smoke tests, validation/OpenAPI conformance, NATS/queue integration, health/readiness, shutdown/drain and role isolation.

## Exit criteria
Every NestJS service follows one production bootstrap/runtime standard with no competing framework adapters.
