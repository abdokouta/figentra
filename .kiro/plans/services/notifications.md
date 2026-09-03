---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: notifications
version: v1
runtime: nestjs
anchor_adrs: [ADR-0013, ADR-0020, ADR-0024]
---
# Notifications Service — implementation plan

## Mission and boundary
Notifications owns durable communication delivery. Channels include email, SMS, push and other approved providers. It owns templates, template versions, recipient preferences, suppression, scheduling, delivery attempts, provider adapters, retry/DLQ and delivery status. Marketing owns campaigns/audiences. Analytics owns analytical processing. Audit owns durable audit records.

## Source tree
```text
services/notifications/src/
├── modules/{notifications,templates,preferences,suppressions,delivery,providers,scheduling,reconciliation}
├── application/{commands,queries,services}
├── domain/{entities,value-objects,policies}
├── infrastructure/{database,nats,cache,storage,config}
├── presentation/{http,openapi,webhooks}
├── workers/{delivery,reconciliation}
├── database/{entities,migrations}
└── main.ts
```

## Models
`Notification(id,tenantId,recipientRef,channel,templateKey,templateVersion,payloadRef,status,idempotencyKey,scheduledAt,createdAt,updatedAt)`
`Template(id,tenantId,key,locale,status,currentVersion)`
`TemplateVersion(id,templateId,version,subject,body,variablesSchema,createdAt)`
`Preference(id,tenantId,recipientRef,channel,topic,enabled,updatedAt)`
`Suppression(id,tenantId,recipientRef,channel,reason,expiresAt)`
`DeliveryAttempt(id,notificationId,provider,operationKey,attempt,status,providerMessageId,errorCode,nextAttemptAt,startedAt,completedAt)`
`ProviderEvent(id,provider,eventId,type,receivedAt,payloadHash,processedAt,status)`

## Public API
```ts
interface NotificationService {
  send(ctx:RequestContext,input:SendNotificationInput):Promise<NotificationView>;
  sendBatch(ctx:RequestContext,input:BatchNotificationInput):Promise<BatchResult>;
  schedule(ctx:RequestContext,input:ScheduleNotificationInput):Promise<NotificationView>;
  cancel(ctx:RequestContext,id:string):Promise<void>;
  status(ctx:RequestContext,id:string):Promise<DeliveryStatus>;
}
interface ChannelProvider {
  send(message:ProviderMessage):Promise<ProviderReceipt>;
  verifyWebhook(input:unknown,signature:string):Promise<VerifiedProviderEvent>;
}
```
DTOs: `SendNotificationDto`, `BatchNotificationDto`, `ScheduleNotificationDto`, `CancelNotificationDto`, `CreateTemplateDto`, `UpdateTemplateDto`, `PreferenceDto`, `DeliveryStatusQueryDto`, `ProviderWebhookDto`.

## HTTP controllers
```text
POST   /v1/notifications
POST   /v1/notifications/batch
GET    /v1/notifications/:id
POST   /v1/notifications/:id/cancel
GET    /v1/preferences
PUT    /v1/preferences
GET    /v1/templates
POST   /v1/templates
GET    /v1/templates/:id
POST   /v1/templates/:id/versions
GET    /v1/delivery/:id
POST   /v1/webhooks/:provider
```

Management endpoints are Identity-authenticated and IAM-authorized. Provider webhook endpoints authenticate with provider signature verification rather than end-user identity.

## Delivery flow
```text
request/event
 → validate tenant + recipient + channel
 → evaluate preference/suppression
 → resolve approved template version
 → persist Notification + idempotency key
 → outbox commit
 → NATS consumer
 → bounded provider delivery worker
 → persist DeliveryAttempt/receipt
 → optional provider webhook reconciliation
 → final status event
```

No notification is sent before durable acceptance. Provider retries are controlled by operation key and channel policy. Duplicate transport delivery cannot create duplicate external sends when the provider supports idempotency; otherwise the adapter must implement the documented safe-deduplication strategy.

## Template engine
Templates are versioned and locale-aware. Variable schemas are validated before rendering. Missing required variables are terminal validation errors. Templates cannot execute arbitrary code, access filesystem/network resources or interpolate secrets outside explicit secret references.

## Consent/suppression
Preference and suppression are evaluated immediately before dispatch and again for delayed/scheduled notifications. Global suppression wins over campaign/topic opt-in. Expired suppressions are ignored after time evaluation. Marketing cannot bypass these checks by sending directly to a provider.

## Provider boundary
Provider SDKs remain inside `modules/providers`. Each production provider implements `ChannelProvider` plus health/capability metadata. A missing provider is a configuration error, not a successful no-op. Test/sandbox implementations are never selectable through production configuration.

## Persistence
PostgreSQL tables: `notifications`, `templates`, `template_versions`, `preferences`, `suppressions`, `delivery_attempts`, `provider_events`, `outbox`. Index tenant/recipient/status/scheduledAt and unique `(provider,event_id)`, operation key and template version. Large bodies/payloads use bounded object-storage references.

## Reliability
At-least-once consumer delivery, bounded concurrency per provider, provider rate-limit backoff, finite retry budget and DLQ. Reconciliation workers correlate provider callbacks with local attempts. Poison events do not block the stream. Cancellation races are handled with optimistic version checks.

## Security/privacy
Recipient addresses/tokens are classified and encrypted or minimized as required. Provider credentials are secret-manager references. Logs/traces contain IDs and status codes, never message bodies or access tokens. Tenant keys are isolated. Bulk sends require explicit IAM permission and batch limits.

## Runtime roles
`api` for management/query/control; `consumer` for delivery commands/provider events; `worker` for rendering/delivery/reconciliation; `scheduler` for scheduled sends/retry windows/retention. One source tree, no mirrored worker application.

## Observability
Metrics: accepted notifications, send latency, provider success/failure, retry count, suppression rate, queue lag, DLQ depth and webhook reconciliation lag. OTel spans cover render→provider→callback and propagate request/correlation/causation IDs without sensitive payloads.

## Testing
Template/schema validation, locale fallback, preferences/suppression, duplicate notification commands, provider idempotency, webhook signature/replay, provider rate limits, retry/DLQ, cancellation races, tenant isolation, batch limits and migration compatibility. Contract suites must exist for each enabled production provider.

## Implementation phases
1. Contracts/scaffold/database.
2. Template/version/preference/suppression modules.
3. Notification persistence/idempotency/outbox.
4. Provider adapters and delivery worker.
5. Scheduling/retry/DLQ/reconciliation.
6. Security/observability/load testing and deployment.

## Exit criteria
- Delivery is durable and idempotent.
- Consent/suppression is enforced for immediate and scheduled sends.
- Each enabled production channel has a real provider adapter.
- Provider failures recover through bounded retry/DLQ/reconciliation.
- Marketing cannot bypass Notifications provider/security boundaries.
- No separate notifications worker implementation exists.
