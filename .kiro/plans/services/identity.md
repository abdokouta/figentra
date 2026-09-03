---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: identity
version: v1
runtime: nestjs
anchor_adrs: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0010]
depends_on: ["@stackra/contracts", "@stackra/events", "@stackra/database", "@stackra/orm", "@stackra/security", "@stackra/observability"]
---
# Identity Service — implementation plan

## Mission
Identity is the authentication and principal-resolution control plane. It answers **who is authenticated, how they authenticated, and what trusted principal/session context should be attached to a request**. It owns authentication orchestration, provider identities, sessions, service identities, credential references, identity linking and delegated/impersonated context.

Identity does **not** own authorization, tenant commercial access, business profiles or product-domain users. IAM authorizes actions. Tenant owns tenant lifecycle and membership metadata. Monetization owns commercial access.

## Modules and source tree
```text
services/identity/src/
├── modules/
│   ├── authentication/
│   ├── principals/
│   ├── identities/
│   ├── sessions/
│   ├── credentials/
│   ├── service-identities/
│   ├── delegation/
│   ├── providers/
│   ├── security-events/
│   └── administration/
├── infrastructure/{database,providers,cache,messaging,config}
├── presentation/{http,openapi,mappers}
├── events/
├── database/{entities,migrations,seeds}
├── app.module.ts
└── main.ts
```

Each module contains `domain`, `application`, `infrastructure`, and `presentation` layers. Providers and SDK objects never cross the service boundary.

## Domain model

### Principal
`Principal(id,type,status,displayName,createdAt,updatedAt,version)` where type is `human | service | integration | system | agent`. Principal is the canonical subject identifier used by IAM and all RequestContexts.

### Identity
`Identity(id,principalId,provider,externalSubject,verifiedAt,assurance,metadata,createdAt,updatedAt)`. `(provider,externalSubject)` is unique. Provider metadata is bounded and classified.

### Session
`Session(id,principalId,tenantId?,accessSessionRef,refreshSessionHash,issuedAt,expiresAt,revokedAt,lastSeenAt,assurance,version)`. Raw refresh tokens are never persisted; only a keyed/hashed reference is stored where required by the provider flow.

### CredentialRef
`CredentialRef(id,principalId,type,secretProvider,keyRef,createdAt,rotatedAt)`. Secret values are resolved from the infrastructure secret manager only at the provider boundary.

### ServiceIdentity
`ServiceIdentity(id,name,status,credentialRefId,principalType,createdAt,revokedAt)`. Service identities are used for internal service-to-service authentication and must be explicitly scoped.

### IdentityLink
`IdentityLink(id,principalId,provider,externalSubject,status,linkedAt,unlinkedAt)`. Linking and unlinking are idempotent operations with uniqueness protection.

### Delegation
`Delegation(id,actorPrincipalId,targetPrincipalId,tenantId,reason,startsAt,endsAt,revokedAt,createdAt)`. Delegation changes RequestContext attribution to `(actor, subject)`; it never bypasses IAM.

## Public contracts

```ts
interface IdentityService {
  authenticate(input: AuthenticateInput): Promise<AuthenticationResult>;
  verifyAccessToken(input: VerifyTokenInput): Promise<PrincipalContext>;
  refreshSession(input: RefreshSessionInput): Promise<SessionResult>;
  revokeSession(ctx: RequestContext, sessionId: string): Promise<void>;
  resolvePrincipal(principalId: string): Promise<PrincipalView>;
}

interface IdentityProvider {
  authenticate(input: ProviderAuthenticationInput): Promise<ProviderAuthenticationResult>;
  verify(token: string): Promise<VerifiedClaims>;
  createIdentity?(input: CreateProviderIdentityInput): Promise<ProviderIdentityResult>;
}
```

DTOs: `SignInDto`, `CallbackDto`, `RefreshSessionDto`, `RevokeSessionDto`, `LinkIdentityDto`, `UnlinkIdentityDto`, `CreateServiceIdentityDto`, `RevokeServiceIdentityDto`, `CreateDelegationDto`, `RevokeDelegationDto`, `PrincipalQueryDto`.

All DTOs use Standard Schema validation, strict unknown-field handling and request-size limits.

