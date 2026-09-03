---
status: canonical
component: package
package: "@stackra/http"
---
# `@stackra/http` — implementation plan

Provider-neutral HTTP client/server boundary primitives for timeouts, cancellation, headers, serialization, retries and typed responses. NestJS controllers remain service-owned.

## API
`HttpClient`, `HttpRequest`, `HttpResponse`, interceptors, timeout/cancellation policy, retry policy, request context and transport errors. Node/Fastify adapters are explicit.

## Reliability/security
Connect/read/overall deadlines, bounded retries only for idempotent operations, redirect/size limits, TLS policy, SSRF/egress controls and header redaction. Correlation/trace propagation is integrated with observability.

## Testing
Adapter conformance, timeout/cancel, retries, malformed responses, connection failures, redirect/size limits and trace propagation.

## Exit criteria
All outbound HTTP integration uses the canonical client policy; no provider SDK leaks into business modules.
