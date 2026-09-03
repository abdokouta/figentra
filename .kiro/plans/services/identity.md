---
status: canonical
component: service
service: identity
version: v1
runtime: nestjs
---
# Identity Service — implementation-complete plan

## Mission
Authenticate principals and manage identity lifecycle. Identity owns authentication orchestration, sessions, credential references, service identities, identity links, principal normalization and impersonation/delegation context. It does not own authorization or tenant policy.

## Modules
`authentication`, `sessions`, `principals`, `credentials`, `service-identities`, `identity-links`, `delegation`, `providers`, `security-events`, `persistence`.

## Models
`Principal(id,type,status,displayName,createdAt,updatedAt)`; `Identity(id,principalId,provider,subject,verifiedAt,metadata)`; `Session(id,principalId,tenantId,issuedAt,expiresAt,revokedAt,assurance)`; `CredentialRef(id,principalId,type,providerRef,createdAt)`; `ServiceIdentity(id,name,status,credentialRef)`; `IdentityLink(id,principalId,provider,externalSubject,status)`; `Delegation(id,actorPrincipalId,targetPrincipalId,tenantId,reason,startsAt,endsAt,revokedAt)`.

## DTOs
Sign-in/callback, session refresh/revoke, identity-link attach/detach, service-identity create/revoke, delegation start/end and principal lookup DTOs. Tokens are never DTO fields for persistence; credentials are provider references.

## Interfaces
```ts
interface IdentityService { authenticate(input):Promise<AuthenticationResult>; verifyAccessToken(token):Promise<PrincipalContext>; refreshSession(input):Promise<SessionResult>; revokeSession(ctx,id):Promise<void>; }
interface PrincipalService { get(id):Promise<Principal>; resolveExternal(provider,subject):Promise<Principal>; }
interface AuthProvider { authenticate(input):Promise<ProviderAuthResult>; verify(token):Promise<ProviderClaims>; }
```

## Controllers
`POST /v1/auth/sign-in`; `POST /v1/auth/callback`; `POST /v1/auth/refresh`; `POST /v1/auth/sign-out`; `GET /v1/me`; `GET/POST/DELETE /v1/identities`; `POST/DELETE /v1/service-identities`; `POST/DELETE /v1/delegations`.

## Supabase Auth boundary
Supabase Auth is the canonical external authentication provider. The provider adapter validates issuer/audience/signature and normalizes claims into a platform Principal. Provider-specific SDK types do not cross the service boundary. Provider migration requires a versioned adapter and identity-link migration, not changes to IAM consumers.

## IAM/Tenant interactions
Identity establishes `principalId`, `principalType`, authentication assurance and optional tenant context. IAM is called for authorization only when Identity exposes administrative operations that require policy checks; Identity does not maintain role/permission tables. Tenant is queried for tenant membership/status where needed to construct a valid context. Gateway authentication is not the final authorization decision.

## Sessions/security
Short-lived access tokens, rotating refresh sessions, explicit revocation and replay detection. Service identities use separate credentials and scopes. Impersonation always creates actor/subject fields in RequestContext and is auditable. Session secrets are never logged.

## Persistence
PostgreSQL: `principals`, `identities`, `sessions`, `credential_refs`, `service_identities`, `identity_links`, `delegations`, `outbox`. Unique provider/subject and active-session constraints. No raw passwords or external provider secrets.

## Workers
NestJS consumer processes provider/security events; worker cleans expired sessions and stale identity links; scheduler runs bounded session cleanup. Same service source tree for all roles.

## Reliability/observability
Authentication latency, provider errors, invalid-token rate, refresh replay, session revocation and identity-link conflicts are metrics. Sensitive token values are never traced/logged. Security-significant events are emitted transactionally to Audit.

## Testing
Provider verification fixtures, token rotation/replay, session revocation, clock skew, identity linking, service identity authentication, delegation expiry, tenant context construction, concurrent refresh and migration tests.

## Completion gate
Every authenticated request can produce a canonical PrincipalContext; provider credentials are references only; no authorization logic is duplicated in Identity; production authentication uses a real provider adapter and all security flows are tested.