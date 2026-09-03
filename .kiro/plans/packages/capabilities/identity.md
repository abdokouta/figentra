---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/identity"
anchor_adrs: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0010, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/storage", "@stackra/security", "@stackra/http", "@stackra/observability"]
---
# `@stackra/identity` — implementation plan

## Purpose and boundary
Reusable authentication/identity client boundary shared by applications, runtimes and services. It resolves authenticated principals, sessions, credential references, service identities, identity links and delegated actor/subject context. Authorization remains IAM-owned; tenant lifecycle remains Tenant-owned.

## Source tree
```text
packages/identity/
├── src/core/{identity-manager,authentication,principal,resolver,context,delegation,errors,index.ts}
├── src/providers/{supabase,service-token,index.ts}
├── src/sessions/{session-manager,refresh,rotation,index.ts}
├── src/storage/{secure-storage-adapter,index.ts}
├── src/runtime/{browser,native,desktop,node,worker/index.ts}
├── src/nestjs/{identity.module.ts,guards,decorators,index.ts}
├── src/react/{provider,hooks,index.ts}
├── src/testing/{identity-fixture,provider-fixture,token-fixture,index.ts}
└── __tests__/{unit,integration,conformance,security}/
```

## Public API
```ts
interface IdentityManager {
  signIn(input:SignInInput):Promise<AuthenticationResult>;
  signOut(sessionId?:string):Promise<void>;
  verifyAccessToken(token:string):Promise<PrincipalContext>;
  refresh(input:RefreshInput):Promise<SessionResult>;
  current():PrincipalContext|null;
}
interface PrincipalResolver { resolve(id:string):Promise<Principal>; resolveExternal(provider:string,subject:string):Promise<Principal>; }
interface TokenVerifier { verify(token:string,policy:TokenPolicy):Promise<VerifiedClaims>; }
interface SessionManager { refresh(input:RefreshInput):Promise<SessionResult>; revoke(id:string):Promise<void>; list():Promise<readonly SessionView[]>; }
```

## Provider boundary
Supabase Auth is the day-one human authentication provider. Provider SDKs/types remain under `src/providers`. Service-to-service authentication uses explicit service credentials/verification and never reuses browser sessions. Provider verification checks issuer, audience, signature, expiry and bounded clock skew.

## Principal/actor model
A `PrincipalContext` contains `principalId`, `principalType`, authentication assurance, session ID, optional tenant context, optional actor/subject delegation and issue/expiry timestamps. The package maintains strict actor-vs-subject separation for impersonation. No legacy `user`/`actor` ambiguity is introduced.

## Session semantics
Access tokens are short-lived; refresh is rotated. Refresh replay invalidates the affected session family where required by policy. Revocation is explicit. Concurrent refresh operations are serialized through a runtime-safe coordination mechanism. No raw token is persisted or logged.

## Tenant/IAM composition
The SDK can carry trusted tenant context but does not decide tenant membership or authorization. Service boundaries call Tenant to resolve membership/status and IAM to authorize. A client-side permission check can optimize UX but never replaces server-side IAM.

## Secure storage
Browser/native/desktop store credentials through approved secure adapters. Arbitrary localStorage/AsyncStorage persistence is prohibited for refresh secrets unless an explicit ADR changes the policy. Worker/server runtimes use secret-manager/service credential mechanisms.

## Configuration
Provider URL, issuer/audience, client ID/public config, token clock-skew policy, session/refresh behavior and runtime storage strategy are explicit and schema-validated. Secrets are secret references. Missing production provider configuration is fatal.

## Errors/recovery
Typed categories: `AuthenticationFailedError`, `TokenVerificationError`, `SessionExpiredError`, `SessionRevokedError`, `RefreshReplayError`, `IdentityProviderError`, `IdentityConfigurationError`. Provider outages are surfaced as dependency failures; unverifiable credentials fail closed. Retries are bounded and only used for safe idempotent provider calls.

## Security
JWT algorithm allowlist; issuer/audience checks; nonce/state validation for browser callbacks; secure-storage boundary; secret/token redaction; service identity separation; explicit delegation expiry. The package never exposes raw provider claims to arbitrary UI state.

## Observability
Metrics: sign-in success/failure, token verification latency, provider errors, refresh/replay incidents, revocations and session counts. OTel spans never include raw tokens/claims. SDK diagnostics use `@stackra/logger` redaction.

## Testing
Provider verification fixtures; algorithm/issuer/audience attack cases; clock skew; refresh rotation/replay; concurrent refresh; revocation; delegation lifecycle; secure-storage failures; browser/native/desktop runtime conformance; service-token verification.

## Implementation phases
1. Core principal/context/token contracts.
2. Supabase provider and token verification.
3. session/refresh/revocation.
4. delegation/service identity and secure storage.
5. runtime/NestJS/React integration.
6. observability/security/conformance testing.

## Exit criteria
- Real Supabase verification is implemented.
- No raw tokens/credentials are persisted or logged.
- Principal/actor/subject semantics are explicit.
- Authorization remains IAM-owned.
- All supported runtimes use tested secure credential handling.
