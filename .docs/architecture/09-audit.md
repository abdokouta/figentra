# 09 — Audit

**Status: DESIGN PENDING**

Audit is an append-oriented security/business record.

Record, where applicable:

```text
principal
effective_principal
tenant
scope
action
resource
decision
before
after
reason
approval
request_id
correlation_id
trace_id
timestamp
```

Audit records must not depend on mutable application state to remain meaningful.

Retention and privacy rules require explicit policy.
