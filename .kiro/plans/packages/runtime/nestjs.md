---
status: canonical
component: runtime
package: "@stackra/nestjs"
---
# `@stackra/nestjs` — implementation-complete plan

## Purpose
Canonical NestJS integration layer for Figentra services. It standardizes modules, controllers, pipes, guards/interceptors, request context, discovery, health/readiness, OpenAPI and role-based process composition while keeping domain code framework-testable.

## Service roles
One service source tree exposes `api`, `consumer`, `worker` and `scheduler` roles. Role bootstrap selects modules/transport consumers but never duplicates domain implementations into separate worker trees.

## API contracts
`createNestApplication`, `createServiceModule`, `RequestContextGuard`, `ValidationPipe`, `AuthorizationGuard`, `ErrorInterceptor`, `TraceInterceptor`, `HealthController`, `OpenApiModule`, `NatsTransportModule` and typed lifecycle helpers. Controllers call application use cases, never repositories directly.

## Controller factory
Route/controller construction is explicit and deterministic. Health endpoints are defined through the shared health contract; services do not create arbitrary health handlers. Discovery is used for registration of decorated providers, not for hidden business behavior.

## Security
Authentication context is established before validation/authorization. IAM is the authorization boundary. Request IDs, correlation IDs and trace context are propagated. Error serialization uses `@stackra/errors`; secret-bearing headers are redacted.

## Messaging
NATS/JetStream consumers use versioned `@stackra/contracts`, bounded concurrency, ack/retry/DLQ semantics and graceful drain. HTTP uses Fastify adapter and `@stackra/http` policies.

## Testing
Module bootstrap, controller contracts, validation, guards, discovery, NATS consumer lifecycle, health/readiness, OpenAPI fixtures, graceful shutdown and role matrix tests.

## Completion criteria
All NestJS services use one bootstrap/runtime convention; no mirrored workers, ad-hoc controller factories, direct environment access, or duplicated authorization/error pipelines exist.