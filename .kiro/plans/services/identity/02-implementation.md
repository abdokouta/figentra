---
status: canonical
document: service-implementation
service: identity
version: v1
runtime: nestjs
provider: supabase-auth
---
# Identity Service — Day-One Implementation Contract

This document is the implementation contract. It is intentionally concrete: source ownership, methods, endpoints, persistence, events, jobs, failure behavior, security controls, and tests are defined before implementation.

## 1. Repository/source tree

```text
services/identity/
├── src/
│   ├── modules/
│   │   ├── authentication/
│   │   │   ├── domain/{entities,value-objects,events,ports}
│   │   │   ├── application/{commands,queries,services}
│   │   │   ├── infrastructure/{supabase,cache,mappers}
│   │   │   └── presentation/{http,dto}
│   │   ├── principals/
│   │   ├── identities/
│   │   ├── sessions/
│   │   ├── credentials/
│   │   ├── service-identities/
│   │   ├── delegation/
│   │   ├── provider-events/
│   │   └── administration/
│   ├── infrastructure/{config,database,messaging,observability}
│   ├── presentation/{http,openapi}
│   ├── app.module.ts
│   └── main.ts
├── test/{unit,integration,contract,security,load}
├── migrations/
└── package.json
```

The exact physical repository location may follow the final monorepo service layout, but the ownership and module boundaries are mandatory.

## 2. Dependency rules

Allowed service dependencies:

- `@stackra/contracts`
- `@stackra/events`
- `@stackra/database`
- `@stackra/orm`
- `@stackra/security`
- `@stackra/observability`
- `@stackra/http`
- Identity-owned Supabase adapter

Identity must not import IAM repositories/entities, Tenant repositories/entities, domain-service implementations, Supabase database tables, or Clerk SDKs.

Cross-service interaction uses contracts and transport ports only.

## 3. Provider port

```ts
interface IdentityProvider {
  signIn(input: ProviderSignInInput): Promise<ProviderAuthenticationResult>;
  signOut(input: ProviderSignOutInput): Promise<void>;
  refresh(input: ProviderRefreshInput): Promise<ProviderSessionResult>;
  verifyAccessToken(input: VerifyAccessTokenInput): Promise<VerifiedProviderClaims>;
  revokeSession(input: ProviderSessionReference): Promise<void>;
  getIdentity(input: ProviderIdentityReference): Promise<ProviderIdentitySnapshot>;
}
```

The production implementation is `SupabaseIdentityProvider` only.

The interface must remain intentionally small. Do not add provider-specific abstractions merely to make future Clerk support appear complete.

## 4. Application methods

### AuthenticationService

- `signIn(input)`
- `completeCallback(input)` where applicable
- `verifyAccessToken(input)`
- `refreshSession(input)`
- `signOut(ctx, input)`
- `globalSignOut(ctx)`

### PrincipalService

- `createFromProviderIdentity(input)`
- `resolve(principalId)`
- `disable(ctx, principalId)`
- `enable(ctx, principalId)`
- `changeDisplayName(ctx, principalId, input)`

### IdentityLinkService

- `list(ctx, principalId)`
- `link(ctx, input)`
- `unlink(ctx, identityId)`
- `reconcileProviderIdentity(input)`

### SessionService

- `create(input)`
- `list(ctx, principalId)`
- `revoke(ctx, sessionId)`
- `revokeAll(ctx, principalId)`
- `detectRefreshReplay(input)`
- `expire(input)`

### ServiceIdentityService

- `create(ctx, input)`
- `rotate(ctx, serviceIdentityId)`
- `revoke(ctx, serviceIdentityId)`
- `resolveCredential(input)`

### DelegationService

- `create(ctx, input)`
- `revoke(ctx, delegationId)`
- `resolveActive(ctx, actorPrincipalId, targetPrincipalId)`
- `expire(input)`

### ProviderEventService

- `accept(input)`
- `process(eventId)`
- `reconcile(input)`

## 5. HTTP API

### Authentication

`POST /v1/auth/sign-in`
- Request: provider-neutral sign-in input supported by the current provider.
- Response: normalized authentication/session result.
- Public endpoint; rate limited; anti-enumeration response policy.

`POST /v1/auth/callback`
- Validates state/nonce where applicable.
- Creates/resolves Principal and Identity.

`POST /v1/auth/refresh`
- Rotates session credentials according to provider capabilities.
- Detects replay and invalidates session family on confirmed reuse.

`POST /v1/auth/sign-out`
- Revokes current session/provider session where supported.

### Current principal

`GET /v1/me`
- Returns normalized principal and safe identity summary.

### Identities

`GET /v1/identities`
`POST /v1/identities/link`
`DELETE /v1/identities/:id`

### Sessions

`GET /v1/sessions`
`DELETE /v1/sessions/:id`
`POST /v1/sessions/revoke-all`

### Service identities

`POST /v1/service-identities`
`POST /v1/service-identities/:id/rotate`
`DELETE /v1/service-identities/:id`

### Delegation

`POST /v1/delegations`
`DELETE /v1/delegations/:id`

All non-public endpoints require Identity authentication plus IAM authorization. Authorization is not implemented inside Identity.

