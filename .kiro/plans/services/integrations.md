---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: integrations
version: v1
runtime: nestjs
anchor_adrs: [ADR-0016, ADR-0020, ADR-0024]
---
# Integrations Service — implementation plan

## Mission and boundary
Integrations is the external-system connectivity control plane. It owns provider definitions, tenant connections, credential references, inbound webhook verification, outbound API calls, synchronization orchestration, field mappings and reconciliation. Business services own the business meaning and authoritative business records.

## Source tree
```text
services/integrations/src/
├── modules/{providers,integrations,connections,credentials,webhooks,sync,mapping,reconciliation}
├── application/{commands,queries,services}
├── domain/{connection,webhook,sync-job}
├── infrastructure/{database,http,nats,secrets,config}
├── presentation/{http,openapi,webhooks}
├── workers/{sync,reconciliation,webhook-processing}
├── database/{entities,migrations}
└── main.ts
```

## Models
`Integration(id,tenantId,providerKey,status,version,displayName,configSchemaRef)`
`Connection(id,integrationId,tenantId,externalAccountRef,status,scopes,lastSyncAt,version)`
`CredentialRef(id,connectionId,secretRef,provider,version,rotatedAt)`
`WebhookEvent(id,tenantId,connectionId,provider,eventId,signatureStatus,payloadHash,payloadRef,status,receivedAt,processedAt)`
`SyncJob(id,tenantId,connectionId,direction,resourceType,cursor,status,attempt,nextRunAt,checkpoint)`
`Mapping(id,connectionId,resourceType,externalKey,internalKey,transformVersion)`
`ReconciliationJob(id,tenantId,connectionId,status,drift,checkpoint,startedAt,completedAt)`

## Public contracts
```ts
interface IntegrationProvider {
  authorize(input:AuthorizeInput):Promise<AuthorizationResult>;
  request<T>(input:ProviderRequest):Promise<ProviderResponse<T>>;
  verifyWebhook(input:WebhookVerificationInput):Promise<VerifiedWebhook>;
  capabilities():ProviderCapabilities;
}
interface SyncService {
  start(ctx:RequestContext,input:StartSyncInput):Promise<SyncJobView>;
  run(jobId:string):Promise<void>;
  cancel(ctx:RequestContext,jobId:string):Promise<void>;
}
interface ReconciliationService {
  compare(jobId:string):Promise<ReconciliationResult>;
  repair(jobId:string):Promise<void>;
}
```
DTOs: `CreateIntegrationDto`, `UpdateIntegrationDto`, `CreateConnectionDto`, `TestConnectionDto`, `StartSyncDto`, `ReplayWebhookDto`, `CreateMappingDto`, `StartReconciliationDto`.

## HTTP controllers
```text
GET    /v1/integrations
POST   /v1/integrations
PATCH  /v1/integrations/:id
DELETE /v1/integrations/:id
POST   /v1/integrations/:id/connections
POST   /v1/integrations/:id/connections/:connectionId/test
DELETE /v1/integrations/:id/connections/:connectionId
POST   /v1/integrations/:id/sync
GET    /v1/sync-jobs/:id
POST   /v1/reconciliation
POST   /v1/webhooks/:provider
POST   /v1/webhooks/:provider/:eventId/replay
```

## Provider contract
Every provider declares API version, supported resources/actions, OAuth/token mode, webhook signature algorithm, pagination/cursor behavior, rate limits, idempotency support and data classification. Unsupported operations return typed `ProviderCapabilityError`; they do not silently no-op. Provider SDK types remain adapter-local.

## Webhook execution
`ingress → provider authenticity verification → payload size/schema validation → dedupe by provider/connection/event ID → durable webhook record → outbox/consumer → domain mapping → owning service command`. Unverified webhooks are rejected or quarantined and never reach domain consumers. Replay is admin-only and reuses the original verified envelope without double-applying the business command.

## Sync execution
Sync jobs use explicit cursor/checkpoint state, bounded pages, rate-limit-aware backoff and per-resource mappings. Writes to business services occur via versioned commands/events over NATS/HTTP. Integrations never writes another service database. Sync state is idempotent using provider resource IDs + mapping versions.

## Reconciliation
Reconciliation compares external authoritative state with internal business state where the integration contract declares the comparison safe. Automatic repair is allowed only for declared idempotent operations. Otherwise the service emits a repair proposal/task for operator/business workflow handling.

## Identity/IAM/Tenant
Identity provides authenticated principal context for connection management. IAM authorizes provider/integration administration, secret rotation, sync/replay and reconciliation. Tenant is validated for every connection/job. External OAuth/provider secrets are stored only as secret references; token values never enter PostgreSQL or telemetry.

## Persistence
PostgreSQL tables above plus `outbox`. Index tenant/provider/account, webhook event IDs, sync job status/nextRunAt and reconciliation checkpoint. Large webhook payloads are stored as bounded Files/object references when required; DB retains hashes and metadata. Migrations use expand/contract.

## Security/egress
TLS and certificate verification are mandatory. Provider destinations are allowlisted/configured; dynamic URLs are SSRF-protected. OAuth state/nonce is validated. Webhook signatures/replay timestamps are enforced. Outbound headers/tokens are redacted. Egress and provider credentials use least privilege.

## Reliability
Outbound calls have connect/read/overall deadlines. Retries are bounded and only automatic when operation semantics are idempotent. Rate limits use provider-specific backoff. Sync/webhook consumers are at-least-once with durable idempotency. Poison events go to DLQ. Reconciliation can resume from checkpoints after process loss.

## Runtime roles
`api` manages integrations/connections; `consumer` verifies/dispatches webhooks and integration events; `worker` executes sync/reconciliation; `scheduler` polls providers without webhooks and launches due jobs. All are roles of one NestJS service source tree.

## Observability
Metrics: provider request latency/error/rate-limit, webhook verification/duplicate/replay, sync backlog/lag, mapping failures, token refresh failures and reconciliation drift. OTel spans identify provider/connection IDs without secrets or full payloads.

## Testing
Provider contract fixtures; signature verification and replay; OAuth state handling; pagination/cursor restart; idempotent sync; mapping-version compatibility; concurrent sync; rate limiting; SSRF/egress controls; tenant isolation; secret redaction; provider outage/DLQ recovery; migrations.

## Implementation phases
1. Provider/connection contracts and scaffold.
2. Credential reference and authorization flows.
3. Webhook verification/ingestion.
4. Sync/cursor/mapping engine.
5. Reconciliation and polling scheduler.
6. Security/observability/failure/load tests.
7. Production provider rollout and runbooks.

## Exit criteria
- Every enabled provider is explicitly implemented and versioned.
- Webhooks are verified, deduplicated and replayable.
- Sync is resumable, idempotent and rate-limit-safe.
- Business services are accessed only through contracts/transport.
- No credentials/provider SDK types leak into domain code.
