# IAM Service — Security & Authorization

IAM is the sole authorization authority. It authenticates context through Identity but never imports Identity persistence/provider code.

## Evaluation controls
- deny by default;
- explicit deny before allow;
- validate tenant/resource context;
- enforce policy/grant expiry;
- evaluate only bounded typed conditions;
- require matching tenant/principal/scope;
- reject unknown action/resource rather than guessing;
- stale policy versions cannot produce allow;
- delegation preserves actor/effective subject;
- service identities require explicit audience/scope.

## Administrative controls
Role, grant, policy and permission administration requires authenticated context and IAM administrative permissions. Permission catalog changes are controlled and versioned. Self-modification paths are explicitly protected against accidental privilege escalation.

## Isolation
All tenant-scoped operations constrain tenant ID at repository level and application authorization level. Cross-tenant IDs are opaque and cannot be used to bypass scope. Resource hierarchy checks are deterministic.

## Policy safety
Conditions are a typed AST with allow-listed operators and bounded depth/size. No code execution, SQL fragments, dynamic imports, network access, filesystem access or template evaluation is permitted.

## Abuse/security tests
Cover forged context, tenant escape, privilege escalation, deny bypass, expired grant, stale cache, policy injection, oversized policy, algorithm/context confusion, concurrent mutation races and delegation escalation.

## Failure
Any uncertainty in identity, tenant, policy, resource scope or evaluator state results in deny or dependency failure—not allow.