## 6. DTOs and schemas

Required DTOs:

`SignInDto`, `CallbackDto`, `RefreshSessionDto`, `SignOutDto`, `LinkIdentityDto`, `UnlinkIdentityDto`, `CreateServiceIdentityDto`, `RotateServiceIdentityDto`, `CreateDelegationDto`, `PrincipalQueryDto`, `SessionQueryDto`.

Every DTO uses Standard Schema validation, strict unknown-field rejection, maximum lengths, maximum collection sizes, normalized identifiers, and bounded metadata objects.

Error responses use canonical contract errors with stable codes; provider error details are never exposed directly.

## 7. Database schema

PostgreSQL tables owned by Identity:

### `principals`
- `id` UUID/opaque ID
- `type`
- `status`
- `display_name`
- `version`
- `created_at`
- `updated_at`

### `identities`
- `id`
- `principal_id`
- `provider`
- `external_subject`
- `verified_at`
- `assurance`
- `metadata_json`
- timestamps

Unique: `(provider, external_subject)`.

### `sessions`
- `id`
- `principal_id`
- `tenant_id` nullable opaque reference
- `provider_session_ref`
- `refresh_secret_hash/ref`
- `issued_at`
- `expires_at`
- `revoked_at`
- `last_seen_at`
- `assurance`
- `family_id`
- `version`

Indexes: principal/status, expiry, provider session reference, active family.

### `credential_refs`
- provider/secret-manager reference metadata only
- no raw secret value

### `service_identities`
- name
- status
- principal type
- credential reference
- lifecycle timestamps

### `identity_links`
- principal/provider/external subject/status/link timestamps

### `delegations`
- actor principal
- target principal
- optional tenant reference
- reason
- start/end/revocation
- created timestamp

### `outbox`
Standard transactional outbox schema shared by the platform standard.

No foreign keys cross into Tenant or IAM databases.

## 8. Transaction boundaries

The following operations are atomic:

- Provider identity resolution + Principal creation + Identity creation + outbox event.
- Identity link/unlink + uniqueness enforcement + outbox event.
- Session state transition + outbox event.
- Service identity lifecycle + credential reference change + outbox event.
- Delegation lifecycle + outbox event.

Provider network calls occur outside database transactions unless the provider operation is inherently part of the required state transition and bounded by the implementation contract. Provider calls must not hold database locks across unbounded network latency.

## 9. Supabase adapter

The adapter owns:

- Supabase SDK initialization.
- Project URL/key configuration.
- JWT/JWKS verification strategy as appropriate to the configured Supabase setup.
- Issuer and audience validation.
- Claim normalization.
- Provider session reference mapping.
- Provider webhook verification.
- Provider error translation.

No Supabase SDK type appears in domain or application contracts.

Production configuration must fail startup when required security configuration is missing. Development-only bypasses are forbidden in staging/production.

## 10. Provider events

Provider webhooks enter a dedicated endpoint and are authenticated before parsing into internal events.

Required processing pipeline:

```text
HTTP webhook
 -> signature/authenticity validation
 -> bounded body parsing
 -> event schema validation
 -> provider event idempotency check
 -> persist acceptance
 -> outbox/internal event
 -> async reconciliation/application
```

Duplicate provider events are safe. Ordering is not assumed unless guaranteed and explicitly encoded; event versions and current provider snapshots are used for reconciliation.

## 11. Event subjects/contracts

Canonical event names use the platform event convention. Minimum contracts:

- `identity.principal.created.v1`
- `identity.principal.enabled.v1`
- `identity.principal.disabled.v1`
- `identity.identity.linked.v1`
- `identity.identity.unlinked.v1`
- `identity.session.created.v1`
- `identity.session.revoked.v1`
- `identity.service-identity.created.v1`
- `identity.service-identity.revoked.v1`
- `identity.delegation.created.v1`
- `identity.delegation.revoked.v1`
- `identity.provider-event.accepted.v1`

Every event includes event ID, type/version, occurred-at, producer, correlation ID, causation ID where available, and tenant context only when legitimately known.

## 12. Authorization integration

Identity supplies trusted `PrincipalContext` to IAM. IAM evaluates:

`principal + action + resource + tenant/scope + policy context -> decision`.

Identity never evaluates permissions and never interprets Clerk/Supabase roles as Figentra permissions.

Administrative Identity endpoints call IAM through a narrow authorization contract such as `AuthorizationService.check` rather than importing IAM implementation code.

## 13. Session and token security

- Access tokens are verified on every service boundary according to the platform trust model.
- Token algorithm must be allow-listed.
- Issuer and audience are allow-listed.
- Expiry and not-before claims are enforced.
- Clock skew is bounded and configured.
- Refresh credentials are rotated where supported.
- Refresh replay is detected using family/version state.
- Revoked sessions cannot become active again.
- Global logout revokes all locally tracked sessions and invokes provider revocation where supported.

## 14. Service-to-service authentication

Human sessions are never used as service credentials.

Service identities use dedicated credentials, lifecycle state, rotation, revocation, and explicit authorization scopes. Credential issuance/rotation returns secrets only at the controlled creation/rotation boundary and never stores raw secrets in the Identity database.