## Controllers
```text
POST   /v1/auth/sign-in
POST   /v1/auth/callback
POST   /v1/auth/refresh
POST   /v1/auth/sign-out
GET    /v1/me
GET    /v1/identities
POST   /v1/identities/link
DELETE /v1/identities/:id
GET    /v1/sessions
DELETE /v1/sessions/:id
POST   /v1/service-identities
DELETE /v1/service-identities/:id
POST   /v1/delegations
DELETE /v1/delegations/:id
```

Authentication endpoints are public only where explicitly required; management endpoints require authenticated principal context and IAM authorization.

## Supabase boundary
Supabase Auth is the canonical external authentication provider. The adapter validates issuer, audience, signature, expiry and clock-skew policy, then maps claims to the platform Principal. Supabase SDK types are adapter-local. A future provider is introduced as another `IdentityProvider` implementation plus migration/linking policy; IAM consumers remain unchanged.

## RequestContext production flow
```text
HTTP/NATS ingress
  → credential/token extraction
  → Identity.verifyAccessToken()
  → PrincipalContext
  → tenant context resolution when required
  → IAM authorization
  → service use case
```

The Gateway can reject clearly unauthenticated traffic, but services remain responsible for validating trusted internal identity context and authorization. A service never trusts a user-supplied `principalId` header.

## Persistence

PostgreSQL tables:
`principals`, `identities`, `sessions`, `credential_refs`, `service_identities`, `identity_links`, `delegations`, `outbox`.

Required indexes: `(provider,external_subject)`, `(principal_id,status)`, `(tenant_id,principal_id)`, active-session expiry, `(actor_principal_id,target_principal_id)`. Cross-service IDs remain opaque strings; no foreign keys to Tenant/IAM databases.

All mutating use cases run transactionally with outbox publication after commit. Migrations use expand/contract and preserve backwards compatibility during rolling deployment.

## Security and threat controls

- JWT issuer/audience/signature validation is mandatory.
- Clock skew has an explicit bounded tolerance.
- Refresh-session rotation detects replay and invalidates the session family when replay is confirmed.
- Service identities use distinct credentials from human sessions.
- Delegation has explicit start/end/revocation and maximum lifetime.
- Provider callback state/nonce is validated where applicable.
- Credential values never enter logs, traces, audit payloads or database rows.
- Administrative operations require IAM authorization and configured assurance level.

## Reliability and recovery

Provider timeouts are bounded. Authentication does not automatically retry non-idempotent provider operations. Refresh operations use idempotency/session-family guards. Provider outages surface a dependency error rather than accepting unverifiable credentials. Cleanup jobs are resumable and bounded.

Consumers process provider/security events at least once with idempotency keys. Failures use bounded retry + DLQ. A replay tool reprocesses safe events without mutating authentication state twice.

## Runtime roles

`api` handles authentication and identity management. `consumer` handles security/provider events. `worker` performs session cleanup, stale-link reconciliation and derived-security maintenance. `scheduler` runs expiry and retention jobs. All roles execute from the same service source tree.

## Observability

Metrics: authentication success/failure rate, provider latency, invalid token rate, refresh replay detections, active sessions, revocations, identity-link conflicts and dependency failures. OTel spans cover provider calls and security-sensitive operations but exclude tokens and credential values. Audit receives durable security-relevant events after commit.

## Testing

Unit: claim validation, provider mapping, session state transitions, replay detection, delegation expiry and identity-link invariants. Contract: provider adapter fixtures and RequestContext compatibility. Integration: database transaction/outbox, concurrent refresh, revocation propagation, service identity authentication and tenant-context resolution. Security: algorithm confusion, invalid issuer/audience, token substitution, replay, privilege escalation through delegation. Load: p95 auth verification and refresh latency under configured limits.

## Implementation phases

1. Package/service scaffold, config, contracts and database migrations.
2. Principal/identity aggregates and provider adapter.
3. Session lifecycle and refresh/replay protection.
4. Service identities, identity linking and delegation.
5. Controllers/OpenAPI, outbox, events and observability.
6. Security hardening, failure injection, load and migration compatibility tests.
7. Production rollout, secret-manager integration and operational runbooks.

## Exit criteria

- Every authenticated request resolves to canonical `PrincipalContext`.
- Supabase verification is real and signature/issuer/audience checked.
- No raw credential/token persistence exists.
- Refresh replay and revocation are deterministic and tested.
- Delegation never bypasses IAM and is auditable.
- No `@figentra/*`, legacy actor/user taxonomy or duplicate auth implementation remains.
