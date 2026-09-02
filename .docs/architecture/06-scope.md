# 06 — Dynamic Scope

**Status: DESIGN PENDING**

## Goal

Represent application-defined business context without hard-coded hierarchy.

Examples:

```text
Tenant → Organization → Team
Tenant → Organization → Branch → Warehouse
Tenant → Region → Venue → Building → Floor → Zone
```

## Direction

Potential model:

```text
ScopeType
ScopeNode
ScopeRelation
ScopeMembership
ScopeContext
```

## Requirements

- dynamic types
- dynamic relations
- parent/child
- graph where necessary
- membership
- inheritance
- traversal
- authorization context
- resource association
- lifecycle
- caching
- versioning

## Critical distinction

Scope describes **where/context**.

IAM describes **what a principal can do**.

They interact but are not the same subsystem.

## Existing Scope package

Existing implementation is reference material only.
