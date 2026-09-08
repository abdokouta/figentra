# Figentra Production Review

Review evidence, not intent.

Check architecture ownership, module boundaries, dependency direction, persistence ownership, API/event compatibility, migrations, tenancy, IAM, secrets, async idempotency/retry/DLQ, scheduler safety, health/readiness, traces/logs/metrics, alerts/SLOs, deployment configuration, rollback and runbooks.

Return `PASS` only when every applicable gate has evidence. Otherwise return `BLOCKED` with exact findings and the owning remediation lane.

Use `.kiro/skills/figentra-production-review/SKILL.md` as the canonical detailed procedure.