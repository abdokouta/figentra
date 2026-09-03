---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: marketing
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024, ADR-0025]
depends_on: ["@stackra/contracts", "@stackra/analytics", "@stackra/notifications", "@stackra/workflow", "@stackra/identity", "@stackra/iam", "@stackra/tenant"]
---
# Marketing Service — implementation plan

## Mission and boundary
Marketing owns campaigns, audiences, segments, eligibility, customer journey definitions, suppression/frequency rules, activation intent, scheduling and conversion attribution. Analytics answers what happened. Notifications delivers communications. Workflow provides durable orchestration for long-running journeys. Monetization provides commercial eligibility/limits. Marketing never owns provider delivery or analytics storage.

## Source tree
```text
services/marketing/src/
├── modules/{campaigns,audiences,segments,journeys,eligibility,suppression,activation,conversions,scheduling}
├── application/{commands,queries,services}
├── domain/{campaign,audience,journey,activation}
├── infrastructure/{database,nats,analytics,config}
├── presentation/{http,openapi}
├── workers/{audience,journey,activation,reconciliation}
├── database/{entities,migrations}
└── main.ts
```

## Models
`Campaign(id,tenantId,key,version,status,channel,startAt,endAt,audienceId,journeyId,createdBy)`
`Audience(id,tenantId,key,definitionVersion,status,estimatedSize,snapshotRef)`
`Segment(id,audienceId,key,definition,status,version)`
`Journey(id,tenantId,campaignId,version,status,nodes,entryRules)`
`JourneyExecution(id,journeyId,subjectId,status,currentNode,nextRunAt,version)`
`Suppression(id,tenantId,subjectId,channel,reason,expiresAt,source)`
`Activation(id,tenantId,campaignId,subjectId,channel,status,idempotencyKey,providerRef)`
`Conversion(id,tenantId,campaignId,subjectId,eventId,value,occurredAt,attributionVersion)`

Published campaign/audience/journey versions are immutable. Draft versions can be edited until publication.

## Public contracts
```ts
interface CampaignService {
  create(ctx:RequestContext,input:CreateCampaignInput):Promise<CampaignView>;
  update(ctx:RequestContext,id:string,input:UpdateCampaignInput):Promise<CampaignView>;
  publish(ctx:RequestContext,id:string):Promise<CampaignView>;
  pause(ctx:RequestContext,id:string,reason:string):Promise<void>;
}
interface EligibilityService {
  evaluate(ctx:RequestContext,input:EligibilityInput):Promise<EligibilityResult>;
}
interface ActivationService {
  activate(ctx:RequestContext,input:ActivationInput):Promise<ActivationView>;
}
```
DTOs: `CreateCampaignDto`, `UpdateCampaignDto`, `CreateAudienceDto`, `CreateSegmentDto`, `CreateJourneyDto`, `EligibilityQueryDto`, `ActivationDto`, `SuppressionDto`, `ConversionDto`.

## Controllers
```text
GET    /v1/campaigns
POST   /v1/campaigns
GET    /v1/campaigns/:id
PATCH  /v1/campaigns/:id
POST   /v1/campaigns/:id/publish
POST   /v1/campaigns/:id/pause
GET/POST/PATCH/DELETE /v1/audiences
GET/POST/PATCH          /v1/journeys
POST   /v1/eligibility
POST   /v1/activations
GET    /v1/campaigns/:id/conversions
```

## Eligibility algorithm
1. Resolve trusted tenant/principal context.
2. Validate campaign/audience published version.
3. Query approved Analytics read contracts for behavioral predicates.
4. Apply tenant/business predicates through approved service APIs.
5. Apply consent, suppression, frequency cap and commercial eligibility gates.
6. Produce deterministic decision with definition versions.

Marketing cannot query another service database. Every audience definition references an allowlisted field/operator set.

## Journey execution
Published journey versions contain stable node IDs, node type, condition, delay, action contract and failure policy. Long-running execution is submitted to Workflow using `@stackra/workflow`. Marketing owns node/business intent and subject state references; Workflow owns timers, retries, execution state and compensation.

## Activation
Activation requests are durable/idempotent. Marketing sends a versioned Notifications command rather than invoking email/SMS/push providers. Provider-specific activation integrations belong to Notifications or Integrations. A missing notification provider returns a dependency/configuration failure, never a silent success.

## Identity/IAM/Tenant/Monetization
Identity supplies actor context. IAM authorizes campaign administration, audience exports, journey publication and sensitive activation operations. Tenant is a hard isolation boundary. Monetization may answer whether a campaign feature/capability is commercially available; Marketing must not reconstruct entitlements.

## Persistence
PostgreSQL tables `campaigns`, `campaign_versions`, `audiences`, `segments`, `journeys`, `journey_executions`, `suppressions`, `activations`, `conversions`, `outbox`. Unique tenant/key/version constraints and activation idempotency indexes. Large audience snapshots use Analytics/read storage references rather than unbounded JSON blobs.

## Workers/runtime
`api` handles management/query; `consumer` ingests Analytics, Notification and conversion outcomes; `worker` builds audiences, evaluates journey nodes and performs reconciliation; `scheduler` starts due campaigns and submits due journey work, while durable long-running timing belongs to Workflow. All roles share one service source tree.

## Reliability
Audience builds and journey evaluation use checkpoints. Activation is at-least-once with durable idempotency. Frequency caps are atomically reserved where necessary to prevent concurrent duplicate sends. Retry/DLQ is bounded. A campaign pause must prevent new activation commands after the pause version is observed.

## Security/privacy
Consent and suppression are hard gates. Recipient data is minimized and field-allowlisted. Sensitive audience definitions require IAM permissions. Exported audience files use Files/object storage with short-lived access. No credentials/tokens in campaign payloads.

## Observability
Metrics: audience build duration/size, eligibility decision latency, activation success/failure, suppression rate, frequency-cap rejects, journey lag, conversion ingestion lag and DLQ depth. OTel spans connect evaluation→activation→notification outcome without recipient secrets.

## Testing
Campaign state/version matrix; deterministic audience evaluation; consent/suppression; frequency caps under concurrency; duplicate activations; journey restart/recovery; Workflow contract tests; Analytics query fixtures; Notification contract tests; tenant isolation; time-zone scheduling; pause/publish races; migration compatibility; load tests for audience evaluation.

## Implementation phases
1. Contracts/scaffold/database and campaign versions.
2. Audiences/segments/eligibility compiler.
3. Journey model and Workflow integration.
4. Activation/Notifications integration.
5. Conversions/Analytics integration and reconciliation.
6. Scheduling/security/observability/failure/load tests.

## Exit criteria
- Published campaign/audience/journey definitions are immutable/versioned.
- Eligibility is deterministic and consent/suppression safe.
- Activations are durable and idempotent.
- Long-running journeys use Workflow rather than a second orchestration engine.
- Analytics/Notifications/Monetization boundaries are explicit.
- No direct provider or cross-service database access exists.
