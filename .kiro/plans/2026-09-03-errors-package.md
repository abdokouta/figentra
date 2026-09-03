---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/errors` — enterprise error model and transport mapping

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0092, ADR-0018, ADR-0021  
**Reference:** `.ref/packages/exceptions/` and existing `2026-09-03-exceptions-package.md`  
**Depends on:** `@stackra/contracts`, `@stackra/support`  
**Design effort:** 12 days across 8 phases

## Purpose

`@stackra/errors` is the canonical cross-runtime error model. It owns machine-readable error codes, categories, severity, operational/programmer classification, safe metadata, causes, retryability, cancellation and serialization. It is the only package that defines the platform error envelope consumed by HTTP, NATS, queue, realtime and runtime adapters.

`@stackra/exceptions` remains a compatibility-oriented HTTP exception layer where required by the reference implementation. New platform code MUST use `@stackra/errors`; compatibility translation is explicit and one-way.

## Non-goals

- HTTP routing or response handling.
- Business-domain validation rules.
- Vendor exception classes.
- Logging sinks or telemetry exporters.
- Client-visible stack traces.

## Manager pattern

No Manager/driver pattern. Errors are immutable value objects and mappers. Runtime adapters compose the canonical model rather than subclassing it for each framework.

## Subpath layout

```text
packages/errors/
├── src/core/
│   ├── errors/                 # StackraError, ErrorCode, ErrorCategory
│   ├── envelopes/              # ErrorEnvelope, ErrorCause, ErrorContext
│   ├── policies/               # retryability, severity, exposure policy
│   ├── serialization/          # safe serialization + redaction
│   ├── mapping/                # vendor/framework -> StackraError
│   ├── constants/
│   └── index.ts
├── src/nestjs/                  # exception filter + Nest mapper
├── src/worker/                  # Response-safe Worker mapping
├── src/react/                   # ErrorBoundary helpers
├── src/native/                  # RN global error helpers
├── src/testing/                 # real error factories + assertions
└── __tests__/
```

## Contracts split

`@stackra/contracts/errors` owns `IStackraError`, `IErrorEnvelope`, `IErrorContext`, `ErrorCategory`, `ErrorSeverity`, `ErrorCode`, `ERROR_MAPPER`, and `ERROR_SERIALIZER`. Concrete classes remain in this package.

## Public API — locked

```ts
class StackraError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly operational: boolean;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly context: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
  toEnvelope(options?: { exposeDetails?: boolean }): IErrorEnvelope;
}

function normalizeError(error: unknown, context?: IErrorContext): StackraError;
function isStackraError(error: unknown): error is StackraError;
function serializeError(error: unknown, policy?: ErrorSerializationPolicy): IErrorEnvelope;
```

Error codes are stable, namespaced and never reused. Categories include `validation`, `authentication`, `authorization`, `not_found`, `conflict`, `rate_limit`, `timeout`, `dependency`, `database`, `network`, `configuration`, `programming`, `system`, and `unknown`.

## Runtime behavior

The core is runtime-neutral. Nest maps `StackraError` to HTTP responses without exposing internal context. Workers return a bounded JSON envelope. Browser/RN adapters feed Error Boundaries and global handlers. NATS/queue adapters serialize code/category/retryability/correlation identifiers and preserve the causal chain only for trusted internal consumers.

Cancellation and timeout errors are distinct from generic dependency failures. Retry decisions are policy-driven and MUST NOT be inferred from HTTP status alone.

## Configuration and validation

Expose only bounded policy configuration: default exposure, maximum cause depth, maximum metadata keys/bytes, redaction rules, status mapping and retry policy. Invalid configuration fails at bootstrap; no permissive fallback is allowed in production.

## Discovery / registry

No discovery is required for core errors. Runtime mappers MAY be discovered through the canonical `IDiscoveryService`, but the mapper registry owns registration/indexing and the error package never creates arbitrary providers.

## Security

All serialization passes through centralized redaction. Passwords, access/refresh tokens, cookies, authorization headers, API keys, private keys, database credentials and raw request bodies are never exposed. Context is size-bounded. Prototype-polluting keys are rejected. Stack traces are internal-only unless an explicit development policy permits them.

## Errors and recovery

Errors from unknown vendors normalize to `DEPENDENCY_FAILURE` or `UNKNOWN_ERROR`. Serialization itself is fail-safe: if metadata cannot be serialized, the envelope contains a bounded fallback marker and never throws over the original error. Error mapping is deterministic and idempotent.

## Observability

Every normalized error carries request/correlation/trace identifiers when available. Runtime adapters emit error counters partitioned by code/category and retryable state. Mapping failures are separately counted. No raw secrets or unrestricted payloads enter metrics labels.

## Enterprise / tenancy / isolation

Tenant and actor identifiers are context fields, not error-code dimensions. Tenant context MUST be redacted or omitted from client envelopes according to exposure policy. Cross-tenant error leakage is prohibited by integration tests.

## Persistence / compatibility

The error model is not persisted. Event, queue and API envelopes are versioned. `@stackra/exceptions` compatibility mapping is maintained only at explicit migration boundaries and MUST NOT become a second canonical model.

## Testing / conformance

Tests cover every category, status mapping, serialization boundary, redaction rule, cause chain, cross-realm detection, cancellation, timeout, retry policy, tenant isolation, malformed vendor errors and all runtime adapters. Contract tests assert stable JSON shapes.

## Dependencies / exports / versioning

Core exports only canonical error classes, factories, policies and serializers. `/nestjs`, `/worker`, `/react`, `/native`, `/testing` are optional subpaths. Runtime framework dependencies are optional peers and are never imported by core. Public changes require Changesets and follow semver.

## Phases

### Phase 1 — Contract lock (1 day)
- Add all contracts/tokens and machine-code registry.
- Define envelope and compatibility matrix.

### Phase 2 — Core model (2 days)
- Implement immutable `StackraError`, categories, severity and cause handling.

### Phase 3 — Serialization/security (2 days)
- Implement bounded serialization, redaction and exposure policy.

### Phase 4 — Mapping (2 days)
- Normalize native/vendor errors, cancellation and timeout failures.

### Phase 5 — Runtime adapters (2 days)
- Nest, Worker, React and Native adapters with no core leakage.

### Phase 6 — Observability (1 day)
- Counters, trace context and mapping-failure diagnostics.

### Phase 7 — Conformance (1 day)
- Contract, security and cross-runtime suites.

### Phase 8 — Docs/release (1 day)
- README, migration table and Changeset.

## Exit criteria

- One canonical error model is used by every platform package.
- No client response can expose secret-bearing context or internal stacks.
- All adapters pass the same contract suite.
- Compatibility with `@stackra/exceptions` is explicit and tested.
- 95% branch coverage for core policies and 100% machine-code coverage.

## Cross-references

- ADR-0090, ADR-0091, ADR-0092.
- `2026-09-03-exceptions-package.md` — compatibility source.
- `2026-09-03-http-package.md` — transport mapping.
- `2026-09-03-nats-package.md` — internal error envelopes.
- `2026-09-03-enterprise-security-plan.md` — redaction/security controls.
