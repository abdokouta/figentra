---
status: canonical
document: service-implementation
service: iam
version: v1
runtime: nestjs
---
# IAM Service — Day-One Implementation Contract

## Source tree

```text
services/iam/src/
├── modules/
│   ├── authorization/{domain,application,infrastructure,presentation}
│   ├── roles/{domain,application,infrastructure,presentation}
│   ├── permissions/{domain,application,infrastructure,presentation}
│   ├── policies/{domain,application,infrastructure,presentation}
│   ├── grants/{domain,application,infrastructure,presentation}
│   ├── resource-context/{domain,application,infrastructure}
│   ├── decision-cache/{application,infrastructure}
│   └── administration/{application,presentation}
├── infrastructure/{database,messaging,cache,config,observability}
├── presentation/{http,openapi}
├── app.module.ts
└── main.ts
```

## Domain models

`Role(id, tenantId, name, key, description, status, version, createdAt, updatedAt)`

`Permission(id, key, action, resource, description, status)`

`Policy(id, tenantId, effect, principalSelector, actionSelector, resourceSelector, conditions, priority, version, status)`

`Grant(id, tenantId, principalId, roleId, resourceType, resourceId, scope, expiresAt, status)`

`AuthorizationDecision(id, tenantId, principalId, actorPrincipalId?, action, resource, result, reasonCode, policyVersion, createdAt)`

No model contains a foreign key into Identity tables. Principal IDs are opaque cross-service identifiers.

## Application methods

### AuthorizationService

- `check(ctx, request)`
- `require(ctx, request)`
- `checkMany(ctx, requests)`

### RoleService

- `create(ctx, input)`
- `update(ctx, roleId, input)`
- `delete(ctx, roleId)`
- `assign(ctx, input)`
- `revoke(ctx, grantId)`
- `list(ctx, query)`

### PermissionService

- `list(ctx, query)`
- `resolve(key)`
- `register(permission)` through controlled platform bootstrap/migration only

Permission keys are immutable once published.

### PolicyService

- `create(ctx, input)`
- `update(ctx, policyId, input)`
- `publish(ctx, policyId)`
- `disable(ctx, policyId)`
- `list(ctx, query)`
- `evaluate(input)`

### GrantService

- `create(ctx, input)`
- `revoke(ctx, grantId)`
- `expire(input)`
- `list(ctx, query)`

## HTTP API

Roles:

`GET /v1/roles`
`POST /v1/roles`
`PATCH /v1/roles/:id`
`DELETE /v1/roles/:id`
`POST /v1/roles/:id/assignments`
`DELETE /v1/assignments/:id`

Permissions:

`GET /v1/permissions`

Policies:

`GET /v1/policies`
`POST /v1/policies`
`PATCH /v1/policies/:id`
`POST /v1/policies/:id/publish`
`POST /v1/policies/:id/disable`

Authorization:

`POST /v1/authorization/check`
`POST /v1/authorization/check-many`

All endpoints have explicit schema, authentication, IAM-self-authorization, rate-limit, error, and audit behavior.

## DTOs

`CreateRoleDto`, `UpdateRoleDto`, `AssignRoleDto`, `CreatePolicyDto`, `UpdatePolicyDto`, `AuthorizationCheckDto`, `AuthorizationCheckManyDto`, `CreateGrantDto`, `ListRolesQuery`, `ListPoliciesQuery`, `ListGrantsQuery`, `ListPermissionsQuery`.

Strict validation is mandatory. Conditions use a typed schema/AST. Unknown fields are rejected.

## Decision algorithm

1. Validate `PrincipalContext`.
2. Validate tenant/resource context.
3. Normalize action and resource identifiers.
4. Resolve applicable roles/grants.
5. Resolve applicable policies.
6. Evaluate explicit denies first.
7. Evaluate allow rules and conditions.
8. Enforce grant/policy expiry.
9. Apply hierarchical scope rules.
10. Return deny when no valid allow exists.
11. Attach stable `reasonCode` and `policyVersion`.
12. Emit an audit hook when policy requires durable recording.

A cache hit is valid only when tenant, principal, action, resource, relevant context hash, and policy/resource versions match.

## Persistence

PostgreSQL tables:

- `roles`
- `permissions`
- `role_permissions`
- `policies`
- `grants`
- `authorization_decisions`
- `outbox`

Required uniqueness/indexing:

- `(tenant_id, key)` on roles.
- `(role_id, permission_id)` on role permissions.
- Principal/tenant/resource/action lookup indexes on grants.
- Policy tenant/version/status indexes.
- Decision records indexed by tenant/principal/time when retention requires them.

Migrations use expand/contract and are safe for rolling deployment.

## Policy representation

Conditions are a bounded AST such as:

```text
all/any/not
  comparison(field, operator, value)
  membership(field, set)
  time-window(start, end)
  scope-descendant(resource, ancestor)
```

The evaluator has no arbitrary code execution, SQL interpolation, filesystem access, network access, or dynamic module loading.

## Cross-service contracts

### Identity
Consumes trusted `PrincipalContext` and actor/effective-subject attribution. IAM never trusts a client-supplied principal header.

### Tenant
Uses explicit tenant/context queries/events only. Tenant owns tenant lifecycle; IAM owns authorization semantics.

### Audit
Publishes authorization-sensitive administrative events through the outbox/event contract. Audit remains independent.

### Domain services
Domain services call IAM through `check/require` contracts. They do not import IAM repositories or policy internals.

## Events

Minimum events:

- `iam.role.created.v1`
- `iam.role.updated.v1`
- `iam.role.deleted.v1`
- `iam.grant.created.v1`
- `iam.grant.revoked.v1`
- `iam.policy.created.v1`
- `iam.policy.updated.v1`
- `iam.policy.published.v1`
- `iam.policy.disabled.v1`
- `iam.permission.catalog.updated.v1`

Events contain standard event metadata and never contain secrets.

## Consumers and jobs

Consumer:
- Invalidate authorization caches after relevant policy/role/grant changes.
- Process tenant/resource invalidation events.

Worker:
- Expire time-bounded grants.
- Compact eligible decision records according to retention.
- Rebuild affected derived cache state.

Scheduler:
- Trigger bounded expiry/maintenance batches.

All work is idempotent and resumable.

## Security

- Deny by default.
- Tenant isolation is mandatory.
- Administrative mutations require IAM administrative permissions and appropriate Identity assurance.
- Permission keys cannot be changed silently.
- Policies cannot execute code.
- Cache failures fall back to authoritative evaluation.
- Stale policy versions fail closed where freshness cannot be proven.
- Delegation context retains actor and effective subject.

## Failure behavior

- Missing/invalid principal context: deny.
- Missing tenant context where required: deny.
- Unknown action/resource: deny.
- Policy evaluation error: deny and emit operational telemetry.
- Cache unavailable: evaluate against authoritative storage.
- Tenant dependency unavailable for a required validation: return dependency error or deny according to endpoint semantics; never allow by default.
- Duplicate event: no-op after idempotency check.

## Observability

Metrics:

- authorization checks/sec
- allow/deny rate
- decision latency p50/p95/p99
- policy evaluation errors
- cache hit/miss
- cache invalidation lag
- stale-version rejects
- administrative mutation failures

OTel spans must exclude credentials and sensitive policy values. Correlation, causation, and tenant context are propagated according to platform standards.

## Testing

Unit:
- deny precedence
- role inheritance/scope
- ABAC conditions
- expiry
- policy versioning
- delegation attribution

Property:
- no policy combination can turn an explicit deny into allow.
- missing required context never yields allow.

Integration:
- database transactions
- concurrent role/policy updates
- cache invalidation
- NATS duplicate delivery
- Tenant context validation
- Identity `PrincipalContext` compatibility

Security:
- tenant escape
- forged principal context
- forged tenant context
- policy injection
- arbitrary-code condition attempts
- stale-cache privilege retention
- delegation escalation

Load:
- high-volume authorization checks
- concurrent policy publication
- cache cold-start behavior

## Definition of done

IAM is production-ready only when every action/resource pair is catalogued, every endpoint has a complete contract, every mutation has transactional outbox behavior, policy evaluation is deterministic and bounded, tenant isolation is tested, stale authorization cannot become an allow, and no Clerk/Supabase/Identity provider authorization concept is used as the source of truth.