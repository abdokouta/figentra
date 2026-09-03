---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: tenant
version: v1
runtime: nestjs
anchor_adrs: [ADR-0011, ADR-0024]
---
# Tenant Service — implementation plan

## Mission and boundary
Tenant is the authoritative enterprise tenancy control plane. It owns tenant lifecycle, organizations, memberships, tenant domains, tenant settings, lifecycle state, isolation metadata and tenant administration. It does not own authentication (Identity), authorization/policy evaluation (IAM), commercial entitlements (Monetization), or product resource hierarchies.

The former standalone Scope service is removed. `tenantId` is the tenancy boundary; subordinate `scopeId` may remain contextual product metadata but has no independent platform database/service.

## Source tree
```text
services/tenant/src/
├── modules/{tenants,organizations,memberships,domains,settings,lifecycle,isolation,administration}
├── application/{commands,queries,services}
├── domain/{entities,value-objects,policies}
├── infrastructure/{database,cache,messaging,config}
├── presentation/{http,openapi,mappers}
├── events/
├── database/{entities,migrations,seeds}
├── app.module.ts
└── main.ts
```

## Domain models
`Tenant(id,key,slug,name,status,region,defaultLocale,defaultCurrency,timezone,version,createdAt,updatedAt)`.
`Organization(id,tenantId,parentId,key,name,status,version)`.
`TenantMembership(id,tenantId,principalId,status,joinedAt,leftAt,version)`.
`TenantDomain(id,tenantId,hostname,status,verifiedAt,verificationToken,version)`.
`TenantSetting(id,tenantId,key,valueType,value,version,updatedAt)`.
`TenantLifecycle(id,tenantId,state,reason,changedBy,changedAt,version)`.

Relations stay inside this service database except opaque `principalId` references. Product services own their own resources and may reference `tenantId` and an organization/resource context without foreign keys across service databases.

## Lifecycle
`provisioning → active → suspended → archived`. Transitions are guarded, versioned and idempotent. Suspension prevents ordinary business mutations when downstream services enforce the shared tenant context; required administration/recovery paths remain available. Archived tenants are read/export restricted and terminal except controlled recovery.

## Public API
```ts
interface TenantService {
  create(ctx:RequestContext,input:CreateTenantInput):Promise<TenantView>;
  get(ctx:RequestContext,id:string):Promise<TenantView>;
  update(ctx:RequestContext,id:string,input:UpdateTenantInput):Promise<TenantView>;
  suspend(ctx:RequestContext,id:string,reason:string):Promise<void>;
  activate(ctx:RequestContext,id:string):Promise<void>;
  archive(ctx:RequestContext,id:string,reason:string):Promise<void>;
}
interface TenantContextService {
  resolve(tenantId:string,principalId:string):Promise<TenantContext>;
  assertActive(tenantId:string):Promise<void>;
}
interface MembershipService {
  add(ctx:RequestContext,input:AddMembershipInput):Promise<MembershipView>;
  revoke(ctx:RequestContext,tenantId:string,principalId:string):Promise<void>;
  list(ctx:RequestContext,tenantId:string,query:MembershipQuery):Promise<Paginated<MembershipView>>;
}
```

DTOs: `CreateTenantDto`, `UpdateTenantDto`, `ChangeTenantStatusDto`, `CreateOrganizationDto`, `UpdateOrganizationDto`, `AddMembershipDto`, `RemoveMembershipDto`, `CreateDomainDto`, `VerifyDomainDto`, `UpdateTenantSettingDto`, `TenantContextDto`.

## HTTP controllers
```text
POST   /v1/tenants
GET    /v1/tenants/:id
PATCH  /v1/tenants/:id
POST   /v1/tenants/:id/suspend
POST   /v1/tenants/:id/activate
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

All management endpoints require Identity-resolved authentication and IAM authorization. The controller never accepts a client-supplied principal as authoritative.

## Request context and cross-service calls
Identity establishes the authenticated principal. Tenant validates tenant membership/status when constructing `TenantContext`. IAM authorizes tenant administration. Monetization may be queried when tenant provisioning requires commercial plan validation, but Monetization remains authoritative for entitlements. Tenant must not evaluate permissions or billing rules itself.

## Persistence
PostgreSQL tables: `tenants`, `organizations`, `tenant_memberships`, `tenant_domains`, `tenant_settings`, `tenant_lifecycle`, `outbox`. Unique `(tenant_id,key)` organization/setting constraints, tenant slug/key uniqueness, active membership uniqueness and domain uniqueness. Index membership `(principal_id,status)`, organization `(tenant_id,parent_id)`, domain hostname and lifecycle state.

Migrations use expand/contract, online-safe indexes and explicit backfill jobs for large tenant populations. Outbox writes are committed atomically with state transitions.

## Isolation/security
All tenant-owned queries require an explicit tenant predicate or fail-closed ORM filter. Missing tenant context is not interpreted as “global.” Cross-tenant operator actions require system principal + IAM permission. Domain verification uses one-time challenges and strict hostname canonicalization. Tenant settings may contain only approved data types and secret references, never raw secrets.

## Caching and limits
Tenant context may be cached by `tenantId:membershipVersion`. Cache invalidation is emitted after commit; cache is never authoritative. Membership batch size, organization depth, domain count and setting payload size are bounded and validated.

## Runtime roles/reliability
`api` serves control-plane APIs; `consumer` processes Identity/Monetization/domain events; `worker` handles verification/cleanup/reconciliation; `scheduler` executes expiry/retention tasks. Mutations are idempotent where retried. Consumers deduplicate event IDs. Shutdown drains active DB/NATS work before exit.

## Observability
Metrics: tenant lifecycle transitions, context-resolution latency, membership add/revoke rate, domain verification success/failure, cache hit rate and isolation-denial events. OTel traces propagate request/correlation/causation IDs. Sensitive settings and verification tokens are excluded from logs/traces.

## Testing
Lifecycle transition matrix; organization hierarchy constraints; membership uniqueness; tenant isolation; forged tenant-context rejection; domain verification replay; concurrent status/membership updates; outbox idempotency; cache invalidation; migration upgrade/rollback compatibility; IAM authorization; load tests for context resolution.

## Implementation phases
1. Scaffold, contracts, configuration and migrations.
2. Tenant/organization aggregates and lifecycle.
3. Membership and Identity/IAM integration.
4. Domains/settings/isolation context.
5. Outbox/events/cache and worker roles.
6. Security/load/failure testing and production deployment.

## Exit criteria
- Tenant is the single tenancy control plane.
- No Scope service/database remains.
- Every tenant-owned row/query is isolated.
- Lifecycle behavior is deterministic and migration-safe.
- Membership/authentication/authorization boundaries are explicit.
- Production API, consumer, worker and scheduler roles share one service source tree.
