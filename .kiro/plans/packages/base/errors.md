---
status: canonical
component: package
package: "@stackra/errors"
---
# `@stackra/errors` — implementation plan

Canonical typed error taxonomy, error codes, safe serialization, cause chains and transport mapping. Owns neither HTTP routing nor business policies.

## API
`AppError`, `ErrorCode`, `ErrorCategory`, `ErrorContext`, `serializeError`, `normalizeError`, `isAppError`, and transport-neutral error contracts. HTTP/NATS adapters map these to wire responses.

## Security/recovery
Redact secrets/PII from serialized errors; preserve causal diagnostics internally. Distinguish validation, authn, authz, not-found, conflict, dependency, timeout and internal failures. Retryability is explicit metadata, never inferred from message text.

## Testing
Code uniqueness, serialization stability, cause preservation, redaction, transport mappings and compatibility fixtures.

## Exit criteria
All services and packages use canonical typed errors with stable codes and no duplicated taxonomies.
