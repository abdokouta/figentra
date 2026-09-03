---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/identity` — identity, authentication and principal context

**Status:** Planned  
**Anchor ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/config`, `@stackra/logger`, `@stackra/observability`  
**Design effort:** 18 days across 10 phases

## Purpose

`@stackra/identity` is the single platform bounded context for **identity and authentication**. It normalizes externally authenticated identities into canonical Figentra principals and supplies explicit identity, actor, tenant and session context to applications and platform services.

The package owns the authentication orchestration boundary while provider state remains external to Figentra. **Supabase Auth is the day-one human authentication provider.** Provider-specific state is never duplicated as a second source of truth.

## Non-goals

- Authorization, IAM or policy evaluation.
- Tenant/business profile ownership.
- Application-domain user/profile data.
- Commercial entitlements.
- Audit storage ownership.

There is no independent `@stackra/auth` package in the target architecture. Authentication is a capability of the Identity bounded context and is exposed from `@stackra/identity` through explicit authentication subpaths.

## Manager pattern

`IdentityManager` coordinates identity resolution and provider adapters. `AuthenticationManager` coordinates configured authentication providers and token/session operations. Managers are application-scoped; request identity context is request/execution-scoped and immutable after resolution.

No global mutable current-user singleton is permitted.

## Subpath layout

```text
packages/identity/
├── src/core/
│   ├── identity.module.ts
│   ├── principal/
│   ├── actor/
│   ├── tenant/
│   ├── session/
│   ├── credentials/
│   ├── authentication/
│   │   ├── providers/
│   │   ├── tokens/
│   │   ├── sessions/
│   │   ├── refresh/
│   │   ├── revocation/
│   │   └── verification/
│   ├── context/
│   ├── resolvers/
│   ├── impersonation/
│   ├── service-identities/
│   ├── errors/
│   ├── managers/
│   └── index.ts
├── src/providers/supabase/{adapter.ts,mapper.ts,verification.ts,index.ts}
├── src/nestjs/{identity.module.ts,guards/,middleware/,interceptors/,decorators/,controllers/,index.ts}
├── src/worker/{identity.module.ts,bindings/,context/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{provider/,hooks/,index.ts}
├── src/testing/{identity-fixture.ts,auth-fixture.ts,mocks/,providers/,index.ts}
└── __tests__/
```

Provider adapters are real production integrations. No fake or placeholder provider is permitted.

## Contracts split

`@stackra/contracts/identity` owns the cross-package contracts:

| Symbol | Responsibility |
|---|---|
| `IPrincipal` | canonical authorization subject |
| `IIdentity` | external/provider identity link |
| `IActor` | effective actor context |
| `ITenantContext` | trusted tenant context |
| `ISession` | Figentra session metadata |
| `ICredentialReference` | non-secret credential reference |
| `IIdentityContext` | resolved request/execution identity |
| `IAuthenticationProvider` | provider adapter contract |
| `IAuthenticationResult` | normalized authentication result |
| `ITokenSet` | normalized token lifecycle data, never logged |
| `IIdentityResolver` | resolve trusted identity into context |
| `IImpersonationContext` | explicit delegated/impersonated context |
| `IDENTITY_CONTEXT` | DI token |
| `IDENTITY_MANAGER` | DI token |
| `AUTHENTICATION_MANAGER` | DI token |
| `IDENTITY_RESOLVER` | DI token |

Provider SDK types do not cross this boundary.

## Public API — locked

```ts
interface IdentityManager {
  resolve(input: IdentityResolutionInput): Promise<IIdentityContext>;
  current(context: RequestContext): IIdentityContext | undefined;
}

interface AuthenticationManager {
  authenticate(input: AuthenticationInput): Promise<IAuthenticationResult>;
  refresh(input: RefreshTokenInput): Promise<IAuthenticationResult>;
  revoke(input: RevokeSessionInput): Promise<void>;
  verify(input: AuthenticationVerificationInput): Promise<IIdentityContext>;
}

interface IIdentityContext {
  principal?: IPrincipal;
  actor?: IActor;
  tenant?: ITenantContext;
  session?: ISession;
  authentication?: AuthenticationContext;
}
```

Authentication results and token objects are safe-to-use application contracts but MUST never be serialized into logs or telemetry.

## Authentication model

```text
Browser / Mobile / Service
        │
        ▼
Supabase Auth / trusted service credential
        │
        ▼
@stackra/identity authentication provider adapter
        │
        ├── verify provider assertion/token
        ├── normalize subject
        ├── resolve/create canonical Principal
        ├── resolve tenant/actor context
        └── create explicit IdentityContext
                    │
                    ▼
             IAM / Policy decision
```

Authentication answers **who authenticated**. Identity normalizes that subject. IAM answers **what that subject may do**.

