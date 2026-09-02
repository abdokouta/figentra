# Service — gateway

**Status:** Normative component implementation specification.

## Purpose

Public application API boundary implemented with NestJS + Fastify. It authenticates callers, establishes trusted request context, resolves routes through Registry, obtains audience-bound downstream credentials from Identity, asks IAM for authoritative permission decisions, forwards requests safely, and normalizes failures.

## Boundary

The Gateway owns edge/application transport concerns only. It never owns domain entities, writes service databases, executes domain events, or substitutes for Identity/IAM/Registry.

## Runtime

- Path: `services/gateway`
- Package: `@figentra/gateway`
- Runtime: Node.js 24 + NestJS 12 + Fastify 5
- Public HTTP: `/api/v1/*`
- OpenAPI: `/api/docs`

## Mandatory pipeline

Request context → security/CORS → authentication → validation → Registry route resolution → IAM authorization → Identity token exchange → upstream request → normalized response.

## Security

- Validate JWT signature, issuer, audience and expiry.
- Never trust identity/tenant/permission headers.
- Do not forward caller bearer tokens to downstream services.
- Exchange for a short-lived audience-bound service token.
- Fail closed when IAM or Identity is unavailable.
- Bound request size, timeout and retry behavior.
- Retry only idempotent safe methods.
- Redact authorization/cookies/secrets from logs.

## Middleware / guards / interceptors / pipes

- Request context middleware: request ID, correlation ID and traceparent.
- Security middleware: conservative security headers.
- CORS middleware: explicit origin allow-list.
- Authentication guard: JWT trust boundary.
- Global ValidationPipe: strict whitelist/no implicit conversion.
- Request context interceptor: response correlation headers.
- Security headers interceptor: final response hardening.
- Logging interceptor: structured Pino completion/error records.
- Global exception filter: platform error envelope without leakage.

## Service communication

- Registry: authenticated HTTP for route resolution.
- Identity: authenticated HTTP for downstream token exchange.
- IAM: authenticated HTTP for authorization decisions.
- NATS is not used for request/response routing of public API calls. Domain events remain service-owned and use the transactional outbox/NATS architecture.

## Caching

Gateway caching is limited to explicitly safe, non-user-specific representations. It is never an authorization source. Route discovery caching, when introduced, must preserve Registry invalidation/version semantics.

## Health / observability

- Public liveness/readiness endpoints.
- Shared Figentra observability module.
- Pino structured logs.
- request_id, correlation_id and W3C trace context propagation.

## Testing

- Unit: middleware, guards, pipes, filters and configuration.
- Integration: Registry/IAM/Identity/upstream boundaries using real test infrastructure.
- Contract: Registry route response and Identity exchange response.
- E2E: authenticated browser/API flows against deployed staging.
- Load/reliability: latency, concurrency, upstream timeout, retry and failure behavior.

## Infrastructure

Cloudflare remains the external edge WAF/DDoS/DNS layer. Gateway runs as a production Node container. Environment names are `development`, `staging`, `production`.

## Implementation status

The canonical Gateway implementation is `services/gateway`. The former Hono/Cloudflare Worker Gateway is removed. Cloudflare remains an external edge protection layer; it is not the application Gateway runtime.
