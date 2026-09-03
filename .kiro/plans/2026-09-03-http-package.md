---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/http — architecture plan

**Status:** Planned (major refactor of `.ref/packages/http` v3.0.0) **Anchor
ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/http/` — already at v3.0.0 with 6 subpaths. **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger`, `@stackra/events` (for `http.*` events)

## Purpose

`@stackra/http` is the workspace's canonical HTTP client. Consumers type against
`IHttpClient` from `@stackra/contracts`; the runtime picks the connector per
named connection:

- **Node / NestJS** — Axios (feature-rich, streaming, interceptors) OR fetch
  (Node 24 native).
- **Cloudflare Worker** — native `fetch` (Worker platform).
- **Browser** — native `fetch` (via connector).
- **React Native** — RN `fetch` polyfill (via connector).

Enterprise-grade features required day one — the reference package ALREADY ships
these; this plan LOCKS them:

- **N named connections** via `MultipleInstanceManager` per ADR-0090.
- **Middleware pipeline** — before-request modifier chain.
- **Interceptor pipeline** — after-response modifier chain (retry, cache,
  logging, metrics, transform, locale-filter, error-normaliser).
- **Circuit breaker** — per-connection, closes on N consecutive failures.
- **Rate limiting** — per-connection token-bucket.
- **Retry with backoff** — exponential + jitter.
- **Streaming** — SSE, NDJSON, JSON, text, binary.
- **File uploads** — multipart with progress events.
- **Deduplication** — pending requests to the same URL de-duplicate.
- **Metrics** — histogram of latency; counter of status codes.
- **Cache middleware** — HTTP-caching-aware, ETag support, backed by
  `@stackra/cache`.
- **Locale filter** — inline-per-locale response bodies (per
  `.kiro/steering/frontend-localization.md`).
- **RxJS bridge** — separate subpath for consumers that prefer Observable- based
  streams.
- **Typed clients** —
  `HttpModule.forFeature({ typed: [{ tag: 'users', client: UsersHttpClient }] })`
  generates a typed API SDK from an OpenAPI spec (opt-in — Phase 5).

## Non-goals

