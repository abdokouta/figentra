---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
scope: all-services
---
# Service Implementation Contract — Exact Modules, Files, Methods, Controllers, Events, Queues, Jobs and Runtime Roles

Every one of the 14 canonical services follows this source contract. Business logic remains inside the service. `api`, `consumer`, `worker`, and `scheduler` are roles from the same NestJS source tree.

## Standard service tree
```text
services/<service>/
├── package.json
├── README.md
├── src/
│   ├── main.ts
│   ├── bootstrap/{bootstrap.module,config,logging,otel,shutdown,health}.ts
│   ├── modules/<module>/
│   │   ├── domain/{entities,value-objects,events,policies}.ts
│   │   ├── application/{commands,queries,services,ports}.ts
│   │   ├── infrastructure/{repositories,providers,mappers}.ts
│   │   ├── presentation/{controllers,dto,serializers}.ts
│   │   └── <module>.module.ts
│   ├── messaging/{consumers,publishers,event-mappers}.ts
│   ├── jobs/{handlers,definitions,job.module}.ts
│   ├── schedulers/{schedules,claims}.ts
│   ├── database/{entities,migrations,seeds}.ts
│   ├── workers/{api,consumer,worker,scheduler}.ts
│   └── contracts/{internal-events,commands}.ts
└── test/{unit,integration,contract,e2e,load,security}.ts
```

## Required application interfaces
Every aggregate/service exposes explicit methods rather than controller-to-repository shortcuts: `create`, `get`, `list`, `update`, `delete/archive`, plus domain-specific commands; queries are read-only; commands are transactional; events are published through outbox after commit.

## 01 Identity
Modules/files:
```text
modules/identities/{identity.entity,identity.repository,identity.service,identity.controller}
modules/providers/{provider-link.entity,provider-link.service,provider.controller}
modules/sessions/{session.entity,session.repository,session.service,session.controller}
modules/credentials/{credential-ref.entity,credential.service}
modules/service-identities/{service-identity.entity,service-identity.service,controller}
modules/delegation/{delegation.entity,delegation.service,controller}
```
Controllers/methods: `POST /v1/identities`, `GET /v1/identities/:id`, `GET /v1/me`, `POST /v1/sessions`, `DELETE /v1/sessions/:id`, `POST /v1/provider-links`, `DELETE /v1/provider-links/:id`, `POST /v1/delegations`, `POST /v1/service-identities`.
Events: `IdentityCreated`, `IdentityUpdated`, `SessionStarted`, `SessionRevoked`, `ProviderLinked`, `DelegationGranted`, `DelegationRevoked`.
Queues/jobs: `identity.session-expiry`, `identity.provider-reconciliation`, `identity.privacy-erasure`; jobs `ExpireSessions`, `ReconcileProviderLinks`, `PurgeIdentityData`.
Email/notification requests: `identity.verify-email`, `identity.password-reset`, `identity.login-alert` through Notifications; Identity never sends email directly.

## 02 Tenant
Modules/files:
```text
modules/tenants/{tenant.entity,tenant.repository,tenant.service,tenant.controller}
modules/organizations/{organization.entity,organization.service}
modules/memberships/{membership.entity,membership.service,controller}
modules/domains/{domain.entity,domain.service,verification}
modules/provisioning/{provisioning.service,provisioning.controller}
modules/settings/{tenant-settings.entity,tenant-settings.service}
modules/residency/{residency-policy.entity,residency.service}
```
Methods: `createTenant`, `getTenant`, `listTenants`, `updateTenant`, `suspendTenant`, `restoreTenant`, `addMembership`, `removeMembership`, `listMemberships`, `bindApplication`, `verifyDomain`, `setResidency`, `getSettings`, `updateSettings`.
Events: `TenantCreated`, `TenantSuspended`, `TenantRestored`, `MembershipAdded`, `MembershipRemoved`, `DomainVerified`, `ApplicationBound`, `ResidencyChanged`.
Queues/jobs: `tenant.provision`, `tenant.deprovision`, `tenant.domain-verification`, `tenant.reconciliation`; jobs `ProvisionTenant`, `DeprovisionTenant`, `VerifyDomain`, `ReconcileBindings`.
Notifications: invitation/welcome, membership changes, domain verification, suspension notices.

