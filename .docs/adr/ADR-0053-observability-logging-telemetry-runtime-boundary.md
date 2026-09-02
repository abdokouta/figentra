# ADR-0053 — Unified Observability, Logging, and Telemetry Runtime Boundary

## Status

Accepted.

## Decision

Figentra uses one platform package, `@figentra/observability`, with explicit
subpath exports:

- `@figentra/observability/contracts`
- `@figentra/observability/core`
- `@figentra/observability/nest`
- `@figentra/observability/worker`
- `@figentra/observability/testing`

The package is versioned atomically, while consumers import only the subpath
needed by their runtime.

## Runtime logging standards

### NestJS services

Every NestJS service MUST:

1. Use Fastify as the HTTP adapter.
2. Use `nestjs-pino` as the Nest logger integration.
3. Register `LoggerModule.forRoot(...)` exactly once in the root module.
4. Call `app.useLogger(app.get(Logger))` during bootstrap.
5. Emit structured JSON logs in production.
6. Propagate `x-request-id`, `x-correlation-id`, and `traceparent`.
7. Redact authentication credentials and secrets.
8. Never write application log files inside containers.
9. Use NestJS Observe for Nest-native telemetry.
10. Keep Devtools HTTP introspection disabled by default.

`@nestjs/observe` and `@nestjs/devtools-integration` are provided by the
`@figentra/observability/nest` integration.

### Cloudflare Workers

Every Hono Worker MUST:

1. Use the `@figentra/observability/worker` integration.
2. Use Hono/Pino request logging without Node-only transports.
3. Establish request/correlation identifiers before logging.
4. Emit structured logs through the Worker runtime.
5. Never log bearer tokens, cookies, secrets, or credentials.
6. Keep telemetry processing outside the Worker request path where possible.

`hono-pino` is used as the Pino middleware. It has partial edge-runtime
support; advanced Node-only Pino transports are explicitly prohibited in
Cloudflare Workers.

### Web and native applications

Vite and Expo applications use:

- `@stackra/logger` for application logging.
- `@stackra/container` for dependency injection and lifecycle composition.

The application runtime must not directly depend on `pino`.

## Observability versus audit

Technical telemetry is not an audit ledger.

- Logs: technical diagnostic records.
- Telemetry: traces, metrics, profiles, request/job/runtime signals.
- Audit: authoritative security/business records owned by `services/audit`.

Audit records are produced from durable domain events/outbox flows and must
remain available even when technical observability is degraded.

## No telemetry microservice

Figentra MUST NOT introduce a generic telemetry forwarding microservice.
Nest Observe and the runtime logging pipelines already provide the technical
telemetry path.

The Audit Service remains a full NestJS domain service because it owns durable
storage, querying, retention, authorization, event consumption, and compliance
semantics.

## Security

Secrets are runtime-only. Observe credentials are supplied through the
secret manager/runtime environment and never stored in `cloud.yaml` or source.
