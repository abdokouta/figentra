---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://exceptions-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/exceptions` — base exception classes

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md)
**Reference:** `.ref/packages/excptions/` (typo — `@nesvel/exceptions` v1.0.0)
**Depends on:** ZERO runtime deps **Design effort:** 5 days across 4 phases

## Purpose

Single source of truth for every base exception class the workspace uses. Ships:

- `BaseException` — the workspace-canonical error root (adds `context` +
  `code` + `.toJSON()`).
- `HttpException` — HTTP-aware error w/ `statusCode` + `body` + `headers`.
- Concrete HTTP exception subclasses (`BadRequest`, `Unauthorized`, `Forbidden`,
  `NotFound`, `Conflict`, `UnprocessableEntity`, `InternalServer`,
  `ServiceUnavailable`, ...).
- Every workspace-package exception extends `BaseException`; every HTTP-facing
  package extends `HttpException`.

Distinct from NestJS `HttpException` — this one is cross-runtime (works in
Worker + browser without pulling `@nestjs/common`). NestJS interop lives in the
`@stackra/nest-service` composite via a `NestHttpExceptionAdapter`.

## Non-goals

- NestJS-coupled exception filter — that's a Nest concern; ships in
  `@stackra/nest-service`.
- Cloudflare Worker Response-wrapping — that's `@stackra/response`.
- Zod / class-validator integration — those emit their own errors; the
  workspace's error-handling middleware wraps them into `HttpException`.

## Public API — locked

Every symbol at the root barrel.

### `BaseException extends Error`

```typescript
class BaseException extends Error {
  readonly code: string;
  readonly context: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(opts: {
    message: string;
    code?: string;
    context?: Record<string, unknown>;
    cause?: unknown;
  });

  toJSON(): {
    name: string;
    message: string;
    code: string;
    context: Record<string, unknown>;
    stack?: string;
  };
}
```

### `HttpException extends BaseException`

```typescript
class HttpException extends BaseException {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body?: unknown; // custom response body override

  constructor(opts: {
    message: string;
    statusCode: number;
    code?: string;
    context?: Record<string, unknown>;
    headers?: Record<string, string>;
    body?: unknown;
    cause?: unknown;
  });
}
```

### Concrete HTTP subclasses

```typescript
class BadRequest extends HttpException {} // 400
class Unauthorized extends HttpException {} // 401
class PaymentRequired extends HttpException {} // 402
class Forbidden extends HttpException {} // 403
class NotFound extends HttpException {} // 404
class MethodNotAllowed extends HttpException {} // 405
class Conflict extends HttpException {} // 409
class Gone extends HttpException {} // 410
class PayloadTooLarge extends HttpException {} // 413
class UnsupportedMedia extends HttpException {} // 415
class UnprocessableEntity extends HttpException {} // 422
class TooManyRequests extends HttpException {} // 429

class InternalServerError extends HttpException {} // 500
class NotImplemented extends HttpException {} // 501
class BadGateway extends HttpException {} // 502
class ServiceUnavailable extends HttpException {} // 503
class GatewayTimeout extends HttpException {} // 504
```

Each subclass hard-codes its `statusCode` + provides a default `code`:

```typescript
class NotFound extends HttpException {
  constructor(opts: { message?: string; code?: string; ...}) {
    super({
      statusCode: 404,
      code: opts.code ?? "NOT_FOUND",
      message: opts.message ?? "Resource not found",
      ...opts,
    });
  }
}
```

### `isException(err)` type-guard

```typescript
function isException<T extends BaseException>(
  err: unknown,
  ctor?: Constructor<T>,
): err is T;
```

Cross-realm safe (uses `Symbol.for("@stackra/exception-marker")` — no
`instanceof` failures across module boundaries).

## Subpath layout

```
packages/exceptions/
├── package.json                          # single "." export
├── src/
│   ├── index.ts
│   ├── base.exception.ts
│   ├── http.exception.ts
│   ├── http/
│   │   ├── bad-request.exception.ts
│   │   ├── unauthorized.exception.ts
│   │   ├── ... (16 concrete)
│   │   └── index.ts
│   ├── utils/
│   │   ├── is-exception.util.ts
│   │   ├── exception-marker.const.ts
│   │   └── serialize-error.util.ts
│   └── constants/
│       └── error-codes.const.ts          # canonical machine codes
└── __tests__/
    └── unit/
        ├── base-exception.test.ts
        ├── http-exception.test.ts
        └── is-exception.test.ts
```

## Machine error codes

The `code` field is the STABLE machine-readable identifier — HTTP status is
transport-level. Every subclass sets a default (`NOT_FOUND`, `UNAUTHORIZED`).
Consumer packages extend the code namespace:

- `AUTH_INVALID_TOKEN` — auth package.
- `RATE_LIMITED` — rate-limit package.
- `WEBHOOK_DELIVERY_FAILED` — webhook package.

Never re-use codes across packages; namespace by concern (`AUTH_*`, `WEBHOOK_*`,
`PAYMENT_*`).

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton.
- [ ] Zero-dep verification.

### Phase 2 — Core classes (2 days)

- [ ] `BaseException` w/ `.toJSON()` + `.context` + marker symbol.
- [ ] `HttpException` w/ statusCode + headers + body override.
- [ ] 16 concrete HTTP subclasses.

### Phase 3 — Utils (1 day)

- [ ] `isException()` cross-realm type-guard.
- [ ] `serializeError()` — safe error-to-JSON for logging.

### Phase 4 — Testing + docs (1 day)

- [ ] Unit tests for every class (17 files).
- [ ] README documents every subclass w/ example.
- [ ] Cross-refs to consumer packages (auth, rate-limit, webhook, ...).

## Exit criteria

- [ ] Every HTTP status class carries the correct `statusCode`.
- [ ] `.toJSON()` produces a stable shape (documented).
- [ ] `isException()` works cross-module (verified in test).
- [ ] Zero runtime deps.
- [ ] 95% branch coverage.

## Cross-refs

- `.ref/packages/excptions/` — reference (note the typo — package renames to
  `@stackra/exceptions` on ship).
- `@stackra/response` — HTTP envelope that wraps caught exceptions.
- `@stackra/nest-service` — Nest interop layer (exception filter that reads
  `HttpException` and shapes the response).