## 03 IAM
Modules/files:
```text
modules/permissions/{permission.entity,permission.service,controller}
modules/roles/{role.entity,role.service,controller}
modules/assignments/{assignment.entity,assignment.service}
modules/policies/{policy.entity,policy.compiler,policy.evaluator}
modules/checks/{authorization.service,authorization.controller}
```
Methods: `createPermission`, `createRole`, `assignRole`, `revokeRole`, `definePolicy`, `evaluate`, `listEffectivePermissions`, `explainDecision`.
Events: `RoleCreated`, `RoleAssigned`, `RoleRevoked`, `PolicyPublished`.
Queues/jobs: `iam.policy-cache-rebuild`, `iam.assignment-reconciliation`; jobs `RebuildPolicyIndex`, `ReconcileAssignments`.
No email is emitted directly.

## 04 Monetization
Modules/files:
```text
modules/catalog/{plan.entity,price.entity,plan.service,controller}
modules/subscriptions/{subscription.entity,subscription.service,controller}
modules/billing/{invoice.entity,payment.entity,billing.service,controller}
modules/discounts/{discount.entity,discount.service}
modules/entitlements/{entitlement.entity,entitlement.service}
modules/credits/{credit.entity,credit.service}
```
Methods: `createPlan`, `publishPlanVersion`, `createSubscription`, `changePlan`, `cancelSubscription`, `createInvoice`, `recordPayment`, `grantCredit`, `evaluateEntitlement`.
Events: `PlanPublished`, `SubscriptionCreated`, `SubscriptionChanged`, `SubscriptionCanceled`, `InvoiceIssued`, `PaymentSucceeded`, `PaymentFailed`, `EntitlementChanged`.
Queues/jobs: `billing.invoice-generation`, `billing.payment-reconciliation`, `billing.dunning`; jobs `GenerateInvoice`, `ReconcilePayments`, `ProcessDunning`, `ExpireTrials`.
Notifications: trial ending, invoice issued, payment failed, subscription changed, payment receipt.

## 05 Usage
Modules/files:
```text
modules/ingestion/{usage-event.entity,ingestion.service,controller}
modules/meters/{meter.entity,meter.service,controller}
modules/aggregation/{aggregation.service,worker}
modules/quotas/{quota.entity,quota.service,controller}
modules/periods/{consumption-period.entity,period.service}
modules/billing/{billable-usage.service}
```
Methods: `record`, `recordBatch`, `defineMeter`, `calculateUsage`, `getConsumption`, `evaluateQuota`, `closePeriod`, `exportBillableUsage`.
Events: `UsageRecorded`, `MeterDefinitionChanged`, `QuotaExceeded`, `ConsumptionPeriodClosed`.
Queues/jobs: `usage.ingest`, `usage.aggregate`, `usage.quota`, `usage.export`; jobs `AggregateUsageWindow`, `RebuildMeter`, `EvaluateQuota`, `ExportBillableUsage`.
Notifications only for configured quota/usage alerts.

## 06 Workflow
Modules/files:
```text
modules/definitions/{definition.entity,definition.service,controller}
modules/executions/{execution.entity,execution.service,controller}
modules/steps/{step.entity,step.service}
modules/timers/{timer.entity,timer.service}
modules/signals/{signal.service,controller}
modules/human-tasks/{task.entity,task.service,controller}
modules/compensation/{compensation.service}
```
Methods: `registerDefinition`, `publishVersion`, `startExecution`, `signal`, `cancel`, `retryStep`, `completeTask`, `rejectTask`, `resume`, `terminate`.
Events: `WorkflowStarted`, `StepCompleted`, `StepFailed`, `HumanTaskCreated`, `HumanTaskCompleted`, `WorkflowCompleted`, `WorkflowCompensated`.
Queues/jobs: `workflow.execute`, `workflow.timer`, `workflow.signal`, `workflow.compensation`; jobs `ClaimExecution`, `FireTimer`, `ResumeExecution`, `RunCompensation`, `ExpireHumanTask`.
Email/Slack are requests to Notifications, never provider calls from Workflow.

