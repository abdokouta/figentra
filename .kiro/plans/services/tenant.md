---
status: canonical
component: service
service: tenant
version: v1
runtime: nestjs
---
# Tenant Service — implementation-complete plan

## Mission
Own tenant and organization lifecycle, membership context, isolation metadata and tenant administration. Tenant is the enterprise boundary; it does not own authentication, authorization policy, billing, or application-domain resources.

## Modules
`tenant`, `organization`, `membership-context`, `settings`, `lifecycle`, `domains`, `isolation`, `administration`, `events`, `persistence`.

## Models
`Tenant(id,slug,name,status,region,defaultLocale,defaultCurrency,createdAt,updatedAt)`; `Organization(id,tenantId,parentId,name,key,status)`; `TenantDomain(id,tenantId,hostname,verifiedAt,status)`; `TenantMembership(id,tenantId,principalId,status,joinedAt,leftAt)`; `TenantSetting(id,tenantId,key,value,version)`; `TenantLifecycle(id,tenantId,state,reason,changedAt,version)`.

Relations: Tenant→Organizations/Memberships/Domains/Settings; Organization self-hierarchy; Membership→Principal reference only. No FK to Identity database.

## DTOs/interfaces
`CreateTenantDto`, `UpdateTenantDto`, `ChangeTenantStatusDto`, `CreateOrganizationDto`, `UpdateOrganizationDto`, `AddMembershipDto`, `RemoveMembershipDto`, `VerifyDomainDto`, `TenantContextDto`, `ListTenantsQuery`.

```ts
interface TenantService { create(ctx,input):Promise<Tenant>; get(ctx,id):Promise<Tenant>; suspend(ctx,id,reason):Promise<Tenant>; activate(ctx,id):Promise<Tenant>; }
interface TenantContextService { resolve(tenantId,principalId):Promise<TenantContext>; assertActive(tenantId):Promise<void>; }
```

## Controllers
`POST /v1/tenants`; `GET/PATCH /v1/tenants/:id`; `POST /v1/tenants/:id/suspend`; `POST /v1/tenants/:id/activate`; `GET/POST/PATCH/DELETE /v1/tenants/:id/organizations`; `POST/DELETE /v1/tenants/:id/members`; `GET/PATCH /v1/tenants/:id/settings`; `POST /v1/tenants/:id/domains/verify`.

## Identity/IAM interactions
Identity supplies authenticated principal identity. Tenant resolves membership/context from its own data. IAM authorizes tenant administration and organization operations. Tenant never evaluates permissions itself. A tenant context may be attached to RequestContext only after membership/status checks.

## Isolation
Every tenant-owned row carries `tenant_id`; queries require context. Cross-tenant system operations require explicit system principal and IAM authorization. Tenant suspension blocks new business mutations through service-contract context checks while allowing required administrative/recovery reads.

## Persistence
PostgreSQL tables `tenants`, `organizations`, `tenant_memberships`, `tenant_domains`, `tenant_settings`, `tenant_lifecycle`, `outbox`. Unique constraints on slug, active domain and `(tenant_id,principal_id)`. Hierarchy indexes support parent/descendant queries.

## Workers
Consumer handles identity/domain verification events; worker performs domain verification retries and tenant cleanup; scheduler processes lifecycle expiry/retention. Same NestJS service source tree.

## Security
Domain ownership verification, strict tenant identifiers, no tenant secrets in settings, encryption for restricted settings, audit events for administrative mutations and deny-by-default tenant status checks.

## Reliability/observability
Tenant lifecycle transitions are versioned and idempotent. Metrics cover tenant creation, status transitions, membership conflicts, domain verification and context-resolution latency. Cache is non-authoritative and invalidated after commit.

## Testing
Lifecycle state matrix, membership uniqueness, tenant isolation, cross-tenant denial, domain verification replay, suspension behavior, concurrent updates, migration/rollback compatibility, IAM integration and context propagation.

## Completion gate
Tenant is the sole tenant boundary; no standalone Scope service exists. `scopeId` in RequestContext, where retained for product/resource context, is contextual metadata and never a separate control-plane database.