# IAM Service Plan

Canonical production plan set for the IAM authorization service.

- `01-architecture.md` through `21-definition-of-done.md` — canonical implementation contract.
- `22-gateway-boundary-and-redundancy.md` — Gateway/service responsibility split.

## Gateway boundary
Gateway owns public edge routing, WAF/CORS, coarse edge traffic controls, transport normalization and request/trace propagation. IAM remains the sole authorization authority: it validates trusted Identity context, tenant/resource scope, policies, grants, denies, expiry and fail-closed behavior. Gateway cannot manufacture or cache a final IAM allow.

IAM retains service-side guards, pipes, interceptors, filters, request context, idempotency, authorization-specific limits and direct/internal-ingress security. Registry is metadata projection only; IAM remains authoritative for roles, permissions, policies, grants and decisions.

All documents form one implementation contract and must not introduce competing edge authority, mirrored workers or deferred day-one architecture.