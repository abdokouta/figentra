# ADR-0021 — Runtime Foundation

## Status
Accepted.

## Decision
Figentra backend services use Node.js 24 LTS, NestJS, Fastify, SWC, Pino, Vitest,
Oxlint, Prettier, and validated configuration. NestJS HTTP services use the
Fastify adapter. `main.ts` is the standard process entrypoint; separate
`main.cli.ts` or `main.worker.ts` files are introduced only for independently
deployable processes.

## Boundaries
Business logic belongs to domain/application modules. Bootstrap code wires the
application and infrastructure but does not contain business rules.

## Consequences
A single predictable runtime contract is shared across services while allowing
additional processes only when a real deployment boundary exists.

## Observability

All NestJS services use the shared `@figentra/observability/nest` package. It
configures the official `@nestjs/observe` SDK and `@nestjs/devtools-integration`
without duplicating instrumentation code in individual services. Observe is
the primary Nest-native telemetry platform; Devtools HTTP introspection is
explicitly disabled in production. See ADR-0052.
