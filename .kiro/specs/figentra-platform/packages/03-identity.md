# Identity Package — Kiro Implementation Specification

**Package:** `@figentra/identity`  
**Path:** `packages/identity`  
**Purpose:** Canonical identity and authentication boundary: provider authentication orchestration, principal normalization, sessions, service identities and explicit identity context.

## 1. Boundary

This package is the single reusable platform boundary for identity **and authentication**. It is not a deployable service by itself; the Identity service/runtime composes it.

**Day-one human authentication provider:** Supabase Auth.

### Owns

- Authentication provider adapters and verification.
- Principal and identity normalization.
- Identity links.
- Figentra-side session metadata.
- Credential references and service identities.
- Token/session lifecycle abstractions.
- Identity/actor/tenant context resolution.
- Explicit impersonation/delegation context.

### Does not own

- Supabase provider database/state.
- IAM authorization/policy decisions.
- Tenant business data/profile ownership.
- Commercial entitlements.
- Audit persistence.

There is no separate `@figentra/auth` package in the target architecture.

## 2. API design

- Provider-neutral public contracts.
- No provider SDK types in root exports.
- Explicit runtime subpaths for NestJS, Worker, Browser, React Native and Desktop.
- Public authentication results must never expose secrets through logging/telemetry helpers.
- Every public export has JSDoc and semver compatibility rules.

## 3. Dependencies

### Runtime

- `@figentra/contracts`
- `@figentra/errors`
- `@figentra/config`
- `@figentra/observability`

### Optional provider

- Supabase authentication SDK/integration only under the explicit provider adapter subpath.

### Peer

Runtime/framework dependencies only under their runtime-specific subpaths.

## 4. Source layout

```text
src/
├── core/
│   ├── principal/
│   ├── identity/
│   ├── actor/
│   ├── tenant/
│   ├── session/
│   ├── credentials/
│   ├── authentication/
│   │   ├── providers/
│   │   ├── verification/
│   │   ├── tokens/
│   │   ├── refresh/
│   │   └── revocation/
│   ├── context/
│   ├── impersonation/
│   ├── service-identities/
│   ├── managers/
│   └── index.ts
├── providers/supabase/
├── nestjs/
├── worker/
├── browser/
├── react/
├── native/
├── desktop/
└── testing/
```

## 5. Public contracts

`@figentra/contracts/identity` owns:

- `IPrincipal`
- `IIdentity`
- `IActor`
- `ITenantContext`
- `ISession`
- `ICredentialReference`
- `IIdentityContext`
- `IAuthenticationProvider`
- `IAuthenticationResult`
- `ITokenSet`
- `IIdentityResolver`
- `IImpersonationContext`
- `IDENTITY_CONTEXT`
- `IDENTITY_MANAGER`
- `AUTHENTICATION_MANAGER`

## 6. Authentication model

```text
Supabase Auth / trusted service credential
              ↓
      provider adapter
              ↓
       verification
              ↓
    identity normalization
              ↓
      canonical Principal
              ↓
       IdentityContext
              ↓
         IAM / Policy
```

Authentication establishes trusted identity. IAM decides authorization. A browser credential is never reused as a service credential.

## 7. Lifecycle and security

- Validate issuer, audience, signature, expiry and required claims.
- Keep raw tokens and provider credentials outside logs, traces, metrics and analytics.
- Service credentials are scoped and short-lived where supported.
- Tenant context is resolved from trusted identity/server state, never arbitrary client input.
- Impersonation requires explicit grant, reason, expiry and audit correlation.
- Cross-tenant identity resolution fails closed.

## 8. Runtime behavior

| Runtime | Responsibility |
|---|---|
| Node/NestJS | authentication APIs, callbacks, token verification, identity resolution |
| Worker | edge verification/prevalidation and identity propagation; no final IAM authority |
| Browser/React | client authentication/session facade |
| React Native | mobile authentication/session facade + secure storage adapter |
| Desktop | authentication/session facade + OS secure credential adapter |

## 9. Errors and observability

Canonical errors distinguish invalid/expired/revoked credentials, unknown identity, invalid tenant context, provider outage and rate limiting.

Authentication telemetry records outcome classes, latency and safe identifiers only. Required operational metrics include authentication success/failure rate, provider latency/errors, refresh/revocation failures and suspicious/replay rejection counts. Security-sensitive operations emit audit events through the audit boundary.

## 10. Testing

- Supabase adapter contract/sandbox tests.
- Invalid issuer/audience/signature/expiry/nonce/malformed token tests.
- Session refresh/revocation tests.
- Service identity/delegation tests.
- Tenant isolation tests.
- Impersonation/audit tests.
- Concurrent request-context isolation tests.
- Browser/RN/Desktop secure-storage boundary tests.
- No real secrets in fixtures.

## 11. Versioning

Breaking changes to identity/authentication contracts require semver-major migration notes. Provider token formats remain opaque compatibility boundaries.

## 12. Acceptance

`lint` + `typecheck` + `test` + `build` + export validation pass; Supabase authentication works through the provider adapter; identity context is explicit and isolated; IAM remains separate; and no standalone auth package is required.
