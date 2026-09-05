# Audit Service — API Contract

All endpoints are `/v1`, JSON, authenticated by Identity and authorized by IAM. Tenant scope is mandatory for tenant data. Audit records are immutable.

`GET /v1/audit` — filtered/paginated records by tenant, actor, effective subject, action, resource, time, outcome and correlation ID.

`GET /v1/audit/:id` — retrieve one immutable record if authorized.

`POST /v1/audit/exports` — create an asynchronous export with filter, format and destination policy.

`GET /v1/audit/exports/:id` — export status and safe download/reference metadata.

`POST /v1/audit/integrity-checks` and `GET /v1/audit/integrity-checks/:id` — run/retrieve hash-chain verification.

`GET/PUT /v1/audit/retention` — read/update authorized tenant retention policy.

`GET/POST /v1/audit/legal-holds`; `POST /v1/audit/legal-holds/:id/release` — manage legal holds.

Errors: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `AUDIT_NOT_FOUND`, `EXPORT_NOT_FOUND`, `INTEGRITY_CHECK_FAILED`, `RETENTION_INVALID`, `LEGAL_HOLD_CONFLICT`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`.

Exports are asynchronous, bounded, access-controlled and produce immutable evidence of export creation/completion. API never permits update/delete of an AuditRecord.