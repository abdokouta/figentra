# 07 — Policy

**Status: DESIGN PENDING**

## Purpose

Policy evaluates contextual authorization conditions.

Inputs may include:

```text
principal
action
resource
tenant
scope
resource attributes
context
time
risk
amount
```

## Candidate engines

Cedar OPA/Rego CEL Zanzibar-style relationships

## Requirements

- versioning
- testing
- deterministic evaluation
- explainability
- safe deployment
- rollback
- caching compatibility
- policy simulation
- least privilege

Policy language must not become application business logic.
