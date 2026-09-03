---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://response-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/response` — HTTP response envelope + interceptors

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/response/` **Depends on:** `@stackra/contracts`,
`@stackra/exceptions`, `@stackra/pagination`, `@stackra/support` **Design
effort:** 8 days across 5 phases

## Purpose

The workspace-canonical HTTP response envelope + the Nest interceptor that
shapes every controller return value into it. Also provides a
`@stackra/response/worker` subpath for Cloudflare Workers.

**Canonical envelope shape:**

```jsonc
// Success — resource
{
  "data": { ... },
  "meta": { "request_id": "req_...", "duration_ms": 42 },
  "links": { "self": "/api/v1/users/1" }
}

// Success — list
{
  "data": [ ... ],
  "meta": { "current_page": 1, "per_page": 15, "total": 47, "last_page": 4, "from": 1, "to": 15, "request_id": "req_..." },
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}

// Success — mutation
{
  "data": { ... },
  "message": "User created successfully",
  "meta": { "request_id": "req_..." }
}

// Error — 4xx / 5xx
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with id 42 not found",
    "details": { ... },      // optional
    "trace_id": "..."         // optional — links to observability
  },
  "meta": { "request_id": "req_..." }
}

// Validation error — 422
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The given data was invalid",
    "details": {
      "email": ["The email is required", "The email must be a valid email"],
      "password": ["The password must be at least 8 characters"]
    }
  },
  "meta": { "request_id": "req_..." }
}
```

## Non-goals

- Content negotiation (`Accept: application/json` vs `text/html`) — Nest +
  Fastify's default negotiator handles it; this package assumes JSON.
- Compression — `@stackra/http` client-side + gateway-level handles it.
- Streaming responses — the envelope doesn't wrap streams; consumers return raw
  `ReadableStream` for SSE / file downloads.

## Public API — locked

### Envelope builders

```typescript
export function successResponse<T>(data: T, opts?: {
  message?: string;
  meta?: Record<string, unknown>;
  links?: Record<string, string | null>;
  headers?: Record<string, string>;
  statusCode?: number;  // defaults 200
}): IResponseEnvelope<T>;

export function paginatedResponse<T>(
  paginator: LengthAwarePaginator<T> | SimplePaginator<T> | CursorPaginator<T>,
  opts?: { meta?: Record<string, unknown>; headers?: ... }
): IResponseEnvelope<T[]>;

export function errorResponse(err: HttpException | Error, opts?: {
  requestId?: string;
  traceId?: string;
  hideStackInProduction?: boolean;  // default true
}): IErrorEnvelope;
```

### `ResponseInterceptor` (Nest)

Wraps every controller return value into `successResponse(...)` unless the value
is ALREADY an envelope. Registered globally via `APP_INTERCEPTOR`.

```typescript
@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
```

Reads the controller-return-value type from decorator metadata:

- `@Message("User created")` — sets `message` on the envelope.
- `@ResponseHeaders({ "X-Foo": "bar" })` — merges headers.
- `@ResponseStatus(201)` — overrides status.
- Return `Paginator` → auto-wraps via `paginatedResponse(...)`.

### `ExceptionFilter` (Nest)

Catches thrown exceptions + shapes into `errorResponse(...)`:

- `HttpException` → passes through w/ `statusCode`, `code`, `context`.
- `ZodError` / `ValidationError` → `422` w/ `details` populated.
- `Error` / any → `500` w/ `code: "INTERNAL_ERROR"` (message hidden in
  production).

Also emits `@stackra/observability` traces via optional peer.

### `@stackra/response/worker`

Cloudflare Worker equivalent:

```typescript
import { success, error, paginated } from "@stackra/response/worker";

