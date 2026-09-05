---
status: canonical
component: service
service: tenant
version: v1
runtime: nestjs
---
# Tenant Service — Implementation Contract

## 1. Source tree

```text
services/tenant/src/
├── modules/
│   ├── tenants/{domain,application,infrastructure,presentation}
│   ├── organizations/{domain,application,infrastructure,presentation}
│   ├── memberships/{domain,application,infrastructure,presentation}
│   ├── domains/{domain,application,infrastructure,presentation}
│   ├── settings/{domain,application,infrastructure,presentation}
│   ├── lifecycle/{domain,application,infrastructure,presentation}
│   ├── isolation/{application,infrastructure}
│   └── administration/{application,presentation}
├── infrastructure/{database,cache,messaging,config}
├── events/{publishers,consumers,schemas}
├── database/{entities,migrations,seeds}
├── presentation/{http,openapi,mappers}
├── app.module.ts
└── main.ts
```

## 2. Entities and invariants

`Tenant(id,key,slug,name,status,region,defaultLocale,defaultCurrency,timezone,version,createdAt,updatedAt)` — key/slug unique; lifecycle transitions guarded; version required for updates.

`Organization(id,tenantId,parentId,key,name,status,version,createdAt,updatedAt)` — parent must belong to same tenant; cycles forbidden; depth bounded; key unique within tenant.

`TenantMembership(id,tenantId,principalId,status,joinedAt,leftAt,version)` — active membership unique per `(tenantId,principalId)`; principal is an opaque Identity identifier.

`TenantDomain(id,tenantId,hostname,status,verifiedAt,verificationTokenHash,version)` — canonical hostname unique; challenge is one-time and never returned after creation.

`TenantSetting(id,tenantId,key,valueType,value,version,updatedAt)` — keys are allow-listed; values are size/type bounded; secrets are references only.

`TenantLifecycle(id,tenantId,state,reason,changedBy,changedAt,version)` — append-oriented transition evidence.

## 3. Commands and application methods

- `CreateTenantCommand` → `CreateTenantHandler.execute()`
- `UpdateTenantCommand` → `UpdateTenantHandler.execute()`
- `ActivateTenantCommand` → `ActivateTenantHandler.execute()`
- `SuspendTenantCommand` → `SuspendTenantHandler.execute()`
- `ArchiveTenantCommand` → `ArchiveTenantHandler.execute()`
- `CreateOrganizationCommand` / `UpdateOrganizationCommand` / `RemoveOrganizationCommand`
- `AddMembershipCommand` / `RevokeMembershipCommand`
- `CreateDomainCommand` / `VerifyDomainCommand`
- `UpdateTenantSettingCommand`

Each handler validates RequestContext, IAM authorization, lifecycle state, optimistic version and idempotency before mutation.

## 4. Queries

- `GetTenantQuery` → `GetTenantHandler`
- `ListTenantsQuery` → `ListTenantsHandler`
- `GetTenantContextQuery` → `GetTenantContextHandler`
- `ListOrganizationsQuery`
- `ListMembershipsQuery`
- `ListDomainsQuery`
- `ListTenantSettingsQuery`
- `GetTenantLifecycleQuery`

Pagination uses `@stackra/pagination` contracts. Sensitive settings are never returned through generic listing APIs.

## 5. Repository ports

`TenantRepository`, `OrganizationRepository`, `MembershipRepository`, `TenantDomainRepository`, `TenantSettingRepository`, `TenantLifecycleRepository` define domain-facing operations. PostgreSQL adapters implement them. No controller or application handler imports ORM entities directly.

Required methods include `findById`, `findByKey`, `save`, `updateIfVersion`, `delete`, `listByTenant`, `findActiveMembership`, `findByHostname`, and bounded lifecycle queries.

## 6. HTTP API

```text
POST   /v1/tenants
GET    /v1/tenants/:id
PATCH  /v1/tenants/:id
POST   /v1/tenants/:id/activate
POST   /v1/tenants/:id/suspend
POST   /v1/tenants/:id/archive
GET    /v1/tenants/:id/organizations
POST   /v1/tenants/:id/organizations
PATCH  /v1/tenants/:id/organizations/:orgId
DELETE /v1/tenants/:id/organizations/:orgId
GET    /v1/tenants/:id/members
POST   /v1/tenants/:id/members
DELETE /v1/tenants/:id/members/:principalId
GET    /v1/tenants/:id/domains
POST   /v1/tenants/:id/domains
POST   /v1/tenants/:id/domains/:domainId/verify
GET    /v1/tenants/:id/settings
PATCH  /v1/tenants/:id/settings/:key
```

