---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/auth` — authentication lifecycle and provider adapters

**Status:** Planned  
**Anchor ADRs:** ADR-0001, ADR-0005, ADR-0010, ADR-0015, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/identity`, `@stackra/config`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 18 days across 9 phases

## Purpose

Unified authentication abstraction for Supabase JWT, OIDC and service credentials. Handles access/refresh lifecycle, rotation, expiry, revocation, session/device state and secure token persistence while leaving identity semantics to `@stackra/identity`.

## Non-goals

- Authorization policy evaluation.
- User/profile CRUD.
- Password hashing implementation in consuming domains.

## Manager pattern

`AuthManager extends Manager<IAuthProvider>` per ADR-0090. Provider adapters are selected explicitly; token/session state is kept outside the manager.

## Subpath layout

```text
packages/auth/
├── src/core/{auth.module.ts,manager/,tokens/,sessions/,providers/,guards/,errors/,index.ts}
├── src/supabase/{supabase.provider.ts,index.ts}
├── src/oidc/{oidc.provider.ts,index.ts}
├── src/service/{service-token.provider.ts,index.ts}
├── src/nestjs/{auth.module.ts,guards/,strategies/,decorators/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{provider/,hooks/,secure-storage/,index.ts}
├── src/worker/{middleware/,token-verifier/,index.ts}
├── src/testing/{auth-fixture.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/auth` owns `IAuthProvider`, `ITokenVerifier`, `ISession`, `ITokenClaims`, `IAuthContext`, auth state and tokens.

## Public API — locked

```ts
interface IAuthService {
  authenticate(input: unknown): Promise<IAuthSession>;
  refresh(refreshToken: string): Promise<IAuthSession>;
  revoke(sessionId: string): Promise<void>;
  verifyAccessToken(token: string): Promise<IPrincipal>;
  current(): IAuthSession | null;
}
```

Access tokens are short-lived; refresh tokens rotate and are single-use where the provider supports it. Revoked/expired tokens are rejected deterministically.

## Runtime / configuration

Node/Nest validates bearer tokens and propagates identity. Worker validates JWTs without Node-only crypto. Browser/RN never expose long-lived secrets; secure storage is runtime-specific. Provider configuration is schema-validated and secrets come from `@stackra/config`.

## Security

Algorithm, issuer, audience and key-set are pinned/validated. Token substitution, replay, refresh-token reuse, clock skew, CSRF where cookie flows exist and open-redirect risks are covered. No bearer token enters logs, analytics or error envelopes.

## Errors / recovery / observability

Canonical errors cover invalid/expired/revoked token, provider unavailable, refresh reuse and configuration failure. Metrics cover login/refresh/revoke outcomes and latency, with provider labels but no token data.

## Persistence / compatibility

Session persistence is provider-owned or an explicit adapter; auth never writes identity records directly. Claims are versioned and tolerant of additive provider fields. Provider migration uses dual verification only during a bounded migration window.

## Testing / conformance

Real provider contract tests where credentials are available; local JWT fixtures; rotation/replay tests; malformed claims; key rotation; clock skew; tenant context; secure storage; Worker and Nest runtime tests.

## Dependencies / exports / versioning

Provider SDKs are optional peers under provider subpaths. Core has no provider SDK. Public auth contract changes require semver and Changesets.

## Phases

1. Contracts/scaffold (2d); 2. provider manager (2d); 3. JWT/session lifecycle (3d); 4. Supabase/OIDC/service adapters (3d); 5. Nest/Worker (2d); 6. React/RN secure storage (2d); 7. security/recovery tests (2d); 8. observability/conformance (1d); 9. docs/release (1d).

## Exit criteria

Rotation/revocation semantics are explicit; tokens never leak; all providers satisfy the same contract; identity context is propagated consistently; key rotation and replay tests pass.

## Cross-references

`2026-09-03-identity-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-enterprise-security-plan.md`, ADR-0001/0005/0010/0015.
