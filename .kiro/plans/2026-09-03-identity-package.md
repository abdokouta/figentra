---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/identity` — principal, actor and tenant identity

**Status:** Planned  
**Anchor ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/config`, `@stackra/logger`  
**Design effort:** 14 days across 8 phases

## Purpose

Canonical identity context for the platform. Identity is expressed as a principal plus explicit actor, tenant and session context; the package never conflates a person/user record with an authenticated principal.

## Non-goals

- Authentication protocol implementation (`@stackra/auth`).
- Authorization/policy engine.
- Business user/profile storage.

## Manager pattern

`IdentityManager` coordinates the current identity context; request/execution context is supplied explicitly by the runtime adapter. No global mutable identity singleton.

## Subpath layout

```text
packages/identity/
├── src/core/{identity.module.ts,principal/,actor/,tenant/,session/,context/,resolvers/,errors/,index.ts}
├── src/nestjs/{identity.module.ts,middleware/,decorators/,index.ts}
├── src/worker/{identity.module.ts,bindings/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{provider/,hooks/,index.ts}
├── src/testing/{identity-fixture.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/identity` owns `IPrincipal`, `IActor`, `ITenantContext`, `ISession`, `IIdentityContext` and `IDENTITY_CONTEXT`/`PRINCIPAL` tokens.

## Public API — locked

```ts
interface IIdentityContext { principal?: IPrincipal; actor?: IActor; tenant?: ITenantContext; session?: ISession; }
interface IIdentityResolver { resolve(input: unknown): Promise<IIdentityContext>; }
```

Identity context is immutable after resolution. Impersonation is explicit and produces an auditable child context; it cannot silently replace the original actor.

## Discovery / lifecycle

Identity resolvers are registered through the canonical discovery mechanism only when runtime adapters require them. Request context is created once per request and disposed with it.

## Security / isolation

Never trust client-supplied actor/tenant IDs. Identity comes from verified authentication or trusted service credentials. Cross-tenant context propagation is tested; logs use opaque identifiers and redact credentials.

## Errors / recovery / observability

Unknown or malformed identity normalizes to canonical authentication/identity errors. Metrics cover resolution failures and impersonation events. Audit records include original actor, effective actor, tenant and reason.

## Persistence / compatibility

No identity persistence is owned here. Principal identifiers are stable opaque IDs. Context wire format is versioned for service-to-service propagation.

## Testing / conformance

Test anonymous/authenticated/service principals, tenant propagation, impersonation, context isolation, malformed headers and concurrent requests. Nest/Worker adapters must not share mutable state.

## Dependencies / exports / versioning

Core remains runtime-neutral; runtime-specific adapters are subpaths. Authentication provider dependencies belong to `@stackra/auth`. Public context changes require semver.

## Phases

1. Contracts/scaffold (2d); 2. principal/actor/tenant model (2d); 3. context propagation (2d); 4. Nest/Worker adapters (2d); 5. security/impersonation (2d); 6. observability/errors (1d); 7. conformance (2d); 8. docs/release (1d).

## Exit criteria

No global mutable identity, explicit tenant/actor semantics, trusted-source resolution, complete propagation tests and stable wire contract.

## Cross-references

`2026-09-03-auth-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-enterprise-tenancy-plan.md`, ADR-0002/0003/0004/0005/0006.