export default {
  async fetch(req: Request): Promise<Response> {
    try {
      const user = await getUser(1);
      return success(user);
    } catch (e) {
      return error(e);
    }
  },
};
```

Returns native `Response` objects w/ correct headers + status.

## Subpath layout

```
packages/response/
├── package.json                          # 4 subpath exports
├── src/
│   ├── core/                             # ".": platform-agnostic
│   │   ├── envelope.builder.ts
│   │   ├── success-response.ts
│   │   ├── paginated-response.ts
│   │   ├── error-response.ts
│   │   ├── constants/
│   │   │   └── envelope-shape.const.ts
│   │   ├── decorators/
│   │   │   ├── message.decorator.ts
│   │   │   ├── response-headers.decorator.ts
│   │   │   └── response-status.decorator.ts
│   │   ├── interfaces/
│   │   │   ├── response-envelope.interface.ts
│   │   │   └── error-envelope.interface.ts
│   │   └── index.ts
│   ├── nest/                             # "./nest"
│   │   ├── response.interceptor.ts
│   │   ├── exception.filter.ts
│   │   ├── validation.pipe.ts            # Zod-based; envelope-shaped errors
│   │   ├── nest-response.module.ts
│   │   └── index.ts
│   ├── worker/                           # "./worker"
│   │   ├── success.ts
│   │   ├── error.ts
│   │   ├── paginated.ts
│   │   ├── worker-request-context.ts     # requestId propagation
│   │   └── index.ts
│   └── testing/                          # "./testing"
│       ├── assert-envelope.ts            # matcher helper
│       ├── mock-response.ts
│       └── index.ts
└── __tests__/
    └── unit/
        ├── success-response.test.ts
        ├── error-response.test.ts
        ├── paginated-response.test.ts
        ├── response-interceptor.test.ts
        └── exception-filter.test.ts
```

## Request-ID propagation

Every envelope carries `meta.request_id`. Sources:

- **Nest** — the interceptor reads `X-Request-Id` header OR generates
  `Str.ulid()`.
- **Worker** — the `worker-request-context` middleware injects
  `crypto.randomUUID()` into `request.headers`.
- Both propagate downstream via `X-Request-Id` on any subsequent HTTP call.

## Phases

### Phase 1 — Scaffold + envelope builders (2 days)

- [ ] Package skeleton.
- [ ] `successResponse`, `errorResponse`, `paginatedResponse`.
- [ ] Envelope shape locked + typed.

### Phase 2 — Nest interceptor + filter (3 days)

- [ ] `ResponseInterceptor` — auto-wraps controller returns.
- [ ] `ExceptionFilter` — catches every exception + shapes.
- [ ] `ValidationPipe` (Zod-backed) — 422 errors in the canonical shape.
- [ ] `@Message`, `@ResponseHeaders`, `@ResponseStatus` decorators.

### Phase 3 — Worker helpers (1 day)

- [ ] `success()`, `error()`, `paginated()` return native `Response`.
- [ ] Request-ID middleware.

### Phase 4 — Testing helpers (1 day)

- [ ] `assertEnvelope(response, matcher)` — Jest/Vitest matcher.
- [ ] `MockResponse` for unit tests.

### Phase 5 — Verification + docs (1 day)

- [ ] Nest integration test — controller returns → envelope.
- [ ] Worker integration test — handler returns → correct Response.
- [ ] Envelope shape verified across the workspace (contracts + approval + api
      services all consume identically).

## Exit criteria

- [ ] 4 subpath exports build cleanly.
- [ ] Nest interceptor wraps every unwrapped return value.
- [ ] Exception filter handles `HttpException`, `ZodError`, `Error`.
- [ ] Worker helpers return native `Response` w/ correct status + headers.
- [ ] `meta.request_id` present on every envelope.
- [ ] 90% branch coverage.

## Cross-refs

- `@stackra/exceptions` — the error class hierarchy the filter reads.
- `@stackra/pagination` — the paginator shapes the envelope embeds.
- `@stackra/observability` — trace ID propagation.
- `.kiro/steering/*` — envelope shape is the workspace CONTRACT; every service
  must return it.
