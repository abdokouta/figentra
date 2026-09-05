# Tenant Service — Security & Authorization

Identity establishes the authenticated principal. Tenant establishes authoritative tenant lifecycle/context. IAM decides whether that principal may administer the tenant. Gateway may prevalidate/admit traffic but never grants tenant authority.

## Gateway boundary
Gateway owns public CORS/WAF/coarse edge controls. Tenant independently validates trusted proxy boundaries, tenant context, membership/lifecycle rules and service-side security. Client/Gateway tenant headers are requested context only and are never authority.

## Controls
Every tenant path/query is scope-checked; client tenant IDs are untrusted; membership changes require IAM permissions; lifecycle transitions require authorization and actor attribution; domain challenges are random/short-lived/single-use; settings are allow-listed/schema-validated; secrets are forbidden in normal settings. Direct/internal ingress receives the same controls.

## Isolation
Application and repository layers enforce tenant isolation. Cross-tenant access returns the contractually safe result without existence leakage.

## Rate/transport distinction
Gateway coarse limits protect edge traffic. Tenant retains bounded member/domain/settings operations, lifecycle abuse controls and invariants needed without Gateway.

## Threat tests
Tenant escape, forged tenant/Gateway headers, membership escalation, unauthorized suspension/archive, challenge replay/domain takeover, settings injection, races, stale context, direct ingress and boundary-policy bypass.

## Audit
Lifecycle, membership, domain verification and privileged settings changes emit durable Audit facts. Logs/traces never substitute for audit.