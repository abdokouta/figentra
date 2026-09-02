# @figentra/observability

Unified Figentra observability platform package.

## Public subpaths

- `@figentra/observability/contracts` — framework-neutral telemetry and service identity contracts.
- `@figentra/observability/core` — framework-neutral context and redaction primitives.
- `@figentra/observability/nest` — NestJS Observe and Devtools integration.
- `@figentra/observability/worker` — Hono structured logging backed by Pino.
- `@figentra/observability/testing` — deterministic telemetry test fixtures.

## Runtime boundary

NestJS services use `nestjs-pino` for structured application logging and NestJS
Observe for Nest-native telemetry. Cloudflare Workers use Hono/Pino without
Node-only transports. React/Expo applications use the Stackra logging and
container packages.

Audit records are domain/security records owned by the Audit service and are
never substituted by technical telemetry.
