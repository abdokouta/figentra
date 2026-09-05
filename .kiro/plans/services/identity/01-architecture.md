---
status: canonical
document: service-architecture
service: identity
version: v1
runtime: nestjs
provider_strategy: supabase-first
---
# Identity Service — Architecture Contract

## 1. Decision

Figentra Identity is a **Figentra-owned NestJS service** responsible for authentication orchestration, canonical principal resolution, external identity mapping, sessions, service identities, identity linking, delegation/impersonation context, and security-sensitive identity lifecycle operations.

Authorization is explicitly outside Identity. IAM is a separate Figentra-owned NestJS service and is the sole authority for permissions, roles, policies, grants, resource scopes, and authorization decisions. Tenant owns tenant lifecycle and tenancy metadata. Monetization owns commercial entitlement.

The Identity service must not expose provider-specific concepts to domain services.

## 2. Authentication-provider strategy

Figentra has two viable strategies:

### Option A — provider abstraction with multiple providers

Define an internal `IdentityProvider` port and implement Clerk, Supabase Auth, and future providers. The application depends only on the port.

**Advantages**
- Migration seam exists from day one.
- Provider-specific SDKs remain isolated.
- Integration tests can use deterministic provider fixtures.
- IAM and domain services remain provider-neutral.

**Costs**
- A generic provider abstraction can become a lowest-common-denominator API.
- Supporting multiple production providers multiplies security, lifecycle, webhook, migration, and operational testing.
- Putting authentication adapters into the generic Integrations service would blur ownership and make identity a generic integration rather than a security boundary.

### Option B — Supabase Auth as the day-one authentication system

Use Supabase Auth as the production authentication provider and build the Figentra Identity domain around it. Do not build Clerk support, Clerk Organizations, or a multi-provider platform until an actual business requirement exists.

**Advantages**
- Smaller day-one security surface.
- One production path to harden, load-test, monitor, and operate.
- Faster implementation and fewer migration assumptions.
- Figentra still owns its internal Principal/Identity/Session model.

**Risk**
- A future provider migration requires a deliberate identity/credential migration project.

### Adopted day-one position

**Use Supabase Auth as the sole production provider on day one, behind a narrow Identity-owned provider port.**

This is intentionally not a multi-provider platform. The port is an ownership boundary, not a commitment to support Clerk immediately. The Supabase adapter is the only production implementation. A second provider may be added only through an explicit architecture/security review and migration plan.

This gives Figentra the practical simplicity of Option B while preserving the architectural seam of Option A without paying the operational cost of running both providers.

## 3. Provider ownership

Authentication providers belong to Identity, not the generic Integrations service.

```text
Figentra applications
        |
        v
Identity Service
  |-- authentication orchestration
  |-- Principal / Identity / Session
  |-- provider port
  |-- Supabase adapter
  |
  v
Supabase Auth

IAM Service
  |-- roles
  |-- permissions
  |-- policies
  |-- grants
  |-- authorization decisions
```

`@stackra/integrations` may contain reusable transport/client primitives or generic external-system integrations, but it must not become the authoritative home of authentication providers.

## 4. Canonical identity model

### Principal
Canonical platform subject: `id`, `type`, `status`, `displayName`, timestamps, version. Types include `human`, `service`, `integration`, `system`, and `agent`.

### Identity
External authentication binding: `id`, `principalId`, `provider`, `externalSubject`, verification state, assurance, bounded metadata, timestamps. `(provider, externalSubject)` is unique.

### Session
Identity session record containing provider session reference, hashed/derived refresh reference where required, issue/expiry/revocation timestamps, assurance, last-seen state, and version. Raw refresh tokens are never stored.

### CredentialRef
Reference to a secret managed by the configured secret manager. Secret values never enter application logs, traces, normal database rows, or events.

### ServiceIdentity
Non-human identity for service-to-service authentication with explicit lifecycle, credentials, status, and scope constraints.

### IdentityLink
Additional provider identity bound to an existing Principal with explicit verification and idempotent link/unlink behavior.