## 07 Notifications
Modules/files:
```text
modules/templates/{template.entity,template.service,controller}
modules/preferences/{preference.entity,preference.service,controller}
modules/channels/{channel.service}
modules/deliveries/{delivery.entity,delivery.service,controller}
modules/providers/{provider-adapter.service}
modules/suppression/{suppression.service}
```
Methods: `renderTemplate`, `saveTemplate`, `resolvePreferences`, `send`, `schedule`, `cancel`, `getDelivery`, `suppress`, `unsuppress`.
Events: `NotificationQueued`, `NotificationDelivered`, `NotificationFailed`, `RecipientSuppressed`.
Queues/jobs: `notifications.email`, `notifications.sms`, `notifications.push`, `notifications.inapp`, `notifications.slack`; jobs `DispatchNotification`, `RetryDelivery`, `ProcessBounce`, `ProcessProviderWebhook`, `ReconcileDelivery`.
Provider adapters: email, SMS, push, Slack; provider SDKs stay behind `@stackra/notifications/<provider>`.

## 08 Audit
Modules/files:
```text
modules/records/{audit-record.entity,audit.service,controller}
modules/integrity/{hash-chain.service,verification.service}
modules/retention/{retention.service,scheduler}
modules/exports/{audit-export.service,controller}
```
Methods: `append`, `query`, `verifyIntegrity`, `export`, `applyRetentionPolicy`.
Events: `AuditRecordAppended`, `AuditExportCreated`.
Queues/jobs: `audit.integrity`, `audit.export`, `audit.retention`; jobs `VerifyAuditChain`, `ExportAuditRange`, `PurgeExpiredAudit`.
No operational logging is stored as audit automatically; callers explicitly submit audit records.

## 09 Files
Modules/files:
```text
modules/files/{file.entity,file.service,controller}
modules/uploads/{upload-session.entity,upload.service,controller}
modules/versions/{file-version.entity,version.service}
modules/processing/{processing-job.entity,processing.service}
modules/lifecycle/{retention.service}
```
Methods: `createUploadSession`, `completeUpload`, `getFile`, `createVersion`, `delete`, `restore`, `createSignedUrl`, `startProcessing`.
Events: `FileCreated`, `FileVersionCreated`, `UploadCompleted`, `FileDeleted`, `ProcessingRequested`, `ProcessingCompleted`.
Queues/jobs: `files.processing`, `files.lifecycle`, `files.scan`; jobs `ProcessMedia`, `ScanFile`, `ApplyRetention`, `DeleteObject`.
Notifications: upload completion/failure only through Notifications.

## 10 Integrations
Modules/files:
```text
modules/connections/{connection.entity,connection.service,controller}
modules/oauth/{oauth-state.entity,oauth.service,controller}
modules/webhooks/{webhook-subscription.entity,webhook.service,controller}
modules/mappings/{mapping.entity,mapping.service}
modules/sync/{sync-job.entity,sync.service}
modules/reconciliation/{reconciliation.service}
```
Methods: `createConnection`, `authorize`, `callback`, `rotateCredentialRef`, `subscribeWebhook`, `receiveWebhook`, `startSync`, `resumeSync`, `reconcile`, `disconnect`.
Events: `ConnectionCreated`, `ConnectionAuthorized`, `WebhookReceived`, `SyncStarted`, `SyncCompleted`, `SyncFailed`, `ReconciliationDriftDetected`.
Queues/jobs: `integrations.webhooks`, `integrations.sync`, `integrations.reconcile`, `integrations.oauth`; jobs `ProcessWebhook`, `RunSync`, `ReconcileConnection`, `RefreshOAuth`.

## 11 Search
Use the detailed Search service plan as the authoritative provider/index plan. Additional module files required:
```text
modules/indexes/{index.entity,index.service,index.controller}
modules/documents/{document.service}
modules/indexing/{index-job.entity,indexing.service}
modules/query/{query.service,query.controller}
modules/ranking/{ranking.service}
modules/rebuild/{rebuild-job.entity,rebuild.service}
modules/reconciliation/{reconciliation.service}
```
Controllers: index CRUD, query, rebuild, reconcile, job status. Queues: indexing/rebuild/reconciliation. Provider adapters are `@stackra/search/meilisearch`, `/elastic`, `/algolia`.

