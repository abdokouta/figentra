---
status: canonical
component: service
service: integrations
version: v1
runtime: nestjs
---
# Integrations Service — Implementation Contract

## 1. Source tree

```text
services/integrations/src/
├── modules/
│   ├── providers/{domain,application,infrastructure,presentation}
│   ├── integrations/{domain,application,infrastructure,presentation}
│   ├── connections/{domain,application,infrastructure,presentation}
│   ├── credentials/{domain,application,infrastructure}
│   ├── webhooks/{domain,application,infrastructure,presentation}
│   ├── sync/{domain,application,infrastructure}
│   ├── mapping/{domain,application,infrastructure,presentation}
│   └── reconciliation/{domain,application,infrastructure,presentation}
├── infrastructure/{database,http,nats,secrets,egress,config}
├── events/{consumers,publishers,schemas}
├── database/{entities,migrations,seeds}
├── presentation/{http,openapi,webhooks}
├── app.module.ts
└── main.ts
```

## 2. Entities

`Integration(id,tenantId,providerKey,status,displayName,configSchemaRef,version,createdAt,updatedAt)` — provider must be registered and enabled.

`Connection(id,integrationId,tenantId,externalAccountRef,status,scopes,lastSyncAt,version,createdAt,updatedAt)` — tenant and integration must match; active connection identity is unique where provider contract requires it.

`CredentialRef(id,connectionId,secretRef,provider,version,rotatedAt)` — contains no secret value.

`WebhookEvent(id,tenantId,connectionId,provider,eventId,signatureStatus,payloadHash,payloadRef,status,receivedAt,processedAt)` — provider/connection/event ID deduplication is mandatory.

`SyncJob(id,tenantId,connectionId,direction,resourceType,cursor,status,attempt,nextRunAt,checkpoint)` — cursor/checkpoint transitions are versioned and resumable.

`Mapping(id,connectionId,resourceType,externalKey,internalKey,transformVersion)` — mappings are explicit and versioned.

`ReconciliationJob(id,tenantId,connectionId,status,drift,checkpoint,startedAt,completedAt)` — repair state is explicit.

## 3. Provider port

```ts
interface IntegrationProvider {
  authorize(input: AuthorizeInput): Promise<AuthorizationResult>;
  request<T>(input: ProviderRequest): Promise<ProviderResponse<T>>;
  verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhook>;
  capabilities(): ProviderCapabilities;
}
```

Additional ports: `ProviderRegistry`, `ConnectionRepository`, `CredentialReferenceStore`, `WebhookRepository`, `SyncJobRepository`, `MappingRepository`, `ReconciliationRepository`.

Provider adapters implement capability discovery, authentication, request translation, pagination, rate limits and webhook verification. Unsupported operations return typed `ProviderCapabilityError`.

## 4. Commands

- `RegisterIntegrationCommand`
- `UpdateIntegrationCommand`
- `CreateConnectionCommand`
- `TestConnectionCommand`
- `RotateCredentialReferenceCommand`
- `DisconnectConnectionCommand`
- `StartSyncCommand`
- `CancelSyncCommand`
- `ReplayWebhookCommand`
- `CreateMappingCommand`
- `StartReconciliationCommand`
- `RepairReconciliationCommand`

Every handler validates Identity context, IAM permission, tenant ownership, provider capability and idempotency requirements.

## 5. Queries

- `ListProvidersQuery`
- `GetIntegrationQuery`
- `ListIntegrationsQuery`
- `GetConnectionQuery`
- `ListConnectionsQuery`
- `GetSyncJobQuery`
- `ListSyncJobsQuery`
- `GetWebhookEventQuery`
- `GetReconciliationQuery`
- `ListMappingsQuery`

No query exposes credential values, authorization codes or provider tokens.

## 6. HTTP API

```text
GET    /v1/integration-providers
GET    /v1/integrations
POST   /v1/integrations
PATCH  /v1/integrations/:id
DELETE /v1/integrations/:id
POST   /v1/integrations/:id/connections
GET    /v1/integrations/:id/connections
POST   /v1/integrations/:id/connections/:connectionId/test
DELETE /v1/integrations/:id/connections/:connectionId
POST   /v1/integrations/:id/sync
GET    /v1/sync-jobs/:id
POST   /v1/webhooks/:provider
POST   /v1/webhooks/:provider/:eventId/replay
POST   /v1/reconciliation
GET    /v1/reconciliation/:id
POST   /v1/reconciliation/:id/repair
```

OAuth callback routes are provider-specific and are mounted only when the provider contract requires browser authorization. They validate state and nonce before creating/updating a connection.

## 7. Webhook processing

Ingress validates method, content type and bounded body size. Provider authenticity is verified before persistence as a trusted event. The durable record stores payload hash and, for large payloads, a Files/object reference.

Processing uses:

```text
receive → verify → dedupe → persist → publish/consume → map → command domain service
```

Replay is restricted to authorized operators, preserves the original verified envelope and uses the same idempotency key.

## 8. Sync engine

