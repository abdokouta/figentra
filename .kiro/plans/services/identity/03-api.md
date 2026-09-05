---
status: canonical
document: service-api
service: identity
version: v1
---
# Identity Service — API Contract

## Contract rules

REST is the synchronous public service API. All routes are versioned under `/v1`, use JSON, require request IDs, return the platform error envelope, and validate DTOs strictly. Authentication endpoints may be unauthenticated only where explicitly stated. Administrative identity operations require Identity authentication plus IAM authorization. Provider SDK types never cross the API boundary.

## Authentication

`POST /v1/auth/sign-up` — create a provider-backed identity and canonical Principal; idempotency key required for retried creation.

`POST /v1/auth/sign-in` — authenticate through the configured IdentityProvider; returns access/session result without exposing provider internals.

`POST /v1/auth/callback` — complete provider callback after state/nonce validation.

`POST /v1/auth/refresh` — rotate/refresh the session according to provider policy; replay detection revokes the affected session family.

`POST /v1/auth/sign-out` — revoke the addressed session; global sign-out requires explicit scope.

`POST /v1/auth/mfa/challenge` and `POST /v1/auth/mfa/verify` — provider capability mapped to the canonical MFA contract.

## Principal and identity

`GET /v1/me` — resolve authenticated PrincipalView.

`GET /v1/identities` — list identities owned by the authenticated principal.

`POST /v1/identities/link` — link a verified external identity.

`DELETE /v1/identities/:id` — unlink an identity after assurance and safety checks.

`GET /v1/sessions` — list the caller's sessions.

`POST /v1/sessions/:id/revoke` — revoke one session.

`POST /v1/sessions/revoke-all` — revoke all sessions for the caller.

## Service identities

`GET /v1/service-identities`
`POST /v1/service-identities`
`GET /v1/service-identities/:id`
`POST /v1/service-identities/:id/rotate`
`POST /v1/service-identities/:id/revoke`

Secret material is returned only at creation/rotation when the configured credential mechanism permits it and is never persisted or returned again.

## Delegation

`GET /v1/delegations`
`POST /v1/delegations`
`POST /v1/delegations/:id/revoke`

Delegation requests include actor, effective subject, allowed purpose, tenant, scope, start and expiry. Delegation does not grant permissions; IAM evaluates the resulting context.

## Provider events

`POST /v1/providers/supabase/webhook` — accepts only authenticated, verified provider events; duplicate events are idempotent.

## Internal verification contract

`verifyAccessToken(token)` returns a canonical `PrincipalContext` containing principal ID/type/status, issuer, assurance, authentication time, session ID where available, tenant context where established, actor/effective-subject attribution, and context version. No raw token is returned.

## Error contract

Errors use stable codes: `AUTHENTICATION_FAILED`, `TOKEN_INVALID`, `SESSION_REVOKED`, `SESSION_REPLAY_DETECTED`, `IDENTITY_NOT_FOUND`, `IDENTITY_LINK_DENIED`, `DELEGATION_INVALID`, `FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `CONFLICT`, `INTERNAL_ERROR`. Provider-specific error messages are normalized.

## HTTP semantics

`400` validation; `401` missing/invalid authentication; `403` authenticated but unauthorized; `404` inaccessible/nonexistent resource; `409` idempotency or uniqueness conflict; `422` semantically invalid state transition; `429` rate limit; `502/503` dependency failure where retryable; `500` unexpected failure.

## Headers

Required/propagated: `X-Request-Id`, `X-Correlation-Id`, `Idempotency-Key` for non-safe mutations. Service-to-service requests use the canonical service authentication and context propagation mechanism.

## Security

Tokens are accepted only through the configured extraction mechanism. Client-supplied principal, actor, tenant, role, permission, or assurance headers are ignored. Sensitive response fields are explicitly allow-listed.

## Compatibility

Existing v1 fields are additive-compatible only. Breaking changes require a new version and a migration path. OpenAPI is generated from the same DTO/schema definitions used for runtime validation.