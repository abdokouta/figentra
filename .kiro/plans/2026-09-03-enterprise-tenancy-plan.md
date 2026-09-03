---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra enterprise tenancy and isolation — architecture plan

**Status:** Planned  
**Anchor ADRs:** ADR-0004, ADR-0006, ADR-0011, ADR-0021, ADR-0091  
**Depends on:** `@stackra/identity`, `@stackra/auth`, `@stackra/container`, `@stackra/database`, `@stackra/orm`, `@stackra/cache`, `@stackra/storage`, `@stackra/logger`  
**Design effort:** 16 days across 8 phases

## Purpose

Canonical tenant context, isolation rules and propagation across requests, DB/ORM, cache, storage, queues, events and observability. Tenant boundaries are architectural invariants, not per-service conventions.

## Non-goals

Business tenancy CRUD, billing, subscription logic or authorization policy implementation.

## Manager pattern

`TenantContextManager` is request/execution scoped; no global current-tenant singleton.

## Subpath layout

```text
packages/tenancy/src/core/{tenancy.module.ts,context/,resolvers/,policies/,propagation/,errors/,index.ts}
packages/tenancy/src/nestjs/{middleware/,decorators/,index.ts}
packages/tenancy/src/worker/{resolver/,index.ts}
packages/tenancy/src/testing/{tenant-fixture.ts,isolation-suite.ts,index.ts}
```

## Contracts / API

`@stackra/contracts/tenancy` owns `ITenantContext`, `ITenantResolver`, `ITenantScope`, propagation headers/claims and `TENANT_CONTEXT` token.

## Locked rules

Tenant context is established only from trusted auth/service identity. DB queries, cache keys, object keys, queue messages, events and audit records must carry the required tenant boundary. Shared/global resources must explicitly declare that they are global. Cross-tenant access requires a privileged operation with an auditable reason.

## Security

Prevent tenant ID spoofing, confused-deputy service calls, cache poisoning, object-prefix breakout and cross-tenant logs. Tenant IDs are opaque and validated; client-supplied tenant headers are ignored unless authenticated as an allowed delegated context.

## Errors / observability

Tenant mismatch is a stable authorization/isolation error. Metrics distinguish isolation denials from ordinary authorization. Audit privileged cross-tenant operations with original/effective actor and tenant IDs.

## Persistence / compatibility

Database schema ownership remains service-local per ADR-0011. Tenant columns/partitions and ORM filters are mandatory according to entity policy. Cache/storage key formats are versioned for migration.

## Testing / conformance

A reusable isolation suite attempts read/write/cache/storage/event/queue operations across tenants and asserts failure. Test missing context, forged context, privileged delegation, async propagation and Worker request isolation.

## Phases

1. contracts/context (2d); 2. resolution/trusted sources (2d); 3. DB/ORM enforcement (2d); 4. cache/storage enforcement (2d); 5. transport/async propagation (2d); 6. privileged delegation/audit (2d); 7. conformance/security (3d); 8. docs/release (1d).

## Exit criteria

Every cross-boundary operation has an explicit tenant policy; cross-tenant leakage tests pass; no global tenant state exists.

## Cross-references

`2026-09-03-identity-package.md`, `2026-09-03-auth-package.md`, `2026-09-03-orm-package.md`, `2026-09-03-enterprise-security-plan.md`, ADR-0004/0006/0011/0021.
