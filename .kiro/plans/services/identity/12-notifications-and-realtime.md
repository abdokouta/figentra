---
status: canonical
document: service-notifications-realtime
service: identity
version: v1
---
# Identity Service — Notifications and Realtime Contract

## 1. Ownership rule
Identity decides **when** identity-related communication is required and emits typed notification requests. The Notifications service owns template rendering, provider selection, delivery, retry, suppression, provider credentials and delivery state. Identity never calls SMTP, SES, SendGrid, Twilio, APNs, FCM or Slack provider SDKs directly.

## 2. Notification request catalog

| Key | Trigger | Default channels | Required variables | Security |
|---|---|---|---|---|
| `identity.account.created.v1` | principal account completed | email + in-app | displayName, applicationName | no credentials |
| `identity.email.verify.v1` | provider verification required | email | verificationActionRef, expiresAt | one-time action reference only |
| `identity.password.reset.v1` | recovery initiated | email | recoveryActionRef, expiresAt | never include password/token in logs/events |
| `identity.session.new.v1` | high-value new session | email + in-app | deviceSummary, approximateLocation, occurredAt | risk notification |
| `identity.session.revoked.v1` | session revoked | in-app + email when risk policy requires | sessionSummary, reason | security-sensitive |
| `identity.session.family_revoked.v1` | replay/credential compromise | email + in-app | occurredAt, reason | high priority |
| `identity.mfa.changed.v1` | MFA enrollment/removal | email + in-app | factorType, occurredAt | high priority |
| `identity.identity.linked.v1` | external identity linked | email + in-app | provider, occurredAt | security-sensitive |
| `identity.identity.unlinked.v1` | external identity unlinked | email + in-app | provider, occurredAt | security-sensitive |
| `identity.delegation.started.v1` | delegation/impersonation activated | in-app | actorDisplay, expiresAt | auditable |
| `identity.delegation.ended.v1` | delegation ended/revoked | in-app | occurredAt | auditable |
| `identity.service_identity.credential_rotated.v1` | machine credential rotation | webhook/Slack operational route via Notifications | serviceIdentityName, occurredAt | no secret value |

Every request includes tenant/branding context when applicable, locale, recipient principal ID or explicit verified destination reference, correlation/causation IDs, idempotency key, priority, expiry, and sensitivity classification. Notification content must never include raw access tokens, refresh tokens, passwords, MFA secrets, private keys or credential values.

## 3. Suppression and deduplication
Security-critical notifications cannot be disabled by ordinary marketing preferences. Duplicate requests use deterministic keys such as `<notification-key>:<principalId>:<securityEventId>`. Recovery/verification actions expire and cannot be reused.

## 4. Realtime domain
Identity exposes only safe realtime facts. Canonical channels:
- `principal:{principalId}:identity`
- `principal:{principalId}:sessions`
- `tenant:{tenantId}:identity-admin` for authorized administrators

Realtime events include session-created/revoked, identity-linked/unlinked, delegation-started/ended, and security-state-changed summaries. Tokens, provider claims, IP addresses beyond approved risk summaries and secrets are excluded.

## 5. Realtime authorization
Connection authentication resolves `PrincipalContext` through Identity. Subscription authorization is enforced through IAM before channel join. A principal may subscribe to self channels; tenant administration channels require explicit IAM permission. Reauthorization occurs on token refresh, tenant change, delegation change and permission-invalidating events.

## 6. Delivery semantics
Realtime is best-effort presentation, never the source of truth. Clients recover by querying canonical APIs after reconnect. Events contain monotonic entity version/revision where applicable for stale-event rejection. Server applies bounded fan-out, backpressure, connection limits, heartbeat, idle timeout and reconnect guidance.

## 7. Testing
Tests cover every notification trigger, template-variable contract, locale/branding handoff, deduplication, security suppression rules, forbidden-secret scanning, realtime authentication, unauthorized subscription, reconnect, duplicate/out-of-order events, backpressure and revocation while connected.