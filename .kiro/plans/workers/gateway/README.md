# API Gateway Worker — Canonical Plan Set

The API Gateway is an independent **Cloudflare Worker + Hono** application and the public edge boundary for Figentra. It is not a NestJS business service and does not own business/domain persistence or final authorization.

Canonical documents:

- `01-architecture.md` — ownership, runtime decision, boundaries, traffic model.
- `02-implementation.md` — exact Worker/Hono source tree and production implementation contract.
- `03-routing-and-upstreams.md` — host/application/service/route resolution and upstream transport.
- `04-request-response-pipeline.md` — full ingress/egress middleware pipeline and header/context contract.
- `05-authentication-and-security.md` — edge authentication prevalidation, WAF, CORS, bot/abuse, trust boundaries.
- `06-rate-limits-cache-and-traffic-control.md` — rate limiting, quotas, concurrency, edge caching and backpressure.
- `07-registry-and-discovery.md` — Application Registry integration, route manifests and degraded behavior.
- `08-realtime-streaming-and-files.md` — WebSocket/SSE/streaming/upload/download behavior.
- `09-observability.md` — access/error logs, traces, metrics, SLOs and dashboards.
- `10-resilience-and-failure.md` — timeouts, retries, circuit breakers, fallback and origin protection.
- `11-testing.md` — unit, integration, contract, security, E2E, load, chaos and Worker-runtime tests.
- `12-deployment-and-operations.md` — Wrangler, environments, bindings, secrets, rollout, rollback and runbooks.
- `13-service-boundary-and-redundancy.md` — exact Gateway-vs-NestJS responsibility split; defines which controls remain in every service.
- `14-runtime-manifest.md` — complete route/middleware/binding/registry/observability inventory.
- `15-definition-of-done.md` — zero-deferred production release gate.

The Gateway must preserve defense in depth: edge-global transport controls are centralized here, while every NestJS service still validates trusted context, DTOs, authorization, domain invariants and its own error/transaction/runtime semantics.