Service-to-service credentials and delegated end-user context are separate. Browser credentials MUST NOT be reused as service credentials.

## Sessions, credentials and tokens

Identity owns Figentra-side session metadata and credential references required for platform behavior, while Supabase remains the source of truth for provider authentication state.

Day-one requirements:

- access-token verification;
- refresh lifecycle where the provider flow requires it;
- revocation/session invalidation;
- session/device metadata;
- service-account credentials;
- integration identities;
- token exchange/delegation where explicitly authorized;
- secure credential rotation references;
- expiry handling;
- clock-skew tolerance;
- replay detection for security-sensitive flows.

Secrets themselves are never exposed through the public identity context.

## Discovery / lifecycle

Authentication providers and identity resolvers use the canonical platform discovery mechanism. Discovery finds providers; registry stores/indexes metadata; managers select and construct providers. Provider selection is configuration-driven and validated at startup.

Request/execution context is created by the runtime adapter, enriched by identity resolution, then disposed with the request/execution. No ambient global state is used.

## Runtime matrix

| Runtime | Responsibility |
|---|---|
| Node/NestJS | authentication APIs, callbacks, token verification, identity resolution |
| Worker | edge token prevalidation and trusted identity context propagation; no authoritative IAM decision |
| Browser/React | client authentication/session facade; never authoritative authorization |
| React Native | mobile authentication/session facade and secure credential storage integration |
| Desktop | authentication/session facade and OS-secure credential integration |

The core package remains runtime-neutral.

## Security / isolation

- Never trust client-supplied principal, actor, tenant or scope IDs.
- Validate issuer, audience, signature, expiry and relevant claims.
- Enforce tenant binding after authentication and before protected operations.
- Keep authentication credentials out of logs, traces, metrics and analytics.
- Use secure storage for client refresh/session material where applicable.
- Use short-lived service credentials with explicit scopes.
- Impersonation requires explicit grant, reason, expiry and audit correlation.
- Cross-tenant identity resolution must fail closed.

## Errors / recovery / observability

Canonical errors distinguish invalid credentials, expired credentials, revoked sessions, unknown identity, invalid tenant context, provider outage, rate limiting and security policy denial. Provider outages are dependency errors; malformed credentials are authentication errors.

Authentication operations emit operational telemetry through `@stackra/observability` and structured logs through `@stackra/logger`, but telemetry contains only safe identifiers and outcome classes. Security-sensitive authentication events are also emitted to the audit boundary.

Required metrics include authentication success/failure rate, provider latency/errors, refresh/revocation failures, active sessions and suspicious/replay rejection counts. Authentication traces must never record raw tokens.

## Persistence / compatibility

Identity-owned persistence is limited to Figentra-side principal, identity-link, session, service-account, integration-identity and impersonation metadata. Provider state remains external.

Database migrations must preserve provider subject identifiers and support dual-read/dual-write only where an explicit migration requires it. Provider token formats are treated as opaque compatibility boundaries.

## Testing / conformance

- Supabase adapter contract tests with provider sandbox/test project.
- Token verification negative tests: wrong issuer, audience, signature, expiry, nonce and malformed token.
- Session refresh/revocation tests.
- Tenant isolation and cross-tenant rejection tests.
- Service identity and delegated identity tests.
- Impersonation authorization/audit tests.
- Concurrent request context isolation tests.
- Browser/RN/Desktop secure-storage boundary tests.
- No real secrets in fixtures or snapshots.

## Dependencies / exports / versioning

Core exports only platform contracts and provider-neutral implementations. Supabase dependencies are isolated under `/providers/supabase` and the Nest/Worker runtime integrations.

The former standalone `@stackra/auth` plan is removed from the target package graph. Breaking identity/authentication contract changes require semver-major migration notes.

## Phases

1. Contracts and vocabulary (2d)
2. Principal/identity/session model (2d)
3. Authentication manager/provider contract (2d)
4. Supabase provider integration (2d)
5. Token/session/revocation lifecycle (2d)
6. NestJS/Worker runtime adapters (2d)
7. Browser/RN/Desktop integration (1d)
8. Security/impersonation/audit integration (2d)
9. Observability/conformance (2d)
10. Documentation/release (1d)

Every phase must implement its contracts, tests, telemetry/security controls and migration implications before being marked complete.

## Exit criteria

Identity/authentication is one coherent bounded context; Supabase is the day-one human authentication provider; IAM remains authorization-only; provider secrets never leak; tenant/actor context is explicit; all runtimes preserve isolation; and there is no separate auth package in the production dependency graph.

## Cross-references

`2026-09-03-iam-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-enterprise-tenancy-plan.md`, `2026-09-03-enterprise-observability-plan.md`, ADR-0002/0003/0004/0005/0006.
