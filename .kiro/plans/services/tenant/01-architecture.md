---
status: canonical
component: service
service: tenant
version: v1
runtime: nestjs
---
# Tenant Service — Architecture

## 1. Mission
Tenant is the authoritative tenancy control plane for Figentra. It defines the enterprise boundary within which principals, applications and domain services operate. It owns tenant lifecycle, organization structure, memberships, tenant domains, tenant settings and tenancy context.

Tenant answers: **which tenant/context does this operation belong to, and is that tenant structurally valid and active?**

It does not authenticate users, evaluate permissions, own commercial entitlements, or own product resources.

## 2. Boundary

| Concern | Owner |
|---|---|
| Authentication / external identity | Identity |
| Principal identity | Identity |
| Tenant lifecycle | Tenant |
| Organizations and memberships | Tenant |
| Tenant domains/settings | Tenant |
| Authorization / roles / permissions / policies | IAM |
| Commercial plans / entitlements | Monetization |
| Product resources | Owning domain service |
| Durable audit records | Audit |
| External provider connectivity | Integrations |

The former standalone Scope service does not exist. `tenantId` is the platform tenancy boundary. Resource hierarchy below tenant is owned by the relevant product/domain service.

## 3. Enterprise hierarchy

```text
Tenant
└── Organization
    └── product-owned hierarchy
        ├── Store
        ├── Region
        ├── Venue
        └── Resources
```

Organization is a Tenant concern. Store/Region/Venue/Resource are not generic Tenant entities unless a future ADR explicitly establishes a platform-wide ownership requirement.

## 4. Security boundary

Every request is associated with an Identity-resolved principal and, where applicable, a tenant context. IAM decides whether that principal may perform the requested operation. Tenant only validates tenancy structure, membership state and lifecycle.

A missing tenant context is never treated as global access. Cross-tenant operations require an explicit system/operator principal and IAM authorization.

## 5. Lifecycle

```text
provisioning → active → suspended → archived
```

Transitions are explicit, optimistic-concurrency protected and idempotent. Archived is terminal except controlled recovery. Tenant suspension blocks ordinary business mutations when downstream services enforce tenant state; recovery and administration remain available through explicitly authorized paths.

## 6. Consistency model

Tenant PostgreSQL is authoritative. Context caches are derived and disposable. Mutations commit domain state and outbox records atomically. Consumers are at-least-once and idempotent. Cross-service references use opaque identifiers and never database foreign keys.

## 7. Runtime

NestJS service roles share one source tree:

```text
api       → tenant administration/context APIs
consumer  → Identity/IAM/Monetization/domain event consumers
worker    → verification, cleanup, reconciliation
scheduler → expiry and retention work
```

No mirrored `workers/tenant` application is permitted.

## 8. Events

Canonical facts include `tenant.created`, `tenant.activated`, `tenant.suspended`, `tenant.archived`, `tenant.membership.added`, `tenant.membership.revoked`, `tenant.domain.verified`, and `tenant.settings.updated`. Contracts live in `@stackra/contracts`; transport uses the platform messaging standard.

## 9. Failure posture

Tenant never fails open on missing context, invalid lifecycle state or stale membership. Cache failure falls back to authoritative storage. Duplicate commands/events are safe. Provider/network failures are surfaced as typed dependency errors.

## 10. Acceptance criteria

- Tenant is the single platform tenancy control plane.
- No generic Scope service exists.
- Identity, IAM and Monetization remain separate authorities.
- Product resource hierarchies remain product-owned.
- Tenant isolation is enforced at repository/query boundaries.
- Lifecycle transitions, events and cache invalidation are deterministic and auditable.
