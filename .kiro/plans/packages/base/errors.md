---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/errors"
anchor_adrs: [ADR-0091]
---
# `@stackra/errors` — implementation plan

## Purpose
Canonical transport-neutral typed error system used by every package and service. It provides stable machine-readable codes, categories, retryability metadata, causal chains and safe serialization. It never owns HTTP routing or business policy.

## Public API
```ts
type ErrorCategory = 'validation'|'authentication'|'authorization'|'not_found'|'conflict'|'rate_limit'|'dependency'|'timeout'|'internal';
interface ErrorContext { requestId?:string; correlationId?:string; service?:string; operation?:string; resource?:string; safeDetails?:Record<string,unknown>; }
abstract class AppError extends Error {
  readonly code:string; readonly category:ErrorCategory; readonly retryable:boolean;
  readonly retryAfterMs?:number; readonly context:ErrorContext; readonly cause?:unknown;
  toJSON(audience?:'external'|'internal'):SerializedError;
}
function normalizeError(error:unknown):AppError;
function serializeError(error:unknown,audience:'external'|'internal'):SerializedError;
```

## Source tree
```text
packages/errors/
├── src/core/{app-error,error-code,error-category,error-context,normalizer,serializer,index.ts}
├── src/errors/{validation,authentication,authorization,not-found,conflict,rate-limit,dependency,timeout,internal}/
├── src/testing/{error-fixture,assertions,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Error catalog
Codes are globally unique, immutable once published and documented in `@stackra/contracts/errors`. Services define domain-specific codes but inherit the same categories/serialization rules. Human-readable messages can change without breaking consumers.

## Normalization
`normalizeError` converts unknown thrown values into an `AppError`, preserving the original cause internally. Adapter-specific provider errors are mapped at the provider boundary. Retryability is explicit and never inferred from an error string.

## Serialization
External output contains code/category/safe message/request ID and bounded allowlisted details. Internal output may contain sanitized cause chains. Stack traces, SQL, tokens, credentials, provider response bodies and arbitrary request payloads never cross a service boundary.

## Transport integration
HTTP exception filters, NATS error envelopes and worker/DLQ records consume this taxonomy through adapters. The package knows no transport-specific status code rules; those mappings are maintained by the transport layer.

## Recovery semantics
Validation/authentication/authorization/not-found errors are normally terminal. Dependency/timeout/rate-limit errors may be retryable but only when the owning command is safe to retry. Idempotency is an independent contract and must never be inferred from error category.

## Security
Redaction covers Authorization/Cookie/API-key/password/private-key/secret fields and classified PII. Error context is immutable and bounded. Safe details are explicitly allowlisted. Nested causes are depth-limited.

## Testing
Code uniqueness; serialization by audience; redaction; cause preservation; retry metadata; transport mapping; large/error-depth limits; compatibility fixtures. Each service must test its domain error catalog against shared serializers.

## Implementation phases
1. Core types/codes/categories/context.
2. Normalization/cause handling.
3. Serialization/redaction.
4. Concrete category errors and contracts integration.
5. Transport/test conformance.

## Exit criteria
- No service defines an alternate base error class.
- Every public error has a stable code/category/retry policy.
- External serialization is bounded and secret-safe.
- Transport adapters preserve canonical codes.
