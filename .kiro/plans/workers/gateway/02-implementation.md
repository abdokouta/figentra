# API Gateway — Implementation Contract

## Runtime

Cloudflare Workers runtime with Hono. No NestJS runtime, ORM, PostgreSQL business database, domain services, or long-lived process state.

## Source tree

```text
workers/gateway/
├── src/index.ts
├── src/bootstrap/{app,bindings,environment}
├── src/routes/{health,proxy,webhooks}
├── src/routing/{host,application,service,route,matcher}
├── src/context/{request,correlation,trace,tenant,principal}
├── src/security/{authentication,headers,cors,ratelimit,origin,webhook}
├── src/upstream/{bindings,http,timeout,retry,circuit-breaker,errors}
├── src/cache/{metadata,response}
├── src/observability/{access-log,metrics,tracing}
├── src/errors/{gateway-error,error-mapper}
├── src/validation/{request,route-manifest}
└── src/types/{env,context,registry,transport}
```

## Handler construction

`index.ts` creates one Hono application, registers deterministic middleware in documented order, registers only gateway-owned endpoints, and delegates protected traffic to the proxy pipeline. Middleware must be pure with respect to request state except for explicit Hono context values.

## Required middleware

1. request ID extraction/generation;
2. correlation ID extraction/generation;
3. trace context extraction;
4. request timestamp/deadline;
5. method/path/host normalization;
6. security headers;
7. CORS policy;
8. body-size/content-type enforcement;
9. edge rate limit;
10. route resolution;
11. authentication prevalidation for protected routes;
12. tenant/application binding validation;
13. upstream selection;
14. upstream request construction;
15. response normalization and security headers;
16. access/error telemetry.

The implementation must never create a second business authorization system.

## Route proxy

A route manifest resolves an immutable upstream target class. Dynamic arbitrary URLs are forbidden. Service Binding is preferred for Worker targets; authenticated HTTPS is used for container services. Only methods and paths declared by Registry metadata are forwarded.

## Request context

Gateway context contains requestId, correlationId, traceId, receivedAt, deadline, route identity, application identity, environment, authenticated principal summary and trusted tenant context when available. Sensitive claims are not copied wholesale into headers.

## Response handling

Preserve successful status and body semantics. Normalize gateway-owned failures to the Figentra error envelope. Never rewrite service business errors into generic 500 responses when a safe service status is available. Strip internal origin headers and prevent accidental credential reflection.

## Resource limits

Explicit maximum URL length, header bytes, body bytes, execution deadline, upstream response size where applicable, and streaming policy are configuration-backed and enforced before expensive work.

## Idempotency

Gateway may propagate an `Idempotency-Key`; it does not own business idempotency storage. Retries are permitted only for methods/routes explicitly marked retry-safe by route metadata.

## Webhooks

Webhook ingress is route-specific. Gateway performs transport validation and signature/header preservation only where the gateway owns the provider contract; business verification remains with the owning service. Raw body bytes must remain intact for signature verification.
