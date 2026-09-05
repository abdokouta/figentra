---
status: canonical
document: service-notifications-realtime
service: iam
version: v1
---
# IAM Service — Notifications and Realtime Contract

IAM emits communication requests only for authorization/security administration; Notifications owns delivery providers/templates/state.

## Notification requests
- `iam.role.assignment.changed.v1`: role assigned/revoked; in-app/email when tenant policy requires; variables principal/resource/role summary and actor attribution.
- `iam.privileged.grant.created.v1`: high-privilege grant; email + in-app to affected principal and configured tenant security administrators.
- `iam.privileged.grant.revoked.v1`: high-privilege revocation; in-app/email.
- `iam.policy.published.v1`: policy publication notification to configured security administrators; includes policy key/version, actor and scope, never executable/raw secret data.
- `iam.policy.disabled.v1`: security administrator notification.
- `iam.authorization.anomaly.v1`: operational/security notification through Notifications routing (for example Slack/email/on-call destination configured centrally), with bounded sanitized context.

All requests include notification key/version, recipient principal/group resolution input, tenant/branding/locale, correlation/causation, actor, idempotency key, priority, sensitivity and expiry. Critical security notifications cannot be suppressed by marketing preferences.

## Realtime
Canonical channels:
- `tenant:{tenantId}:iam-admin`
- `principal:{principalId}:authorization`
- `tenant:{tenantId}:authorization-model`

Realtime events: role/grant changes affecting current principal, policy/model version changes, permission catalog version changes, and administrative status changes. Realtime never broadcasts full policy internals when the subscriber lacks policy-read permission.

Subscriptions require authenticated PrincipalContext and IAM authorization; IAM cannot use the realtime subscription itself as proof of continuing permission. Active subscriptions are revalidated/terminated on grant/policy/tenant/delegation changes. Clients treat realtime as hints and re-query authoritative APIs.

## Reliability/security
Realtime delivery is best-effort with entity/model versions for stale rejection. Fan-out, connection limits, heartbeat, idle timeout, backpressure, reconnect jitter and catch-up API behavior are explicit runtime settings. No authorization decision is made solely from a client-received realtime event.

## Tests
Tests cover every notification trigger/dedupe/suppression rule, privileged data redaction, unauthorized channel subscription, mid-connection privilege revocation, tenant isolation, reconnect/out-of-order handling and model-version catch-up.