## 12 Reporting
Use the detailed Reporting plan as authoritative. Required modules/files:
```text
modules/definitions/{report-definition.entity,definition.service,controller}
modules/datasets/{dataset.entity,dataset.service,controller}
modules/query/{query-compiler,query.service,controller}
modules/read-models/{projection.entity,projection.service}
modules/exports/{report-job.entity,export.service,controller}
modules/schedules/{schedule.entity,schedule.service,controller}
modules/authorization/{report-authorization.service}
modules/reconciliation/{reconciliation.service}
```
Methods: `createDefinition`, `publishVersion`, `getDefinition`, `query`, `preview`, `startExport`, `getJob`, `schedule`, `unschedule`, `rebuildProjection`.
Queues/jobs: projection/export/schedule/reconciliation. Notifications requests: scheduled report delivery.

## 13 Analytics
Required modules/files:
```text
modules/ingestion/{event.entity,ingest.service,controller}
modules/event-catalog/{catalog.entity,catalog.service}
modules/facts/{fact.entity,fact.service}
modules/dimensions/{dimension.entity,dimension.service}
modules/metrics/{metric-definition.entity,metric.service,controller}
modules/aggregations/{aggregation.service,worker}
modules/attribution/{attribution.service,controller}
modules/funnels/{funnel.service,controller}
modules/backfills/{backfill-job.entity,backfill.service,controller}
modules/retention/{retention.service}
modules/privacy/{privacy.service}
```
Methods: `ingest`, `batchIngest`, `defineMetric`, `queryMetric`, `queryFunnel`, `queryAttribution`, `startBackfill`, `cancelBackfill`, `purgeSubject`.
Queues/jobs: ingestion/aggregation/backfill/privacy. Notifications only for configured anomaly/delivery workflows.

## 14 Marketing
Required modules/files:
```text
modules/audiences/{audience.entity,audience.service,controller}
modules/segments/{segment.entity,segment.service,controller}
modules/campaigns/{campaign.entity,campaign.service,controller}
modules/journeys/{journey.entity,journey.service,controller}
modules/eligibility/{eligibility.service}
modules/suppression/{suppression.service}
modules/activation/{activation.service,worker}
modules/conversions/{conversion.entity,conversion.service}
```
Methods: `createAudience`, `buildSegment`, `createCampaign`, `publishCampaign`, `evaluateEligibility`, `scheduleActivation`, `activate`, `recordConversion`, `pause`, `archive`.
Events: `CampaignCreated`, `CampaignPublished`, `ActivationQueued`, `MessageRequested`, `ConversionRecorded`.
Queues/jobs: `marketing.activation`, `marketing.journeys`, `marketing.conversion`; jobs `BuildAudience`, `RunJourneyStep`, `ActivateCampaign`, `ReconcileConversion`.
Email/SMS/push/Slack are always Notifications requests; Marketing never calls providers directly.

## Cross-service controller rules
Controllers are thin: authenticate/context → validate DTO → authorize with IAM → invoke application method → map result to API contract. No controller imports another service's ORM/repository/provider. Cross-service communication uses `@stackra/contracts` + HTTPS/OpenAPI or NATS events.

## Queue and job rules
Every durable queue has named subject/stream, consumer group, payload schema/version, idempotency key, max attempts, backoff/jitter, visibility/ack semantics, DLQ subject, observability metrics and replay command. Every job has an owning service/module, handler file, input/output contract, timeout, retryability and cleanup semantics.

## Email rule
Services do not contain SMTP/SES/SendGrid/Slack SDK calls. They emit domain events or explicit notification requests consumed by Notifications. Provider adapters remain below the Notifications boundary.

## Completion gate
Each service plan is incomplete until all modules have: entity/value objects; application commands/queries/methods; repositories/ports; controllers/DTOs where public; events/commands; queue subjects; jobs; scheduler entries; authorization; tenancy; audit hooks; health/readiness; metrics/traces; migration files; unit/integration/contract/e2e tests; and deployment configuration.