DTOs: `CreateTenantDto`, `UpdateTenantDto`, `ChangeTenantStatusDto`, `CreateOrganizationDto`, `UpdateOrganizationDto`, `AddMembershipDto`, `RemoveMembershipDto`, `CreateDomainDto`, `VerifyDomainDto`, `UpdateTenantSettingDto`.

All DTOs use strict schema validation, unknown-field rejection, body-size limits and canonical error envelopes.

## 7. Authorization

- Tenant creation: platform-level IAM permission.
- Tenant administration: tenant-scoped IAM permission.
- Organization administration: tenant-scoped IAM permission.
- Membership administration: tenant-scoped IAM permission.
- Domain verification: tenant administration permission plus domain challenge.
- Settings: per-setting IAM classification where required.

Identity authenticates; Tenant validates context; IAM authorizes.

## 8. Persistence

Tables:

```text
tenants
organizations
tenant_memberships
tenant_domains
tenant_settings
tenant_lifecycle
outbox
```

Indexes/constraints: tenant key/slug unique; `(tenant_id,key)` organization/settings; `(tenant_id,principal_id)` membership; hostname unique; lifecycle `(tenant_id,changed_at)`; status indexes for bounded operational queries.

Migrations use expand/contract, online-safe indexes and resumable backfills. Every state-changing transaction writes its outbox event before commit.

## 9. Events and messaging

Published contracts:
`TenantCreated`, `TenantActivated`, `TenantSuspended`, `TenantArchived`, `OrganizationCreated`, `OrganizationUpdated`, `OrganizationRemoved`, `MembershipAdded`, `MembershipRevoked`, `DomainVerified`, `TenantSettingsUpdated`.

Consumed contracts may include Identity principal lifecycle events and Monetization lifecycle/plan events. Consumers deduplicate by event ID and validate schema version.

No direct database access to Identity, IAM, Monetization or product services.

## 10. Jobs and schedulers

`VerifyTenantDomainJob` — bounded verification/recheck; retry with backoff; DLQ after configured attempts.

`ExpireDomainChallengesJob` — removes/invalidates expired challenges without deleting evidence required for security/audit.

`CleanupArchivedTenantDataJob` — only executes against explicitly approved retention policy and legal hold rules.

`ReconcileTenantContextCacheJob` — rebuilds derived cache entries from PostgreSQL.

Schedulers use deterministic occurrence keys and idempotent job handlers. Long operations checkpoint progress.

## 11. Cache

Context cache key: `tenant-context:{tenantId}:{membershipVersion}`. Cache is derived only. Writes invalidate after commit. Cache outage falls back to PostgreSQL. Stale context is never used to authorize an operation.

## 12. Security

Canonicalize hostnames; hash verification challenges; enforce one-time challenge use; reject forged tenant headers; never accept client-supplied principal IDs as authentication evidence; redact settings/challenges; enforce request size and rate limits; protect cross-tenant operator operations with system principal + IAM authorization.

## 13. Audit

Lifecycle, membership, domain verification, administrative settings and cross-tenant operator actions emit canonical Audit contracts after successful commit. Audit payloads contain identifiers and outcome metadata, not secrets.

## 14. Health and observability

Readiness checks PostgreSQL, NATS and required cache dependency according to runtime policy. Liveness never depends on downstream application services.

Metrics: lifecycle transitions, context latency, membership mutations, verification success/failure, cache hit/miss, isolation denials, event lag and job failures. OTel spans include request/correlation/causation IDs and tenant ID where permitted; secrets are excluded.

## 15. Tests

Unit: lifecycle matrix, hierarchy cycles/depth, membership invariants, hostname normalization, settings validation.

Integration: transactions/outbox, optimistic concurrency, cache invalidation, Identity event consumption, IAM enforcement.

Contract: `@stackra/contracts` schemas and RequestContext compatibility.

Security: tenant escape attempts, forged context, challenge replay, cross-tenant mutation, privilege escalation.

E2E: create tenant → activate → organization → membership → domain verification → settings.

Load: tenant-context resolution, membership listing and concurrent lifecycle changes.

## 16. Deployment and migration

Configuration is environment-driven and secret-manager backed. Database migrations run as a controlled deployment step. Rolling deployment requires backward-compatible contracts. Rollback must not undo committed business facts; schema rollback follows expand/contract policy.

## 17. Definition of done

No TODO architecture remains. Every command/query has a handler, validation, authorization, persistence and test contract. Every event is versioned and idempotent. Every tenant-owned query is isolated. API/consumer/worker/scheduler use one NestJS source tree. No Scope implementation or hidden authorization layer exists.