## 15. Delegation and impersonation

Delegation records:

`actorPrincipalId -> targetPrincipalId -> optional tenant -> reason -> start/end -> revokedAt`.

A delegated request context preserves both actor and effective subject. Audit records must retain both. Delegation is bounded, revocable, and authorized by IAM. It cannot grant the actor or subject additional permissions.

## 16. Jobs and scheduler

### Session expiry job
- Find bounded batches of expired sessions.
- Mark them expired/revoked according to state machine.
- Emit events only for actual state transitions.
- Resume from deterministic cursor.

### Refresh-family cleanup
- Remove only data permitted by retention policy.
- Preserve evidence required for replay/security investigation.

### Provider reconciliation
- Compare selected provider snapshots against Identity state.
- Repair safe drift.
- Route ambiguous conflicts to an operational review queue.

### Delegation expiry
- Expire bounded batches.
- Emit revocation/expiry events once.

No job performs unbounded scans or assumes the entire dataset fits in memory.

## 17. Runtime roles

### API
Authentication, principal queries, session management, identity linking, service-identity administration, delegation administration.

### Consumer
Provider/security event processing, reconciliation triggers, outbox-related inbound processing.

### Worker
Session cleanup, replay-family cleanup, safe reconciliation, derived security maintenance.

### Scheduler
Triggers bounded recurring jobs. The implementation remains in the same NestJS service source tree.

## 18. Rate limits and abuse controls

Authentication, refresh, callback, identity linking, service-identity creation, and delegation endpoints receive endpoint-specific limits.

Rate-limit keys use the safest available combination of source, principal, provider subject, and operation without creating an account-enumeration oracle.

Failed authentication responses must not reveal whether a user exists.

## 19. Observability

Metrics:

- authentication success/failure
- invalid-token rate
- provider latency/error rate
- refresh success/failure/replay
- session creation/revocation
- identity-link conflicts
- webhook acceptance/rejection/duplicate rate
- reconciliation drift
- service-identity rotation/revocation
- delegation creation/revocation

OTel spans cover provider calls and state transitions. Tokens, secrets, authorization headers, passwords, raw webhook payloads, and sensitive metadata are redacted.

## 20. Audit

Identity emits durable security-relevant audit events for administrative and security-sensitive changes. Audit is a separate service and does not become an Identity persistence dependency inside the transaction.

The outbox guarantees that an accepted state change has a durable publication path after commit.

## 21. Testing contract

### Unit
- Provider claim normalization.
- JWT validation rules.
- Principal creation invariants.
- Identity uniqueness.
- Session state machine.
- Refresh replay detection.
- Delegation expiry/revocation.
- Service identity lifecycle.

### Integration
- PostgreSQL transactions.
- Outbox publication.
- Concurrent identity creation.
- Concurrent refresh.
- Session revocation.
- Provider webhook idempotency.
- Reconciliation.
- IAM authorization boundary.

### Security
- Algorithm confusion.
- Wrong issuer.
- Wrong audience.
- Expired/not-before tokens.
- Token substitution.
- Signature failure.
- Replay.
- Session fixation.
- Webhook forgery.
- Enumeration leakage.
- Delegation privilege escalation.
- Tenant-context spoofing.

### Contract
- `PrincipalContext` compatibility with IAM and all consuming services.
- Event schema compatibility.
- Supabase adapter fixtures.

### Load
Define and enforce p95/p99 verification, refresh, and sign-in latency targets against the production-like deployment profile. Measure provider dependency latency separately from local processing.

## 22. Deployment and migration

Secrets/configuration are environment-specific for development, staging, and production. Supabase projects/environments must not be accidentally shared across environments.

Database migrations use expand/contract. Rolling deployment must support old and new schema versions simultaneously. Destructive changes require a later migration after all readers/writers are upgraded.

Provider configuration changes are deployed through controlled configuration changes, not source-code edits.

## 23. Operational runbooks required

Before production approval, document procedures for:

- Supabase outage.
- Invalid signing-key/JWKS rotation.
- Provider webhook backlog.
- Provider event duplication.
- Refresh-token/session replay incident.
- Mass session revocation.
- Compromised service credential.
- Service identity rotation.
- Identity-link conflict.
- Provider reconciliation drift.
- Emergency account disablement.
- Database restore and outbox replay.

## 24. Definition of done

Identity is production-ready only when:

- Supabase is the single enabled production provider.
- The provider port is implemented and covered by contract tests.
- No Clerk dependency exists.
- No authentication provider adapter is hidden in the generic Integrations service.
- Principal/Identity/Session state is owned by Identity.
- IAM owns all authorization decisions.
- No raw credentials are persisted.
- Provider webhooks are authenticated and idempotent.
- Session replay/revocation behavior is deterministic.
- Service-to-service identities are distinct from human sessions.
- Delegation preserves actor attribution and cannot bypass IAM.
- All endpoints have schema, auth, rate-limit, error, observability, and test contracts.
- Database migrations, outbox, retries, reconciliation, runbooks, and rollback procedures are production-tested.
