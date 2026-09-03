# 03 — IAM

**Status: APPROVED FOUNDATION; DETAILED DESIGN PENDING**

## Purpose

IAM determines whether a Principal can perform an action against a resource in a
context.

```text
authorize(
  principal,
  action,
  resource,
  tenant,
  scope,
  context
)
```

## IAM owns

```text
permissions
roles
role_permissions
principal_role_assignments
grants
policies
policy_bindings
delegations
authorization decisions
```

## Permission

Capability name:

```text
orders.read
orders.create
orders.refund
inventory.adjust
```

Do not encode scope IDs into permission names.

## Roles

Role is a permission bundle.

```text
warehouse_manager
  ├── inventory.read
  ├── inventory.adjust
  └── inventory.transfer
```

Roles are not identities.

## Assignment

```text
Principal
   ↓
Role Assignment
   ↓
Scope / Context
```

Exact inheritance is pending Scope design.

## Direct grants

Support direct grants only where justified.

Avoid creating arbitrary permission sprawl.

## Policies

Policies can add conditions based on:

- principal attributes
- resource attributes
- scope
- tenant
- amount
- time
- risk
- ownership
- environment

## Deny semantics

Explicit deny behavior must be designed and tested before policy implementation.

## Decision

Minimum:

```text
allow
deny
require_approval
```

Potentially:

```text
allow + obligations
```

## Resource authorization

Prefer:

```text
authorize(
 principal,
 "orders.refund",
 resource=order_123,
 context
)
```

over:

```text
hasPermission(principal, "refund")
```

## Batch authorization

Required for list/table pages to avoid N+1 calls.

```text
batchAuthorize([...])
```

## Explainability

Administrative tooling can expose:

- decision
- matched role
- grant
- policy
- scope
- obligations

Do not leak sensitive policy internals to untrusted clients.

## Entitlement boundary

```text
Permission = may perform
Entitlement = capability purchased/enabled
```

IAM can consume entitlement state but should not own billing.

## Approval boundary

```text
IAM permission
    ↓
Policy
    ↓
Approval requirement
    ↓
Approval service
    ↓
Execution
```

## Cache

Potential:

```text
L1 local
L2 distributed
L3 authoritative IAM state
```

Cache keys must include relevant context and policy/version state.

Emergency revocation must invalidate relevant cached decisions.

## Latency targets

Engineering target:

- cached: sub-ms to low ms
- remote: low tens of ms or better
- batch: optimized to avoid repeated policy evaluation

## Conceptual schema

```text
permissions
roles
role_permissions
principal_roles
grants
policies
policy_bindings
delegations
```

## Policy engine candidates

Evaluate:

- Cedar
- OPA/Rego
- CEL
- Zanzibar-style relationships

Do not choose based on popularity alone.

The decision must account for dynamic Scope, resource conditions, performance,
policy lifecycle and explainability.