Sync handlers execute bounded pages. Each page records provider cursor/checkpoint before advancing. Provider rate limits produce typed retry scheduling. Business writes use versioned contracts over HTTP/NATS and include an idempotency key derived from connection/provider resource/version.

A crashed worker resumes from the last committed checkpoint. Sync cancellation is cooperative and idempotent.

## 9. Mapping

Mappings are explicit data, not arbitrary executable code. Transformations are versioned and bounded. Invalid mappings fail the individual item/page without corrupting unrelated resources; repeated failures route the job to DLQ/manual remediation according to policy.

## 10. Reconciliation

`CompareReconciliationHandler` reads declared external resources and corresponding domain projections through supported contracts. It produces `equal`, `external_newer`, `internal_newer`, `missing_external`, `missing_internal` or `conflict` outcomes.

`RepairReconciliationHandler` executes only allow-listed idempotent repairs. Non-idempotent or ambiguous conflicts create a repair proposal for Workflow/operator handling.

## 11. Persistence

```text
integrations
connections
credential_refs
webhook_events
sync_jobs
mappings
reconciliation_jobs
outbox
```

Indexes: tenant/provider/status, `(connection_id,status)`, provider/connection/event ID, sync status/nextRunAt, mapping connection/resource, reconciliation checkpoint. Migrations use expand/contract.

## 12. Messaging and events

Published events include `integration.connected`, `integration.disconnected`, `integration.webhook.received`, `integration.sync.started`, `integration.sync.completed`, `integration.sync.failed`, `integration.reconciliation.drift-detected` and `integration.reconciliation.repaired`.

Consumed events may trigger sync/reconciliation when an owning domain declares such behavior. All contracts live in `@stackra/contracts` and are versioned.

## 13. Jobs

`ProcessWebhookJob` — verification/dispatch, bounded retry, DLQ.

`RunSyncJob` — page execution, checkpointing, rate-limit backoff, bounded retry.

`RefreshProviderAuthorizationJob` — refreshes provider authorization where contract supports it; secrets remain in secret manager.

`RunReconciliationJob` — comparison and checkpointed drift detection.

`RepairReconciliationJob` — only declared idempotent repairs.

`PollProviderJob` — provider polling when webhooks are unavailable.

## 14. Schedulers

- `integration.sync.due` — launches due sync jobs.
- `integration.poll.providers` — polls providers with no webhook support.
- `integration.reconciliation.due` — launches configured reconciliation windows.
- `integration.webhook.retention` — applies bounded retention to raw payload references.

Occurrence keys and job IDs guarantee idempotent scheduling.

## 15. Security and egress

All outbound TLS certificates are verified. Egress destinations are provider-configured/allow-listed. User-controlled URLs cannot become arbitrary outbound destinations. DNS rebinding and private-network targets are blocked by the SSRF policy. OAuth state/nonce and redirect URI checks are mandatory. Webhook timestamps/signatures prevent replay. Authorization headers and tokens are always redacted.

## 16. Identity / IAM / Tenant

Identity authenticates administrators and provides principal context. IAM authorizes connection, provider, credential, sync, webhook replay and reconciliation operations. Tenant validates tenant ownership and lifecycle. Integrations never evaluates authorization policies itself.

Authentication providers such as Supabase Auth or a future Clerk adapter remain owned by Identity, not Integrations.

## 17. Audit

Connection creation/removal, credential rotation, webhook replay, synchronization administration and reconciliation repair emit audit contracts after successful mutation. Secrets and provider tokens are excluded.

## 18. Observability

Metrics: provider request latency/error/rate-limit, webhook verification/duplicate/replay, sync backlog/throughput/failure, mapping errors, token-refresh failures and reconciliation drift.

OTel spans contain provider/connection/job IDs and request/correlation/causation IDs, never raw payloads or secrets.

## 19. Tests

Unit: provider capability behavior, mapping validation, cursor transitions, retry classification, reconciliation outcomes.

Contract: every provider adapter against recorded fixtures; webhook signature fixtures; pagination and error semantics.

Integration: webhook dedupe, sync checkpoint recovery, credential references, rate-limit scheduling, outbox and NATS delivery.

Security: SSRF, forged signatures, replay, OAuth state substitution, token leakage, tenant escape and unauthorized replay/repair.

E2E: connect provider → test → receive webhook → sync → reconcile → repair where allowed.

Load/failure: concurrent syncs, provider outage, rate limiting, worker crash, duplicate events and DLQ replay.

## 20. Deployment

Provider credentials are environment/secret-manager configuration. Provider enablement is explicit per environment. Rolling deployment must preserve provider contract compatibility. Provider adapter version changes use compatibility windows and migration steps.

## 21. Definition of done

Every enabled provider has a complete adapter and contract fixture. Every webhook is authenticated and deduplicated. Every sync is resumable/idempotent. Every outbound call is bounded and SSRF-safe. No external SDK types escape adapter boundaries. Integrations never owns another service's business data and never becomes the authentication or authorization authority.
