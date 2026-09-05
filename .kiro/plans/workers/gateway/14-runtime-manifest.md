---
status: canonical
document: gateway-runtime-manifest
worker: gateway
version: v1
---
# API Gateway — Canonical Runtime Manifest

## Entry point and framework
Cloudflare Worker entrypoint `src/index.ts`; Hono application created by `src/app.ts`/bootstrap factory. No NestJS runtime.

## Middleware inventory
Error boundary; request ID; correlation; trace context; request timestamp/deadline; internal-header stripping; host/path/method normalization; access-log context; security headers; CORS/preflight; body/header/URL/content-type limits; route resolution; authentication prevalidation; WAF/bot context; edge rate limiting; concurrency/overload control; upstream policy; proxy/stream execution; response/cache policy; completion telemetry.

## Gateway-owned routes
- `GET /_gateway/health`
- `GET /_gateway/version`
- catch-all proxy route for Registry-declared application APIs
- explicit WebSocket/SSE/streaming handling as route metadata requires

There is no public generic admin endpoint and no arbitrary forward-proxy route.

## Routing dependencies
Application Registry; in-memory/edge safe route snapshot cache; Worker Service Bindings; authenticated HTTPS origins. Route manifests declare host/application/environment, method/path template, upstream target, auth mode, timeout/retry/cache/rate/body/content/streaming policies and route version.

## Security components
JWT/JWKS prevalidator, origin authentication, internal-context signer/verifier contract, header allow/deny policy, CORS policy, request-smuggling normalization, rate limiter, WAF/bot decision adapter, SSRF/open-proxy prevention and sensitive data redaction.

## Traffic/cache components
Per-route limiter, global emergency limiter, concurrency gate, overload response policy, immutable/explicit response cache, Registry/JWKS metadata cache, cache-key builder, cache invalidation/version rules.

## Realtime/file components
WebSocket proxy/upgrade handler, SSE/body streaming proxy, stream timeout/idle/backpressure logic, upload size/type/direct-upload handoff, download/range/signed-reference transport policy.

## Observability components
Structured edge access logger, error/security logger, W3C tracing, upstream spans, bounded-cardinality metrics, SLO calculations/alerts/dashboards and build/manifest metadata.

## Configuration/bindings
Environment/build/version; Registry binding; service bindings; KV/Cache APIs where selected; JWT/JWKS settings; origin-auth secret; route timeout/retry policy maps; rate/CORS/cache/security policy maps; request limits; realtime/file limits; telemetry bindings/secrets.

## Zero-hidden-runtime rule
No route not present in Registry or Gateway utility inventory; no arbitrary upstream; no business database; no direct business queue/consumer; no final IAM decision; no unregistered middleware bypass; no provider credential; no background cron except bounded Gateway metadata/control-plane refresh if required by Worker-native scheduling and explicitly registered.