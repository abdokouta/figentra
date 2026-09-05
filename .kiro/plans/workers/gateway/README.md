# API Gateway Worker — Canonical Plan Set

The API Gateway is an independent **Cloudflare Worker + Hono** application and the public edge boundary for Figentra. It is not a NestJS business service and does not own business/domain persistence or final authorization.

## Canonical documents

- `01-architecture.md` — runtime decision, ownership, trust boundaries and traffic model.
- `02-implementation.md` — Worker/Hono source tree, middleware composition and implementation contract.
- `03-routing-and-upstreams.md` — host/application/route resolution, Service Bindings and authenticated HTTPS origins.
- `04-request-response-pipeline.md` — canonical ingress/egress pipeline and context/header propagation.
- `05-authentication-and-security.md` — token prevalidation, origin protection, CORS, headers and public security controls.
- `06-rate-limits-cache-and-traffic-control.md` — WAF/rate limiting, concurrency, edge caching, traffic shaping and backpressure.
- `07-registry-and-discovery.md` — Application Registry integration, route manifests, cache/freshness and failure policy.
- `08-realtime-streaming-and-files.md` — WebSocket, SSE, streaming, upload/download and raw webhook transport.
- `09-observability.md` — edge access/error logs, request/correlation/trace propagation, metrics, SLOs and alerts.
- `10-resilience-and-failure.md` — deadlines, retries, circuit breakers, Registry/upstream failure and safe degradation.
- `11-api-and-error-contract.md` — Gateway-owned public endpoints, proxy/error/header/status semantics.
- `12-configuration-and-registry.md` — Worker configuration/bindings/secrets plus Gateway metadata published to Registry.
- `13-testing.md` — unit, integration, contract, security, E2E, load, failure and real Worker-runtime tests.
- `14-deployment-and-operations.md` — Wrangler environments, rollout, rollback, capacity, security operations and runbooks.
- `15-service-boundary-and-redundancy.md` — canonical Gateway-vs-NestJS responsibility matrix.
- `16-definition-of-done.md` — zero-deferred production completion gate.
- `17-runtime-manifest.md` — complete runtime inventory of middleware, routes, security, bindings, traffic, realtime/files and telemetry.

## Core rule

The Gateway centralizes **public edge-global transport concerns**. Every NestJS service remains an independent security and correctness boundary. Services continue to validate/adopt propagated request context, strictly validate DTOs, establish Principal/Tenant context, perform authoritative IAM/commercial decisions, enforce domain invariants/idempotency/transactions, map domain errors and emit service-level observability.

A request can therefore have both Gateway and service controls without harmful duplication because they protect different trust boundaries. The exact split is defined in `15-service-boundary-and-redundancy.md`.