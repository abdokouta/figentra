---
status: canonical
component: service
service: marketing
version: v1
runtime: nestjs
---
# Marketing Service — implementation-complete plan

## Mission
Own campaigns, audiences, segmentation, eligibility, journeys, suppression, scheduling, activation and conversion integrations. Analytics explains what happened; Marketing decides what action to take; Notifications delivers communications.

## Models
`Campaign(id,tenantId,key,version,status,channel,startAt,endAt,audienceId,journeyId)`; `Audience(id,tenantId,key,definitionVersion,status,estimatedSize)`; `Segment(id,audienceId,key,definition,status)`; `Journey(id,tenantId,campaignId,version,nodes,entryRules)`; `JourneyExecution(id,journeyId,subjectId,status,currentNode,nextRunAt,version)`; `Suppression(id,tenantId,subjectId,channel,reason,expiresAt)`; `Activation(id,tenantId,campaignId,subjectId,channel,status,idempotencyKey)`; `Conversion(id,tenantId,campaignId,subjectId,eventId,value,occurredAt)`.

## DTOs/interfaces
`CreateCampaignDto`, `AudienceDto`, `SegmentDto`, `JourneyDto`, `EligibilityQueryDto`, `ActivationDto`, `SuppressionDto`, `ConversionDto`. `CampaignService`, `AudienceService`, `JourneyEngine`, `ActivationService`, `ConversionService` expose create/update/publish/pause, evaluate, schedule and record operations.

## API
`GET/POST/PATCH/DELETE /v1/campaigns`; `POST /v1/campaigns/:id/publish`; `POST /v1/campaigns/:id/pause`; `GET/POST/PATCH/DELETE /v1/audiences`; `GET/POST/PATCH /v1/journeys`; `POST /v1/eligibility`; `POST /v1/activations`; `GET /v1/campaigns/:id/conversions`.

## Eligibility
Eligibility is deterministic for a campaign/audience version and uses Analytics read contracts plus tenant/business data through approved APIs. Consent, suppression, frequency caps and commercial eligibility are checked before activation. Marketing never directly queries another service database.

## Identity/IAM/Tenant/Monetization
Identity supplies actor context. IAM authorizes campaign/audience administration and exports. Tenant defines isolation. Monetization may provide commercial capability checks for campaign features/limits. Notifications receives versioned send commands; Analytics receives conversion/activity facts.

## Journey execution
Published journey versions are immutable. Each node has stable ID, conditions, delay and action semantics. Execution checkpoints are durable and idempotent. Scheduling uses Workflow where the journey is long-running or human/durable; Marketing does not implement a second orchestration engine.

## Persistence
PostgreSQL `campaigns`, `audiences`, `segments`, `journeys`, `journey_executions`, `suppressions`, `activations`, `conversions`, `outbox`. Large audience snapshots may use Analytics/read storage. Unique activation idempotency keys prevent duplicate sends.

## Workers/scheduler
Consumer ingests analytics/conversion/notification outcomes; worker computes audiences and evaluates journeys; scheduler claims due journey nodes/campaign windows. Concurrency and frequency caps are enforced transactionally or through an explicit atomic coordination mechanism.

## Security/privacy
Consent and suppression are hard gates. Tenant isolation, data minimization, field allowlists and retention/deletion propagation are mandatory. Campaign payloads never contain credentials. Provider activation is delegated to Notifications/Integrations.

## Reliability/observability
Metrics: campaign evaluation rate, audience build duration, activation success/failure, suppression rate, journey lag, conversion ingestion and retry/DLQ. Traces carry correlation/causation IDs without recipient secrets.

## Testing
Campaign state matrix, deterministic segmentation, consent/suppression, frequency caps, duplicate activation, journey restart, scheduled timing/time zones, tenant isolation, provider failures and migration compatibility.

## Completion gate
Marketing owns decisioning and orchestration intent but not delivery or analytics storage; published definitions are immutable/versioned; activations are idempotent; long-running orchestration uses Workflow rather than an embedded engine.