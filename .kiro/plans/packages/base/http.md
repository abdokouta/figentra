---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/http"
anchor_adrs: [ADR-0090, ADR-0091, ADR-0092]
depends_on: ["@stackra/container", "@stackra/contracts", "@stackra/support", "@stackra/logger", "@stackra/events", "@stackra/cache"]
---
# `@stackra/http` — implementation plan

## Purpose
`@stackra/http` is the canonical HTTP client boundary. It provides named connections, typed requests/responses, middleware/interceptors, retries, circuit breaking, rate limiting, caching, streaming, uploads and runtime adapters. Controllers and server routing remain service-owned.

## Non-goals
Full HTTP server ownership, WebSocket transport, gRPC, business authorization or provider SDK leakage into domain code.

## Manager pattern
`HttpManager extends MultipleInstanceManager<IHttpClient>` because one application may need multiple named connections with independent base URLs, drivers and policies.

```ts
HttpModule.forRoot({
  default: "api",
  connections: {
    api: { driver:"fetch", baseURL:"https://api.example.com", timeout:10_000, retries:3 },
    billing: { driver:"axios", baseURL:"https://billing.example.com", timeout:15_000,
      rateLimit:{requestsPerSecond:10}, circuitBreaker:{failureThreshold:5,resetTimeoutMs:30_000} }
  }
});
```

## Public API — locked
```ts
interface IHttpClient {
  request<T>(config:IHttpRequest):Promise<IHttpResponse<T>>;
  get<T>(url:string, options?:IHttpRequestOptions):Promise<IHttpResponse<T>>;
  post<T>(url:string,data?:unknown,options?:IHttpRequestOptions):Promise<IHttpResponse<T>>;
  put<T>(url:string,data?:unknown,options?:IHttpRequestOptions):Promise<IHttpResponse<T>>;
  patch<T>(url:string,data?:unknown,options?:IHttpRequestOptions):Promise<IHttpResponse<T>>;
  delete<T>(url:string,options?:IHttpRequestOptions):Promise<IHttpResponse<T>>;
  stream(url:string,options?:IHttpRequestOptions):AsyncIterable<Uint8Array>;
  streamJson<T>(url:string,options?:IHttpRequestOptions):AsyncIterable<T>;
  streamSse<T>(url:string,options?:IHttpRequestOptions):AsyncIterable<ISseEvent<T>>;
  upload(url:string,file:Blob|ReadableStream,options?:IUploadOptions):Promise<IHttpResponse>;
}
interface IHttpConnector { request<T>(request:IHttpRequest):Promise<IHttpResponse<T>>; health():Promise<ConnectorHealth>; close():Promise<void>; }
interface IHttpMiddleware { before(request:IHttpRequest,ctx:IHttpContext):Promise<IHttpRequest>; }
interface IHttpInterceptor { after<T>(response:IHttpResponse<T>,ctx:IHttpContext):Promise<IHttpResponse<T>>; }
```

Contracts include `IHttpClient`, `IHttpManager`, `IHttpRequest`, `IHttpResponse<T>`, `IHttpConnector`, `IHttpMiddleware`, `IHttpInterceptor`, `HttpMethod`, `HTTP_MANAGER`, `HTTP_CLIENT`, `HTTP_CONFIG`, `HttpError`, `TimeoutError`, `CircuitBreakerOpenError`.

