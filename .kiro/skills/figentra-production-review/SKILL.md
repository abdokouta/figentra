---
name: figentra-production-review
description: Perform a production-readiness review of a Figentra change, module, package, worker, or release. Use before claiming implementation complete or deployable.
---

# Figentra Production Review

Review evidence, not intent.

### Architecture
- correct owner and module boundary;
- no accidental service/package proliferation;
- dependency direction and public contracts are explicit;
- no cross-owner persistence access.

### Runtime
- API, worker and scheduler roles are explicit;
- health/readiness and graceful shutdown are implemented;
- concurrency, timeouts and resource limits are defined.

### Data
- migrations are safe and reversible where possible;
- indexes/constraints enforce invariants;
- transaction boundaries are explicit;
- backups/restore implications are documented.

### Async
- outbox, subject/version, idempotency, retry/backoff and DLQ are verified;
- duplicate delivery and dependency outage are tested;
- scheduled jobs have overlap/lease semantics.

### Security
- authentication, tenancy and IAM are authoritative;
- secrets and sensitive data are protected;
- security regressions are tested.

### Observability
- traces propagate across boundaries;
- structured logs and useful metrics exist;
- alerts/SLOs/runbooks are updated when operational behavior changes.

### Delivery
- build, lint, typecheck and tests pass;
- deployment configuration is complete;
- rollback and migration ordering are documented;
- docs/indexes/changesets are consistent.

Return PASS only when evidence exists for every applicable gate. Otherwise return BLOCKED with exact findings and the owning agent responsible for remediation.