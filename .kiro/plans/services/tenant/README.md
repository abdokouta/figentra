# Tenant Service Plan

Canonical production plan set for the Tenant tenancy control plane.

- `01-architecture.md` through `21-definition-of-done.md` — canonical implementation contract.
- `22-gateway-boundary-and-redundancy.md` — Gateway/service responsibility split.

Tenant owns tenant lifecycle, organizations, memberships, domains and tenant settings. Product services own product resource hierarchies; IAM owns authorization; Identity owns authentication.

## Gateway boundary
Gateway owns public edge routing, WAF/CORS, coarse edge controls, transport normalization and request/trace propagation. Tenant retains authoritative tenant context, lifecycle, membership/domain/settings validation, service-side guards/pipes/interceptors/filters, idempotency and direct/internal-ingress security. Client/Gateway tenant headers are never authority.

Registry is metadata projection only and never becomes the source of truth for tenant state. All documents form one implementation contract and must not introduce competing edge authority, mirrored workers or deferred day-one architecture.