- Full HTTP server (that's `@nestjs/platform-fastify` / `@stackra/gateway`).
- WebSocket client (that's `@stackra/realtime`).
- Full gRPC (that's `@nestjs/microservices`).

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

`HttpManager extends MultipleInstanceManager<IHttpClient>` — each named
connection is its own instance with its own driver + config.

```typescript
HttpModule.forRoot({
  default: "api",
  connections: {
    api: {
      driver: "axios",
      baseURL: "https://api.example.com",
      timeout: 10_000,
      retries: 3,
    },
    auth: {
      driver: "fetch",
      baseURL: "https://auth.example.com",
      timeout: 5_000,
    },
    billing: {
      driver: "axios",
      baseURL: "https://billing.example.com",
      timeout: 15_000,
      rateLimit: { requestsPerSecond: 10 },
      circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
    },
  },
});
```

## Subpath layout (per ADR-0091)

Existing `.ref/packages/http/` already ships 6 subpaths (`.`, `/react`,
`/fetch`, `/rxjs`, `/testing`, `/actions`, `/config`). We extend:

```
packages/http/
├── src/
│   ├── core/
│   │   ├── http.module.ts
│   │   ├── connectors/                # axios, fetch (from .ref)
│   │   ├── constants/
│   │   ├── decorators/                # @UseInterceptor, @UseMiddleware, @HttpClient
│   │   ├── errors/                    # HttpError, TimeoutError, CircuitBreakerOpenError
│   │   ├── fetch.ts                   # tree-shakeable fetch API for common cases
│   │   ├── integrations/              # cross-package integrations (locale, cache)
│   │   ├── interceptors/              # cache, error-normaliser, locale-filter, logging, metrics, retry, transform (all from .ref)
│   │   ├── interfaces/
│   │   ├── middleware/                # LocaleHeaderMiddleware, AuthMiddleware, TelemetryMiddleware
│   │   ├── parsers/                   # SSE, NDJSON, JSON, binary parsers for streaming
│   │   ├── registries/                # ConnectorRegistry, MiddlewareRegistry
│   │   ├── rxjs.ts                    # RxJS bridge for streaming
│   │   ├── services/                  # HttpManager, HttpClient, CircuitBreaker, RateLimiter
│   │   ├── utils/                     # URL builder, header merger, retry policy
│   │   └── index.ts
│   │
│   ├── axios/                         # (existing/new — Axios connector separated for optional peer)
│   │   ├── axios.connector.ts
│   │   ├── serializers/
│   │   └── index.ts
│   │
│   ├── fetch/                         # (from .ref) — fetch API subpath
│   │   └── index.ts
│   │
│   ├── rxjs/                          # (from .ref) — RxJS Observable wrappers
│   │   └── index.ts
│   │
│   ├── actions/                       # (from .ref) — server actions helpers
│   │   └── index.ts
│   │
│   ├── nestjs/                        # NEW — pull NestJS-specific interceptors out of core
│   │   ├── http.module.ts             # thin wrapper adding NestJS discovery for @HttpClient injections
│   │   ├── interceptors/
│   │   ├── health/
│   │   │   └── http.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # <HttpClientProvider>
│   │   ├── hooks/                     # useHttpClient, useHttpRequest, useHttpStream
│   │   └── index.ts
│   │
│   ├── native/
│   │   ├── providers/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── http.module.ts             # per-request client tied to fetch handler
│   │   └── index.ts
│   │
│   ├── config/                        # (from .ref) — config helper subpath
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-http-client.ts
│       ├── mock-http-manager.ts
│       ├── http-recorder.ts            # captures every request for assertions
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                    | Kind                       |
| ------------------------- | -------------------------- |
| `IHttpClient`             | interface                  |
| `IHttpManager`            | interface                  |
| `IHttpRequest`            | interface                  |
| `IHttpResponse<T>`        | interface                  |
| `IHttpConnector`          | interface                  |
| `IHttpMiddleware`         | interface                  |
| `IHttpInterceptor`        | interface                  |
| `HttpMethod` enum         | enum                       |
| `HTTP_MANAGER`            | token                      |
| `HTTP_CLIENT`             | token (default connection) |
| `HTTP_CONFIG`             | token                      |
| `HttpError`               | class                      |
| `TimeoutError`            | class                      |
| `CircuitBreakerOpenError` | class                      |

## Core API (locked from .ref)

```typescript
interface IHttpClient {
  request<T>(config: IHttpRequest): Promise<IHttpResponse<T>>;
  get<T>(url: string, options?: IHttpRequestOptions): Promise<IHttpResponse<T>>;
  post<T>(
    url: string,
    data?: unknown,
    options?: IHttpRequestOptions,
  ): Promise<IHttpResponse<T>>;
  put<T>(
    url: string,
    data?: unknown,
    options?: IHttpRequestOptions,
  ): Promise<IHttpResponse<T>>;
  patch<T>(
    url: string,
    data?: unknown,
    options?: IHttpRequestOptions,
  ): Promise<IHttpResponse<T>>;
  delete<T>(
    url: string,
    options?: IHttpRequestOptions,
  ): Promise<IHttpResponse<T>>;

  // Streaming
  stream(url: string, options?: IHttpRequestOptions): AsyncIterable<Uint8Array>;
  streamJson<T>(url: string, options?: IHttpRequestOptions): AsyncIterable<T>;
  streamSse<T>(
    url: string,
    options?: IHttpRequestOptions,
  ): AsyncIterable<ISseEvent<T>>;

  // Uploads
  upload(
    url: string,
    file: Blob | ReadableStream,
    options?: IUploadOptions,
  ): Promise<IHttpResponse>;
}
```

## Connectors

| Connector      | Home                                          | Runtime        | Deps                              |
| -------------- | --------------------------------------------- | -------------- | --------------------------------- |
| `axios`        | `axios/axios.connector.ts`                    | Node + Browser | `axios` (optional peer)           |
| `fetch`        | `core/connectors/fetch.connector.ts`          | Every runtime  | Native `fetch`                    |
| `worker-fetch` | `worker/connectors/worker-fetch.connector.ts` | Cloudflare     | Native `fetch` + Cloudflare hints |

Axios is the enterprise default (feature-rich); fetch is the Worker/browser
default (no bundle cost). Runtime selects per connection config.

## Middleware pipeline

Runs BEFORE request send:

- `LocaleHeaderMiddleware` — stamps `X-Language` + `Accept-Language` from
  `I18N_LOCALE_SERVICE`.
- `AuthMiddleware` — attaches Bearer / API key / signed request.
- `TelemetryMiddleware` — captures OpenTelemetry span + baggage.
- `IdempotencyKeyMiddleware` — auto-adds `Idempotency-Key` header on POSTs.
- Custom app-level middleware.

## Interceptor pipeline (from .ref)

Runs AFTER response received, in configured order:

- `retry.interceptor.ts` — exponential backoff on 5xx / network errors.
- `cache.interceptor.ts` — HTTP-caching-aware, ETag, backed by `@stackra/cache`.
- `logging.interceptor.ts` — request/response log lines w/ redaction.
- `metrics.interceptor.ts` — histogram + counters.
- `error-normalizer.interceptor.ts` — 4xx/5xx → typed `HttpError` subclasses.
- `transform.interceptor.ts` — response body transformation (camelCase, DTO
  mapping).
- `locale-filter.interceptor.ts` — walks response body, filters inline-locale
  fields to the active locale.

Each interceptor is a class implementing `IHttpInterceptor`; ordered by config
array, per-connection scope.

## Circuit breaker + rate limiter

Per-connection state kept in `HttpClient`:

- `CircuitBreaker` — `closed` → `open` on N consecutive failures → `half-open`
  after `resetTimeoutMs` → back to `closed` on success.
- `RateLimiter` — token bucket (`requestsPerSecond`, `burst`).

Both emit events on `@stackra/events`:

- `http.circuit-breaker.opened`, `.half-opened`, `.closed`
- `http.rate-limit.exceeded`

## Locale filter (from .ref README)

Backends that inline every locale per string leaf
(`{ en: "…", ar: "…", ru: "…" }`) opt in per connection:

```typescript
HttpModule.forRoot({
  default: "api",
  connections: {
    api: { baseURL: "…", filterLocale: true },
  },
});
```

Two middleware/interceptors auto-registered:

1. `LocaleHeaderMiddleware` (request-side) — stamps active locale.
2. `LocaleFilterResponseInterceptor` (response-side) — walks parsed body,
   replaces every "locale map" (an object whose keys are a subset of supported
   locales) with just the active locale's value.

## Feature registration

Per `.ref` — `forFeature` register additional drivers, connections, middleware,
or interceptors:

```typescript
HttpModule.forFeature({
  driver: "fetch",
  connector: FetchConnector,
});

HttpModule.forFeature({
  connections: {
    billing: { baseURL: "https://billing.example.com" },
  },
  middleware: [{ use: AuditMiddleware, connection: "billing" }],
  interceptors: [{ use: TraceInterceptor, connection: ["api", "billing"] }],
});
```

Feature registration goes through `OnApplicationBootstrap` lifecycle hook
resolved via `ModuleRef` (per ADR-0092 pattern).

## Streaming semantics

`stream()`, `streamJson()`, `streamSse()` return AsyncIterable per web spec.
Bridged to RxJS Observables via the `/rxjs` subpath.

Cloudflare Workers stream via `ReadableStream` — fully supported. Node uses
`Readable` streams underneath (Axios) or web streams (fetch).

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@stackra/cache": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "axios": "^1.7.0",
    "rxjs": "^7.8.0",
  },
  "peerDependenciesMeta": {
    "@stackra/cache": { "optional": true },
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "axios": { "optional": true },
    "rxjs": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Port `.ref/packages/http` to workspace (3 days)

- [ ] Copy `src/core/` — connectors, interceptors, middleware, parsers,
      registries, services.
- [ ] Copy `src/fetch.ts`, `src/rxjs.ts`, `src/actions/`, `src/react/`.
- [ ] Split Nest-specific bits out of `core/` into new `src/nestjs/`.
- [ ] Update to ADR-0091 layout (10 subpaths).

### Phase 2 — Contracts split (1 day)

### Phase 3 — Manager alignment (2 days)

- [ ] Refactor `HttpManager` to extend `MultipleInstanceManager<IHttpClient>`
      from `@stackra/support`.
- [ ] Verify `forFeature` uses `@Injectable()` registrar class per ADR-0052.

### Phase 4 — Add missing runtime subpaths (2 days)

- [ ] `src/worker/` — Worker-scoped client.
- [ ] `src/native/` — RN fetch polyfill helper.

### Phase 5 — Typed clients (opt-in, 3 days)

- [ ] OpenAPI-spec-driven codegen for `HttpModule.forFeature({ typed: [...] })`.
- [ ] CLI: `http:codegen --openapi ./openapi.yaml --output ./src/http-clients/`.

### Phase 6 — Testing (1 day)

- [ ] `MockHttpClient` w/ `.assertRequestedWith()`, `.mockResponse()`.
- [ ] `HttpRecorder` — records every request for assertions.

### Phase 7 — Docs + Release (2 days)

**Total effort:** 14 days.

## Success criteria

- [ ] 10 subpath exports build cleanly.
- [ ] Axios + fetch connectors both handle GET/POST/PUT/DELETE + streaming.
- [ ] Circuit breaker opens on 5 consecutive 5xx, closes after 30s.
- [ ] Rate limiter caps 10 rps in a burst test.
- [ ] SSE parser handles `data: ...\n\n` line-delimited events.
- [ ] Locale filter strips inline `{ en: "…", ar: "…" }` maps.
- [ ] Cache interceptor ETag round-trip works.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/steering/frontend-localization.md` — locale filter rationale.
- `.kiro/plans/2026-09-03-cache-package.md` — cache interceptor backing.
- `.kiro/plans/2026-09-03-events-package.md` — HTTP lifecycle events.
- `.ref/packages/http/` — reference package (already v3.0.0).
