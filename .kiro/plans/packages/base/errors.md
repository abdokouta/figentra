---
status: canonical
component: package
package: "@stackra/errors"
owner: platform
---
# `@stackra/errors` — implementation-complete plan

## Purpose
One transport-neutral error taxonomy used by packages and all services. Errors preserve internal causes while exposing stable, safe public codes.

## Model
```ts
type ErrorCategory = 'validation'|'authentication'|'authorization'|'not_found'|'conflict'|'rate_limit'|'dependency'|'timeout'|'internal';
interface ErrorContext { requestId?:string; correlationId?:string; service?:string; operation?:string; resource?:string; safeDetails?:Record<string,unknown> }
class AppError extends Error { readonly code:string; readonly category:ErrorCategory; readonly retryable:boolean; readonly statusHint?:number; readonly context:ErrorContext; readonly cause?:unknown }
```
Codes are globally unique, machine-readable and stable. Human messages are not API identifiers.

## Serialization
`serializeError(error, audience)` returns a JSON-safe envelope. External serialization includes code/category/message/requestId and allowlisted details; internal serialization may include a sanitized cause chain. Stack traces, SQL, credentials and arbitrary payloads are never serialized to clients.

## Normalization
`normalizeError` converts unknown thrown values into `AppError` while preserving a causal reference. It never assumes retryability from text. Adapters map errors to HTTP/NATS responses without changing the canonical code.

## Security
Redaction is mandatory for authorization headers, cookies, tokens, passwords, private keys, database details and classified PII. Error contexts are immutable. Errors crossing service boundaries must be validated against the contract schema.

## Recovery
Retryability and retry-after metadata are explicit. Validation/authz/not-found errors are normally non-retryable; dependency/timeout errors may be retryable depending on operation semantics. Idempotency is a separate command contract and is never inferred from error category.

## Testing
Code uniqueness, constructor invariants, cause preservation, serialization by audience, redaction, transport mappings, retry metadata and backward compatibility. Every service owns a catalog of its domain error codes under `@stackra/contracts`.

## Completion criteria
No service defines a competing base error class or ad-hoc error codes; all controllers and consumers map through this taxonomy; error payloads are stable, bounded and secret-safe.