---
status: canonical
component: service
service: notifications
version: v1
runtime: nestjs
---
# Notifications Service — implementation-complete plan

## Mission
Deliver authorized communications through email, SMS, push and future approved channels. Notifications owns templates, preferences, delivery attempts, provider adapters, retries, suppression and delivery status. Marketing owns campaigns; Audit owns durable audit records; Analytics owns analysis.

## Models
`Notification(id,tenantId,recipientRef,channel,templateKey,templateVersion,payloadRef,status,idempotencyKey,scheduledAt)`; `Template(id,tenantId,key,version,locale,subject,body,status)`; `Preference(id,tenantId,recipientRef,channel,topic,enabled,updatedAt)`; `DeliveryAttempt(id,notificationId,provider,attempt,status,providerMessageId,errorCode,nextAttemptAt)`; `Suppression(id,tenantId,recipientRef,channel,reason,expiresAt)`.

## DTOs/interfaces
`SendNotificationDto`, `BatchNotificationDto`, `ScheduleNotificationDto`, `TemplateDto`, `PreferenceDto`, `DeliveryStatusDto`.
```ts
interface NotificationService { send(ctx,input):Promise<Notification>; schedule(ctx,input):Promise<Notification>; cancel(ctx,id):Promise<void>; status(ctx,id):Promise<DeliveryStatus> }
interface ChannelProvider { send(message:ProviderMessage):Promise<ProviderReceipt>; verifyWebhook(input):Promise<ProviderEvent> }
```

## Controllers
`POST /v1/notifications`; `POST /v1/notifications/batch`; `POST /v1/notifications/:id/cancel`; `GET /v1/notifications/:id`; `GET/PUT /v1/preferences`; `GET/POST/PATCH /v1/templates`; provider webhooks under `/v1/webhooks/:provider`.

## Authorization/interactions
Identity supplies principal/recipient context. IAM authorizes template administration, bulk sends and status access. Marketing submits delivery commands through contracts. Notifications consults tenant settings and preference/suppression state owned here. Provider SDKs never cross the service boundary.

## Delivery semantics
A notification is accepted only after durable persistence. Consumer delivery is at-least-once and idempotent by notification ID/provider operation key. Provider webhooks are signature-verified and deduplicated by provider event ID. Retry policy is channel/provider-specific with bounded attempts and a DLQ.

## Persistence
PostgreSQL `notifications`, `templates`, `template_versions`, `preferences`, `suppressions`, `delivery_attempts`, `provider_events`, `outbox`. Object storage may hold large rendered bodies. Index tenant/recipient/status/scheduledAt and unique provider event IDs.

## Workers/scheduler
NestJS consumer receives commands; worker renders templates and delivers; scheduler claims due notifications and retry windows. Concurrency is bounded per provider and respects provider rate limits.

## Security/privacy
Consent and suppression are enforced before dispatch. Sensitive template variables are classified and redacted from logs. Provider credentials are secret-manager references. Recipient addresses/tokens are encrypted or minimized where required. Tenant isolation is mandatory.

## Observability
Delivery success/failure, provider latency, retry count, queue lag, suppression rate and DLQ depth. No message body or credential in telemetry. Trace each notification across render→provider→webhook reconciliation.

## Testing
Template rendering/locale fallback, preference/suppression, provider adapter conformance, duplicate sends/webhooks, rate limiting, retry/DLQ, cancellation races, tenant isolation, large batches and migration tests.

## Completion gate
Every channel has a real provider adapter or is explicitly unsupported; delivery is durable/idempotent; consent is enforced; no marketing/campaign state is stored here.