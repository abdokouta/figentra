---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
runtime: cloudflare-worker
---

# API Gateway — independent Cloudflare Worker implementation plan

## Runtime

Cloudflare Worker + Hono. The Gateway is the public edge boundary and is not a business service. fileciteturn626file0

## Ownership

Owns DNS/host resolution, request normalization, authentication/token prevalidation, request/correlation/trace IDs, CORS/security headers, edge rate limiting, route resolution, Worker Service Bindings, authenticated container forwarding and normalized transport errors.

It must not own business persistence, billing, domain rules, complex workflows or final authorization authority.

## Source layout

```text
workers/gateway/
├── src/bootstrap/
├── src/routes/{health,proxy,webhooks}
├── src/routing/{host,application,service}
├── src/security/{auth,headers,cors,ratelimit}
├── src/context/{request,tenant,correlation,trace}
├── src/upstream/{bindings,http,retry,timeout}
├── src/observability/{logging,tracing,metrics}
└── src/index.ts
├── wrangler.toml
└── __tests__/{unit,integration,contract,e2e,security}/
```

## Request pipeline

```text
Cloudflare DNS/WAF
 → host/runtime resolution
 → request/correlation/trace context
 → token prevalidation
 → CORS/security headers
 → edge rate limit
 → Registry route resolution
 → Service Binding or authenticated HTTPS
 → owning service
 → normalized response
```

Gateway authorization is never the only authorization layer. Services re-establish trusted context and perform authoritative IAM/commercial checks.

## Security

Never trust browser-supplied tenant/application IDs. Validate token issuer/audience/signature/expiry, bind routing to trusted registry metadata and prevent origin disclosure. SSRF is prohibited in dynamically constructed upstream URLs. Webhook routes validate signatures before dispatch.

## Resilience

Set upstream connection/request timeouts, bounded retries only for safe/idempotent operations, circuit protection for repeated dependency failure and fail-closed routing when the registry contract is unavailable for a protected route. Worker invocations are stateless.

## Observability

Every request emits structured access/error logs and propagates trace/request/correlation identifiers. Metrics cover route latency, upstream status, rate limiting and authentication failures. Never log credentials or full request bodies by default.

## Testing

Required: health/readiness, route resolution, unknown host/route, request IDs, trace propagation, CORS, header policy, JWT validation/JWKS rotation, IAM allow/deny handoff, rate limits, upstream timeout/4xx/5xx, retry safety, Registry routing and Service Binding behavior.

## Deployment

Wrangler manages Worker/environment configuration. Development/staging/production are isolated. Secrets are bindings, never source. Deployment is immutable and smoke-tested against real Worker runtime semantics.

## Exit criteria

Deterministic edge routing, secure authentication prevalidation, no business logic/persistence leakage, bounded upstream behavior, complete runtime/security/conformance tests and production-safe Worker deployment.

## Cross-references

`.kiro/specs/figentra-platform/workers/01-gateway.md`, `.kiro/plans/workers/registry.md`, `.kiro/plans/01-global/service-worker-architecture.md`.
