# 05 — Tenant

**Status: DESIGN PENDING**

## Purpose

Tenant is a customer/business isolation boundary.

Tenant is NOT the universal application hierarchy.

## Tenant owns

Potentially:

- tenant lifecycle
- tenant identity
- status
- metadata
- platform configuration
- provisioning
- retention/deletion

## Supabase Auth relationship

Supabase Auth organizations may be used for authentication UX and enterprise membership, but must not automatically become the universal Figentra Tenant model.

Proposed boundary:

```text
Supabase Auth Organization
      ↓
authentication context

Figentra Tenant
      ↓
platform/customer boundary
```

The mapping strategy is pending.

## Open

- tenant ownership
- parent/child tenants
- cross-tenant access
- membership
- billing owner
- domains
- application enablement
- deletion
- tenant provisioning