### Delegation
Time-bounded actor-to-subject delegation. Delegation changes attribution but never bypasses IAM.

## 5. Request trust model

```text
HTTP / NATS ingress
  -> credential extraction
  -> token/session verification
  -> Identity principal resolution
  -> trusted RequestContext
  -> tenant context when required
  -> IAM authorization
  -> domain use case
```

A user-supplied `principalId`, `tenantId`, role, permission, or authorization decision is never trusted. Internal identity context must be authenticated at service boundaries and carry issuer/version/integrity metadata appropriate to the transport.

Gateway authentication can reduce unnecessary traffic but is not the service authorization boundary.

## 6. Enterprise identity capabilities

Identity must provide contracts for:

- Sign-up/sign-in orchestration.
- Authentication callbacks where applicable.
- Access-token verification.
- Session refresh and revocation.
- Global logout semantics.
- MFA and passkey capability mapping when supported by the selected provider.
- External identity-provider flows when enabled by the provider.
- Enterprise SSO integration through the selected provider.
- Identity lifecycle synchronization.
- Identity linking/unlinking.
- Service identities.
- Delegation/impersonation with explicit attribution.
- Account disable/recovery flows.
- Provider webhook ingestion and reconciliation.

Provider capability gaps must be represented explicitly rather than silently emulated.

## 7. Multi-tenancy boundary

Identity may carry a tenant context on a session or request when required, but it does not own the tenant hierarchy.

```text
Tenant
  -> Organization
    -> Store
      -> Region
        -> Venue
          -> Resource
```

Tenant lifecycle and membership metadata belong to Tenant/IAM. Identity establishes who the authenticated principal is. IAM determines whether that principal may operate at a requested scope.

## 8. Events

Identity emits versioned business/security events through the canonical event/outbox path. Examples:

- `identity.principal.created`
- `identity.principal.disabled`
- `identity.identity.linked`
- `identity.identity.unlinked`
- `identity.session.created`
- `identity.session.revoked`
- `identity.service_identity.created`
- `identity.service_identity.revoked`
- `identity.delegation.created`
- `identity.delegation.revoked`
- `identity.provider_event.accepted`

Provider webhooks are first converted into validated Identity events. External provider payloads never become internal contracts directly.

## 9. Failure posture

- Unverifiable credentials fail closed.
- Provider timeout is a dependency failure, never an authentication success.
- Non-idempotent provider mutations are not blindly retried.
- Webhooks are processed at least once with idempotency protection.
- Poison events enter bounded retry/DLQ handling.
- Reconciliation is resumable and safe to rerun.
- Session replay detection invalidates the affected session family according to policy.
- Provider outage does not cause the service to invent or cache trusted authentication decisions beyond the explicit verification policy.

## 10. Security invariants

1. No raw passwords or refresh tokens are persisted by Figentra.
2. JWT issuer, audience, signature, algorithm, expiry, and clock-skew rules are validated.
3. Provider SDK objects do not cross the adapter boundary.
4. Authentication and authorization remain separate.
5. Delegation never grants permissions by itself.
6. Service identities are never represented as human sessions.
7. Sensitive values are redacted from logs, traces, metrics, audit payloads, and errors.
8. Administrative identity operations require authenticated context and appropriate IAM authorization.
9. Provider webhook authenticity is verified before processing.
10. Every externally supplied identifier is treated as untrusted input.

## 11. Runtime

The service is one NestJS source tree with runtime roles `api`, `consumer`, `worker`, and `scheduler`. No mirrored `workers/identity` application is permitted.

## 12. Non-goals

Identity does not own:

- Roles or permissions.
- Authorization policies.
- Resource-level authorization.
- Tenant lifecycle.
- Subscription/billing entitlement.
- General business profiles.
- Generic integrations.
- Analytics/tracking.
- General application logs.

## 13. Architecture acceptance

The architecture is accepted when Supabase is the only production provider, the provider adapter is isolated behind a narrow port, no Clerk-specific dependency leaks into services, IAM is fully Figentra-owned, and all authentication state transitions are deterministic, observable, auditable, and tested.