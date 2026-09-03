---
status: canonical
component: service
service: iam
version: v1
runtime: nestjs
---
# IAM Service — implementation-complete plan

## Mission
IAM is the authorization control plane. It answers whether a principal may perform an action on a resource in a tenant/context. It owns roles, permissions, policies, grants, resource hierarchies, authorization evaluation and authorization decision audit hooks. Identity authenticates and resolves principals; Tenant owns tenant lifecycle; Monetization owns commercial entitlement.

## Modules
`authorization`, `roles`, `permissions`, `policies`, `grants`, `resource-context`, `decision-cache`, `administration`, `events`, `persistence`.

## Models
- `Role(id,tenantId,name,key,description,status,version,createdAt,updatedAt)`
- `Permission(id,key,action,resource,description)`
- `Policy(id,tenantId,effect,principalSelector,actionSelector,resourceSelector,conditions,priority,version)`
- `Grant(id,tenantId,principalId,roleId,resourceType,resourceId,expiresAt)`
- `AuthorizationDecision(id,tenantId,principalId,action,resource,result,policyVersion,reasonCode,createdAt)` for sampled/required decision records, not general logs.
Relations: Tenant→Roles/Policies/Grants; Role↔Permission; Principal→Grant; Grant→resource reference. No foreign database references to Identity tables.

## DTOs
`CreateRoleDto`, `UpdateRoleDto`, `AssignRoleDto`, `CreatePolicyDto`, `UpdatePolicyDto`, `AuthorizationCheckDto`, `AuthorizationDecisionDto`, `ListRolesQuery`, `ListPoliciesQuery`. All are Standard Schema validated, tenant-aware and bounded.

## Public interfaces
```ts
interface AuthorizationService { check(ctx:RequestContext, request:AuthorizationRequest):Promise<AuthorizationDecision>; require(...):Promise<void>; }
interface RoleService { create(ctx,input):Promise<Role>; update(ctx,id,input):Promise<Role>; assign(ctx,input):Promise<Grant>; revoke(ctx,id):Promise<void>; }
interface PolicyEvaluator { evaluate(input:EvaluationInput):Promise<EvaluationResult>; }
```
`check` is fail-closed on missing tenant/resource context. `require` throws canonical authorization error on deny.

## Controllers
`GET/POST/PATCH/DELETE /v1/roles`; `GET/POST/PATCH/DELETE /v1/policies`; `POST /v1/grants`; `DELETE /v1/grants/:id`; `POST /v1/authorization/check`; `GET /v1/permissions`. Mutations require IAM administration permissions. Authorization check endpoint is authenticated and rate limited.

## Identity/Tenant calls
Every inbound request receives Identity-resolved `principalId`, `principalType`, authentication assurance and tenant context. IAM does not call Identity for every local decision; it trusts the signed internal RequestContext established by the service boundary and calls Identity only for explicit principal/identity-link administration. Tenant calls are used for tenant existence/status and context validation when required. Gateway authentication is never the sole authorization check.

## Decision algorithm
Normalize principal, tenant, resource and action; load grants/policies; evaluate explicit deny before allow; apply conditions; enforce expiry; return reason code and policy version. Decisions are deterministic. Policy updates invalidate decision cache by tenant/policy version.

## Persistence
PostgreSQL tables: `roles`, `permissions`, `role_permissions`, `policies`, `grants`, `authorization_decisions`, `outbox`. Unique constraints cover `(tenant_id,key)`, `(role_id,permission_id)` and active grant uniqueness. Index tenant/action/resource/principal selectors. Migrations use expand/contract.

## Worker roles
NestJS `consumer` processes policy/role invalidation events; `worker` compacts expired grants/decision records; `scheduler` runs bounded cleanup. No mirrored standalone IAM worker application.

## Security
Deny-by-default, tenant isolation, least privilege, immutable permission keys, administrative MFA/assurance requirements delegated to Identity policy, bounded policy expressions and no arbitrary code execution in conditions.

## Reliability/observability
Decision latency, deny rate, policy evaluation errors, cache hit rate, stale-policy rejects and dependency failures are metrics. Traces propagate request/correlation/causation IDs. Audit-sensitive mutations emit contracts to Audit after commit. Cache outage causes database evaluation, not allow-by-default.

## Testing
Unit policy matrices; property tests for deny precedence; tenant isolation; expiry; cache invalidation; controller auth; concurrent role updates; contract tests with Identity/Tenant; migration tests; NATS duplicate delivery; authorization decision load tests.

## Completion gate
Every action/resource pair is catalogued, every endpoint has DTO/schema/error/security rules, every mutation has migration/outbox behavior, and no `scope-client`, `policy-service`, or `approval-service` dependency exists. Scope is a request/tenant context, policy is an IAM mechanism, approval is Workflow.