---
status: canonical
document: service-architecture
service: iam
version: v1
runtime: nestjs
---
# IAM Service — Architecture Contract

## Mission

IAM is the **authorization control plane** owned entirely by Figentra. It answers: **may this principal perform this action on this resource, within this tenant and scope, under the current policy context?**

IAM owns authorization semantics. It does not authenticate users and does not become a proxy for Supabase, Clerk, or any identity provider.

## Ownership

IAM is authoritative for:

- Roles.
- Permissions.
- Role-permission assignments.
- Grants.
- Policies.
- Policy versions.
- Resource/action authorization vocabulary.
- Resource scopes and hierarchical authorization context.
- Authorization evaluation.
- Authorization decision reason codes.
- Authorization administration and audit hooks.

Identity is authoritative for Principal authentication/identity. Tenant is authoritative for tenant lifecycle. Monetization is authoritative for commercial entitlement.

## Canonical request model

```text
PrincipalContext
   +
AuthorizationRequest
   +
Tenant/Resource Context
   |
   v
IAM policy engine
   |
   +--> explicit deny
   +--> grants / roles
   +--> policy conditions
   +--> resource scope
   +--> expiry
   |
   v
AuthorizationDecision
```

The result is deterministic, deny-by-default, and versioned.

## Multi-tenant hierarchy

Figentra business resources may form hierarchies such as:

```text
Tenant
  -> Organization
    -> Store
      -> Region
        -> Venue
          -> Resource
```

IAM does not own the business resource records. It stores opaque resource references and evaluates scope relationships supplied by the platform's resource-context contracts.

## Authorization model

The day-one model supports:

- RBAC for reusable role assignments.
- ABAC/policy conditions for contextual decisions.
- Explicit deny precedence.
- Resource-level grants.
- Hierarchical scope.
- Time-bounded grants.
- Delegated actor/subject context from Identity.
- Policy versioning.
- Decision reason codes.

Policy expressions are constrained and typed. Arbitrary JavaScript, SQL, network access, dynamic imports, or executable policy code are forbidden.

## Trust boundary

IAM trusts only an authenticated, integrity-protected `PrincipalContext` established by the service boundary. A client cannot choose its own principal, tenant, role, permission, or decision.

IAM may call Tenant for explicit tenant status/context validation but does not import Tenant implementation or persistence. IAM does not call Identity for every authorization decision; identity resolution occurs before the decision boundary.

## Cache

Authorization decision caching is an optimization only. Cache failure or staleness must never result in allow-by-default. Policy versioning and targeted invalidation prevent stale authorization decisions from surviving a policy change.

## Events

IAM publishes versioned events for role, policy, grant, and permission changes. It consumes relevant tenant/resource-context invalidation signals. Authorization decisions may produce durable audit hooks without turning IAM into a general logging service.

## Runtime

One NestJS source tree exposes `api`, `consumer`, `worker`, and `scheduler` roles. No independent IAM worker application is created.

## Non-goals

IAM does not own:

- Authentication.
- Sessions.
- Passwords.
- Provider accounts.
- Tenant lifecycle.
- Billing/entitlements.
- Business resource CRUD.
- Generic logs.
- Analytics.
- Workflow approvals.

## Acceptance

IAM is accepted only when all authorization paths are fail-closed, every permission/action/resource vocabulary is explicit, tenant isolation is enforced, policy evaluation is deterministic, administrative mutations are auditable, and no provider-specific authorization model leaks into Figentra.