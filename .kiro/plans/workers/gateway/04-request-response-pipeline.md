# Request and Response Pipeline

## Ingress order

```text
Cloudflare edge/WAF
 -> request ID
 -> correlation/trace extraction
 -> deadline
 -> host normalization
 -> security headers
 -> CORS
 -> request limits
 -> rate limit
 -> Registry route resolution
 -> authentication prevalidation
 -> trusted context construction
 -> upstream selection
 -> proxy
```

## Egress order

```text
upstream response
 -> remove internal headers
 -> normalize safe gateway errors
 -> security headers
 -> CORS
 -> correlation/request/trace headers
 -> access telemetry
 -> client
```

## Context headers

The Gateway propagates canonical request/correlation/trace identifiers and authenticated service context using a platform-controlled namespace. Client attempts to forge trusted internal context are overwritten, not accepted.

## Body handling

Streaming requests remain streaming where the route permits. JSON validation belongs to the owning service; the Gateway only enforces transport-level content type and size constraints unless a route explicitly declares an edge schema.

## Error handling

Gateway errors use stable error codes for routing, authentication prevalidation, throttling, timeout, unavailable upstream, malformed transport input, and registry failure. Service-owned domain errors remain service-owned.

## Direct service ingress

Services must remain safe when called internally without the Gateway. They validate context, authenticate, authorize, validate DTOs, enforce tenant boundaries and apply domain error handling themselves.
