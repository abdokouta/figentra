---
status: canonical
document: service-notifications-realtime
service: integrations
version: v1
---
# Integrations Service — Notifications and Realtime Contract

Integrations emits typed communication requests for connection, sync and provider-operational outcomes. Notifications owns provider delivery/templates/state; Integrations never sends email/SMS/push/Slack directly.

## Notification catalog
- `integrations.connection.authorized.v1`: tenant admin confirmation.
- `integrations.connection.authorization_expiring.v1`: advance notice when provider authorization/credential needs renewal.
- `integrations.connection.failed.v1`: tenant admin notice with sanitized reason/category.
- `integrations.connection.revoked.v1`: mandatory admin/security notice.
- `integrations.sync.completed.v1`: optional tenant operational notice for manual/high-value sync.
- `integrations.sync.failed.v1`: tenant admin/operations alert after configured retry exhaustion.
- `integrations.reconciliation.findings.v1`: admin notice with counts/references, not full external payload.
- `integrations.webhook.signature_failures.v1`: security/operations alert when threshold exceeded.
- `integrations.provider.degraded.v1`: operations/on-call notification through Notifications routing.
- `integrations.mapping.invalid.v1`: configuration owner notification.

Requests include tenant/connection/provider IDs, safe provider display name, actor/requestor, branding/locale, correlation/causation, idempotency, priority, sensitivity and action references when remediation is required. Tokens/API keys/provider raw payloads are forbidden.

## Realtime channels
- `tenant:{tenantId}:integrations`
- `tenant:{tenantId}:integration:{connectionId}`
- `principal:{principalId}:integration-actions`

Events: connection status/authorization state, sync progress/result, reconciliation progress/findings summary, provider health summary and mapping revision. Provider payloads and secrets are not broadcast.

## Subscription authorization
Authenticated PrincipalContext + IAM permission is mandatory per tenant/connection. Connection-specific resources are checked through IAM/resource context. Tenant suspension, membership removal, IAM revocation or connection revocation triggers reauthorization/termination.

## Delivery semantics
Realtime is best-effort status, not authoritative sync state. Events carry connection/job revision/sequence. Clients recover by API query. Bounded fan-out, heartbeat, idle timeout, subscription count, payload limit, backpressure and reconnect jitter are configured.

## Tests
Test every notification trigger/dedupe/escalation/redaction and realtime tenant isolation, unauthorized connection subscription, mid-session revocation, sync progress ordering, reconnect/catch-up, provider payload exclusion and saturation.