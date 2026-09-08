# Agent Engineering Governance

## Authority classes

| Class | Examples | Agent authority |
|---|---|---|
| Advisory | company strategy, product direction, major architecture alternatives | propose/analyze |
| Delegated engineering | source changes, tests, documentation, non-destructive local tooling | execute within scope |
| Controlled change | shared contracts, RBAC, production configuration, migrations | execute only under applicable approval policy |
| Human-reserved | company governance, legal commitments, irreversible destructive operations, secret rotation unless explicitly delegated | no independent authority |

## Approval model

```text
Agent proposes
   ↓
Policy evaluation
   ↓
Automatic gate OR human approval
   ↓
Controlled execution
   ↓
Verification
   ↓
Audit/provenance record
```

## Required escalation information

When escalation is required, record:

1. intended action;
2. blast radius;
3. data/environment affected;
4. reversal or rollback path;
5. evidence already collected;
6. exact approval required.

## Agent lifecycle

```text
Proposed → Reviewed → Active → Suspended → Retired
```

An agent's identity, authority and scope are versioned. Retired agents remain attributable in historical records.

## Change governance

Changing the canonical roster, authority model, source-of-truth hierarchy, security policy or escalation rules is a governance change. It requires the appropriate human governance authority and an auditable decision record.

## Production gates

Production-impacting changes must have, as applicable:

- architecture evidence;
- test evidence;
- security evidence;
- migration evidence;
- observability evidence;
- deployment plan;
- rollback plan;
- health/readiness evidence;
- operational owner;
- runbook;
- approval record.
