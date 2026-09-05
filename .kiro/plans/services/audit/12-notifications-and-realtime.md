---
status: canonical
document: service-notifications-realtime
service: audit
version: v1
---
# Audit Service — Notifications and Realtime Contract

Audit emits communication requests only for governance/operational outcomes; Notifications owns provider delivery and templates.

## Notification catalog
- `audit.export.completed.v1`: requestor notification with export reference, expiry and classification.
- `audit.export.failed.v1`: requestor/operations failure notice with sanitized reason.
- `audit.integrity_check.failed.v1`: high-priority security/governance notification to configured security administrators/on-call route.
- `audit.integrity_check.completed_with_findings.v1`: security/governance notice with finding counts/references, not raw sensitive records.
- `audit.legal_hold.created.v1`: governance administrator confirmation.
- `audit.legal_hold.released.v1`: governance administrator confirmation.
- `audit.retention.changed.v1`: compliance/security administrator change notice.
- `audit.ingestion.quarantine_threshold.v1`: operational/security notification when rejected/quarantined source events exceed configured threshold.
- `audit.archive.failure.v1`: operations alert through Notifications routing.

Requests contain tenant/recipient/locale where relevant, actor/requestor, correlation/causation, idempotency key, priority, sensitivity, expiry and safe references. Audit records or secrets are never copied wholesale into email/Slack/push payloads.

## Realtime channels
- `tenant:{tenantId}:audit-admin`
- `principal:{principalId}:audit-exports`
- `tenant:{tenantId}:audit-integrity`

Realtime emits safe status/progress summaries for exports, integrity checks, legal holds and ingestion health. It does not stream arbitrary audit-record payloads by default.

## Authorization
Every subscription requires authenticated PrincipalContext and explicit IAM permission such as audit read/export/integrity administration at the tenant/resource scope. Mid-session IAM or tenant invalidation terminates/revalidates the subscription.

## Delivery semantics
Realtime is best-effort and revision/progress-sequenced. Canonical API remains source of truth. Clients re-query after reconnect. Export URLs, when used, are short-lived signed references issued only after authorization and never broadcast to shared channels.

## Tests
Verify trigger/dedupe/recipient/sensitivity behavior, no raw record leakage, export-link authorization/expiry, unauthorized realtime subscription, tenant isolation, mid-connection revocation, reconnect/catch-up and out-of-order progress events.