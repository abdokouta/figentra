---
status: canonical
document: service-data-lifecycle
service: iam
version: v1
---
# IAM Service — Data Lifecycle Contract

Roles, policies and grants are tenant-scoped authoritative authorization data. Published permission keys are immutable. Role/policy updates create new versions; publication changes the active model version atomically with outbox events and cache invalidation.

Grant lifecycle: `active -> revoked|expired`; revoked/expired grants never reactivate. Expiry is enforced at evaluation time even before background cleanup. Historical mutation metadata is retained according to governance policy; Audit owns long-term governance evidence.

Policy lifecycle: `draft -> published -> disabled|superseded`. A published version is immutable; editing creates a new draft/version. Disabled policies cannot authorize. Explicit deny semantics remain preserved in historical versions.

Permission catalog lifecycle is migration/bootstrap controlled. Keys are never reused for a different semantic meaning. Deprecated keys remain resolvable during compatibility window and are removed only after dependency/Registry telemetry confirms no consumers.

Authorization decision records, when persisted, are bounded operational/audit-support data with configured retention/partitioning; they do not replace Audit. Sensitive context is minimized/hashed where possible.

Tenant archive/deletion triggers idempotent authorization-data lifecycle workflow: revoke active grants, disable tenant policies/roles according to policy, purge derived caches, archive/delete eligible authoritative rows only after legal/retention checks. Cross-service resource IDs remain opaque.

Backups must restore model versions consistently with roles/policies/grants/outbox. Restore verification rebuilds/clears Redis derived caches and validates permission catalog/model integrity before traffic.

Tests cover concurrent publish/revoke/expire, stale cache after lifecycle changes, tenant purge, policy supersession, catalog deprecation, backup restore and prevention of resurrecting expired/revoked authorization.