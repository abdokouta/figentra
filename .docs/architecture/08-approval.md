# 08 — Approval

**Status: DESIGN PENDING**

Approval is distinct from permission.

```text
Permission
  ↓
Policy
  ↓
Approval required
  ↓
Approval
  ↓
Execution
```

Potential concepts:

- approval request
- step
- approver
- quorum
- rejection
- expiry
- escalation
- delegation
- comments/reason
- audit

Approval must be durable and idempotent.