## Source tree
```text
packages/http/
├── src/
│   ├── core/
│   │   ├── http.module.ts
│   │   ├── connectors/{fetch.connector.ts}
│   │   ├── constants/
│   │   ├── decorators/{http-client.decorator.ts,use-interceptor.decorator.ts,use-middleware.decorator.ts}
│   │   ├── errors/{http.error.ts,timeout.error.ts,circuit-breaker-open.error.ts}
│   │   ├── interceptors/{retry,cache,logging,metrics,error-normalizer,transform,locale-filter}/
│   │   ├── middleware/{auth,locale-header,telemetry,idempotency}/
│   │   ├── parsers/{json,ndjson,sse,binary}
│   │   ├── registries/{connector.registry.ts,middleware.registry.ts}
│   │   ├── services/{http.manager.ts,http.client.ts,circuit-breaker.ts,rate-limiter.ts}
│   │   └── index.ts
│   ├── axios/{axios.connector.ts,index.ts}
│   ├── fetch/index.ts
│   ├── rxjs/index.ts
│   ├── actions/index.ts
│   ├── nestjs/{http.module.ts,interceptors/,health/,index.ts}
│   ├── react/{providers/,hooks/,index.ts}
│   ├── native/{providers/,hooks/,index.ts}
│   ├── worker/{http.module.ts,index.ts}
│   ├── config/index.ts
│   └── testing/{mock-http-client.ts,mock-http-manager.ts,http-recorder.ts,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Production connectors
- `fetch` — canonical low-dependency connector for Worker/browser/native environments and Node where web fetch semantics are preferred.
- `axios` — explicit optional Node/browser connector for richer interceptors and stream compatibility.
- `worker-fetch` — Worker adapter using platform fetch and request lifecycle hints.

Connector selection is configuration-driven and observable. No fake/null production connector is permitted.

## Request pipeline
`request creation → validation → locale/header middleware → authentication/signature middleware → telemetry middleware → idempotency key → connector → interceptors → typed response/error`. Every request has connect/read/overall deadlines and an abort signal.

## Retry/circuit/rate-limit
Retries use exponential backoff + jitter and only occur for idempotent operations or when the caller explicitly supplies an idempotency key. Circuit breaker is per connection: `closed → open → half-open`. Rate limiter uses a bounded token bucket. Limits are configuration-validated and emit diagnostic events through `@stackra/events`.

## Streaming/uploads
Support JSON, text, binary, NDJSON and SSE as `AsyncIterable`. Uploads support multipart/streaming with bounded progress callbacks. Response and upload body sizes are limited. Abort cancels underlying streams.

## Cache integration
Optional cache interceptor honors HTTP freshness/ETag semantics and uses `@stackra/cache`. Cache misses/outages never fail correctness. Authorization-bearing responses are never cached unless the connection explicitly declares a safe cache policy.

## Locale integration
Request middleware may attach `Accept-Language`/workspace locale headers. A response locale-filter may collapse locale maps only when explicitly enabled and validated against `@stackra/i18n` locale metadata.

## NestJS/runtime integration
NestJS-specific registration, health indicators and DI integration live under `./nestjs`. React/native providers and hooks live in explicit subpaths. Worker integration creates clients bound to fetch lifecycle and does not depend on Node globals.

## Security
TLS validation is mandatory. Headers such as Authorization/Cookie/Api-Key are redacted from logs. SSRF/egress restrictions apply to server-side dynamic URLs. Redirect count, response size, request size and decompression limits are enforced. URL construction rejects unsafe schemes. Sensitive query parameters are redacted in telemetry.

## Errors
Typed transport errors include status, retryability, request ID and safe upstream code/message. `TimeoutError`, `NetworkError`, `HttpError`, `CircuitBreakerOpenError`, `RateLimitError`, `ResponseParseError`, `BodyLimitExceededError` are stable categories. Upstream bodies are never copied wholesale into errors.

## Configuration
Each connection defines base URL, connector, timeout/deadlines, retry budget, rate limits, circuit policy, headers policy, cache policy, streaming/body limits and optional auth middleware. Required production connections fail startup if misconfigured.

## Observability
Metrics: request rate, latency histogram, status counts, timeout/retry count, circuit state, rate-limit rejection, bytes in/out and connector failures. OTel spans propagate trace context across outbound requests. Telemetry is non-fatal and redacted.

## Testing
Unit tests cover URL/header merging, retry classification, backoff, circuit transitions, rate limiting, parsing, cache behavior and redaction. Integration tests use real fetch and Axios adapters. Conformance fixtures run every enabled connector against the same protocol suite. Streaming, upload cancellation, malformed response and timeout tests are mandatory.

## Implementation phases
1. Port/normalize core connectors and contracts.
2. Manager/connection configuration and registration.
3. Middleware/interceptor engine.
4. Retry/circuit/rate limiting and observability.
5. Streaming/upload/cache/locale features.
6. NestJS/React/native/Worker subpaths and testing harness.
7. Production security/load/failure verification and release.

## Exit criteria
- Named multi-connection manager is production-ready.
- Every connector passes the same conformance suite.
- Retries, circuit breaking and rate limiting have deterministic limits.
- Streaming/uploads support cancellation and body limits.
- No provider SDK types escape adapter boundaries.
- All runtime subpaths build independently and no service implements a duplicate HTTP client policy.
