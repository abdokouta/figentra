# IAM Service — Security & Authorization

IAM is the sole authorization authority. Identity authenticates context; Gateway may prevalidate transport credentials but never supplies a final allow.

## Gateway boundary
Gateway owns public edge admission, CORS/WAF and coarse rate limiting. IAM independently validates trusted service context, tenant/resource scope, policy/grant state and authorization semantics. Client/Gateway-provided role, permission, policy-result, authorization-decision or tenant headers are untrusted.

## Evaluation controls
- deny by default;
- explicit deny before allow;
- validate tenant/resource context;
- enforce policy/grant expiry;
- evaluate only bounded typed conditions;
- require matching tenant/principal/scope;
- reject unknown action/resource;
- stale policy versions cannot produce allow;
- delegation preserves actor/effective subject;
- service identities require explicit audience/scope.

## Administrative controls
Role, grant, policy and permission administration requires authenticated context and IAM permissions. Self-modification is protected against privilege escalation.

## Isolation
Tenant scope is enforced at application and repository layers. Cross-tenant IDs are opaque. Resource hierarchy checks are deterministic.

## Policy safety
Conditions are typed, bounded ASTs. No code execution, SQL fragments, dynamic imports, network, filesystem or template evaluation.

## Rate/transport distinction
Gateway limits protect edge traffic. IAM retains authorization-specific batch, AST, evaluation-time and privileged mutation limits. Neither layer may silently weaken the other.

## Abuse/security tests
Cover forged Gateway context, tenant escape, privilege escalation, deny bypass, expired grant, stale cache, policy injection, oversized policy, concurrent races and direct/internal ingress. Any uncertainty results in deny/dependency failure.