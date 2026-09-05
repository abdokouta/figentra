---
status: canonical
document: service-notifications-realtime
service: tenant
version: v1
---
# Tenant Service — Notifications and Realtime Contract

Tenant emits typed communication requests; Notifications owns email/SMS/push/in-app/Slack provider delivery, templates, suppression and retry.

## Notification catalog
- `tenant.created.v1`: tenant owner/admin onboarding communication.
- `tenant.activated.v1`: activation completion.
- `tenant.suspended.v1`: mandatory administrative/security notice with reason category and effective time.
- `tenant.archived.v1`: archive confirmation and data-lifecycle summary.
- `tenant.membership.invited.v1`: membership invitation with one-time action reference and expiry.
- `tenant.membership.added.v1`: membership confirmation.
- `tenant.membership.removed.v1`: access removal notice where policy requires.
- `tenant.domain.verification.requested.v1`: DNS/verification instruction payload.
- `tenant.domain.verified.v1`: verification success.
- `tenant.domain.failed.v1`: failure/retry guidance.
- `tenant.settings.security_changed.v1`: security-sensitive setting change notice.

Requests include tenant branding, locale, recipient principal/destination reference, actor attribution, correlation/causation, idempotency key, priority, expiry and sensitivity. Invitation/verification secret material is represented by bounded one-time action references and never logged.

## Realtime channels
- `tenant:{tenantId}:lifecycle`
- `tenant:{tenantId}:memberships`
- `tenant:{tenantId}:domains`
- `tenant:{tenantId}:settings`
- `principal:{principalId}:tenants`

Realtime events publish safe summaries of lifecycle, membership, domain and settings revisions. Subscription requires authenticated principal plus IAM authorization for the exact tenant/resource; self membership channel access does not grant administrative visibility.

## Correctness
Realtime is a presentation hint, never authoritative state. Every event includes aggregate/revision or context version. Clients recover via API after reconnect and discard stale versions. Mid-connection tenant suspension, membership removal, delegation change or IAM invalidation triggers subscription reauthorization/termination.

## Runtime controls
Connection/fan-out limits, heartbeat, idle timeout, max subscriptions per connection, event payload cap, backpressure, reconnect jitter and authorization-cache TTL are typed settings.

## Tests
Test every notification trigger/template-variable/dedupe/localization/branding/security rule and realtime tenant isolation, unauthorized joins, membership removal while connected, reconnect/catch-up, out-of-order revisions and saturation.