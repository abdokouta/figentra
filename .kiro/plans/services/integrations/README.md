# Integrations Service Plan

Canonical production plan set for external business-system connectivity.

- `01-architecture.md` through `21-definition-of-done.md` — canonical implementation contract.
- `22-gateway-boundary-and-redundancy.md` — Gateway/service responsibility split.

Integrations owns provider adapters, tenant connections, credential references, webhooks, outbound requests, sync, mappings and reconciliation. Authentication providers such as Supabase/Clerk remain Identity-owned.

## Gateway boundary
Gateway owns public edge routing, WAF/CORS, coarse edge controls, transport normalization and request/trace propagation. Integrations retains authoritative Identity/service authentication, Tenant/IAM checks, provider webhook verification, SSRF/egress policy, provider-specific rate/concurrency controls, idempotency and direct/internal-ingress security. Gateway cannot establish provider provenance.

Registry is metadata projection only and never stores credentials or authoritative integration state. All documents form one implementation contract and must not introduce competing edge authority, mirrored workers or deferred day-one architecture.