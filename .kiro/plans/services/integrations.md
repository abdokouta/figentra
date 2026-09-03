---
status: canonical
component: service
service: integrations
version: v1
runtime: nestjs
---
# Integrations Service — implementation-complete plan

## Mission
Own external-system connections, provider configuration, credential references, inbound webhooks, outbound synchronization, mapping and reconciliation. Business services own the business meaning of synchronized records.

## Models
`Integration(id,tenantId,providerKey,status,version,config,createdAt)`; `Connection(id,integrationId,externalAccountRef,status,lastSyncAt)`; `CredentialRef(id,connectionId,secretRef,version)`; `WebhookEvent(id,tenantId,provider,eventId,receivedAt,signatureStatus,status,payloadRef)`; `SyncJob(id,connectionId,direction,cursor,status,attempt,nextRunAt)`; `Mapping(id,connectionId,resourceType,externalKey,internalKey,version)`; `ReconciliationJob(id,connectionId,status,drift,checkpoint)`.

## API/DTOs
`POST/GET/PATCH/DELETE /v1/integrations`; `POST /v1/integrations/:id/connections`; `POST /v1/integrations/:id/sync`; `GET /v1/sync-jobs/:id`; `POST /v1/reconciliation`; provider webhooks at `/v1/webhooks/:provider`.

## Interfaces
`IntegrationService.create/update/disable`; `ConnectionService.connect/disconnect/test`; `WebhookService.verify/ingest/process`; `SyncService.start/run`; `ReconciliationService.compare/repair`; `IntegrationProvider` with `authorize`, `request`, `verifyWebhook`, `map` and capability metadata.

## Provider boundary
External SDKs are adapter-local. Provider credentials are secret references. Each provider declares API version, rate limits, webhook signature algorithm, pagination semantics, idempotency support and supported operations. Unsupported operations fail explicitly; no generic fake provider is accepted.

## Identity/IAM/Tenant
Identity provides principal context. IAM authorizes integration administration, connection access and sync operations. Tenant owns the tenant boundary and is checked before every connection operation. Integration never stores user credentials directly when an OAuth/provider secret manager can hold them.

## Webhooks
Verify authenticity before persistence/processing. Deduplicate by provider event ID plus tenant/connection. Persist the verified envelope, then enqueue domain processing transactionally. Replay endpoints are admin-only and idempotent.

## Sync/reconciliation
Sync uses cursors/checkpoints and bounded pages. Writes to business services occur through contracts, not direct DB access. At-least-once delivery is assumed. Reconciliation compares provider and internal authoritative state and produces explicit repair jobs; automatic repair is permitted only for declared safe operations.

## Persistence
PostgreSQL tables above plus `outbox`. Index provider/account/event ID/status/nextRunAt. No raw secrets; large provider payloads use Files/object storage when retention requires them.

## Workers/scheduler
Consumer processes verified webhooks; worker executes sync/reconciliation with per-provider concurrency/rate limits; scheduler polls providers lacking webhooks and retries due jobs.

## Security/reliability
Egress host allowlists, TLS verification, SSRF-safe URL handling, signature verification, OAuth state validation, replay protection, bounded payloads, secret redaction and tenant isolation. Provider outage uses bounded backoff and does not corrupt business state.

## Observability
Provider request latency/errors/rate limits, webhook lag/duplicates, sync backlog, reconciliation drift and token refresh failures. Trace external calls with safe provider/account identifiers only.

## Testing
Provider contract fixtures, signature verification, duplicate/replay, rate limits, pagination/cursor recovery, mapping versioning, concurrent sync, tenant isolation, secret redaction, outage recovery and migration tests.

## Completion gate
Every enabled provider is real and versioned; credentials are secret references; webhooks are verified/idempotent; sync is resumable; reconciliation is explicit; business data is never accessed through another service's database.