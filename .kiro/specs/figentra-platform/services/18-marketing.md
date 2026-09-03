# Marketing Service — Complete Implementation Specification

**Status:** Canonical / production day-one target  
**Runtime:** Node.js 22 + NestJS; API, consumer, worker and scheduler roles  
**Persistence:** PostgreSQL via MikroORM  
**Contract owner:** `@stackra/contracts`

## 1. Mission and ownership

Marketing answers **what should we do because of business/behavioral data?** It owns campaigns, audiences, segments, eligibility, journeys, schedules, suppression, activation and server-side conversion integrations.

It does not collect browser/mobile events as an SDK, own analytical facts, own notification delivery, own billing, or own source business entities.

### Owns

- Campaign
- CampaignVersion
- Audience
- AudienceMembership
- Segment
- SegmentRule
- Journey
- JourneyStep
- CampaignSchedule
- SuppressionRule
- Activation
- ConversionDefinition
- Conversion
- MarketingProviderConnection
- DeliveryAttempt

### Consumes

- Analytics facts/query contracts
- Tracking conversion events
- Tenant and Scope context
- IAM/Policy decisions
- Entitlement state
- Product-domain events
- Notification delivery status

### Calls

- **Identity:** resolve principal references only where personalization/consent context requires it; identity remains authoritative for identity.
- **Tenant:** tenant lifecycle, locale, timezone, configuration and residency.
- **Scope:** scope hierarchy and access context.
- **IAM/Policy:** authorize campaign/audience administration and execution.
- **Entitlements:** verify marketing capabilities/limits before activation.
- **Analytics:** read facts, metrics and attribution results through typed contracts.
- **Notifications:** submit delivery intents; Marketing never sends email/SMS/push directly.
- **Audit:** record campaign, audience, provider and activation security changes.
- **Files:** optional campaign assets/exports.

## 2. Architecture

```text
Tracking / Domain Events
        ↓
Analytics
        ↓
Audience evaluation
        ↓
Audience membership
        ↓
Campaign eligibility
        ↓
Journey / schedule
        ↓
Activation
   ┌────┴───────────────┐
   ↓                    ↓
Notifications       Ad/Conversion APIs
```

Marketing decisions are durable and replayable. Worker execution is idempotent and checkpointed.

## 3. Source tree

```text
services/marketing/
└── src/
    ├── marketing/
    │   ├── domain/
    │   │   ├── entities/
    │   │   ├── value-objects/
    │   │   ├── policies/
    │   │   └── events/
    │   ├── application/
    │   │   ├── commands/
    │   │   ├── queries/
    │   │   ├── services/
    │   │   └── ports/
    │   ├── infrastructure/
    │   │   ├── persistence/
    │   │   ├── messaging/
    │   │   ├── providers/
    │   │   └── activation/
    │   ├── presentation/controllers/
    │   ├── consumers/
    │   ├── workers/
    │   └── marketing.module.ts
    ├── database/migrations/
    ├── i18n/{en,ar}/
    ├── app.module.ts
    └── main.ts
```

## 4. Domain models

### Campaign

```ts
interface Campaign {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  status: 'draft'|'scheduled'|'running'|'paused'|'completed'|'archived';
  objective: 'acquisition'|'engagement'|'retention'|'conversion'|'reactivation';
  audienceId?: string;
  startAt?: string;
  endAt?: string;
  version: number;
}
```

### Audience

```ts
interface Audience {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  type: 'static'|'dynamic';
  status: 'draft'|'evaluating'|'active'|'paused'|'archived';
  ruleId?: string;
}
interface AudienceMembership {
  id: string;
  tenantId: string;
  audienceId: string;
  subjectKey: string;
  principalId?: string;
  anonymousId?: string;
  enteredAt: string;
  exitedAt?: string;
  reason?: string;
}
```

### Segment rule

Rules are represented as a validated AST, never arbitrary executable code:

```ts
interface SegmentRule {
  id: string;
  tenantId: string;
  expression: RuleNode;
  version: number;
}
type RuleNode =
  | { op: 'and'|'or'; children: RuleNode[] }
  | { op: 'not'; child: RuleNode }
  | { op: 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'|'contains'; field: string; value: unknown }
  | { op: 'event_count'; event: string; windowSeconds: number; operator: string; value: number };
```

No user-provided rule can execute SQL, JavaScript, shell commands or provider code.

### Journey

```ts
interface Journey {
  id: string;
  tenantId: string;
  campaignId: string;
  status: 'draft'|'active'|'paused'|'completed'|'archived';
  entryAudienceId: string;
  version: number;
}
interface JourneyStep {
  id: string;
  journeyId: string;
  sequence: number;
  type: 'wait'|'condition'|'notification'|'webhook'|'activation'|'exit';
  config: Record<string, unknown>;
}
```

## 5. DTOs

```ts
interface CreateCampaignDto {
  key: string;
  name: string;
  objective: Campaign['objective'];
  audienceId?: string;
  startAt?: string;
  endAt?: string;
}
interface CreateAudienceDto {
  key: string;
  name: string;
  type: Audience['type'];
  rule?: RuleNode;
}
interface EvaluateAudienceDto { audienceId: string; cursor?: string; batchSize?: number; }
interface ScheduleCampaignDto { campaignId: string; startAt: string; endAt?: string; timezone: string; }
interface ActivateCampaignDto { campaignId: string; channels: ActivationChannel[]; dryRun?: boolean; }
interface ActivationChannel { type: 'notification'|'webhook'|'ad_conversion'; providerKey?: string; config: Record<string, unknown>; }
```

## 6. Application interfaces / methods

```ts
interface CampaignService {
  create(input: CreateCampaignDto, ctx: RequestContext): Promise<CampaignDto>;
  get(id: string, ctx: RequestContext): Promise<CampaignDto>;
  list(query: CampaignListQuery, ctx: RequestContext): Promise<Page<CampaignDto>>;
  update(id: string, input: UpdateCampaignDto, ctx: RequestContext): Promise<CampaignDto>;
  schedule(input: ScheduleCampaignDto, ctx: RequestContext): Promise<CampaignDto>;
  pause(id: string, ctx: RequestContext): Promise<void>;
  resume(id: string, ctx: RequestContext): Promise<void>;
  cancel(id: string, ctx: RequestContext): Promise<void>;
}

interface AudienceService {
  create(input: CreateAudienceDto, ctx: RequestContext): Promise<AudienceDto>;
  get(id: string, ctx: RequestContext): Promise<AudienceDto>;
  evaluate(id: string, ctx: RequestContext): Promise<EvaluationJobDto>;
  getMembership(id: string, subjectKey: string, ctx: RequestContext): Promise<MembershipDto | null>;
  listMembers(id: string, query: PageQuery, ctx: RequestContext): Promise<Page<MembershipDto>>;
}

interface JourneyService {
  create(input: CreateJourneyDto, ctx: RequestContext): Promise<JourneyDto>;
  activate(id: string, ctx: RequestContext): Promise<void>;
  pause(id: string, ctx: RequestContext): Promise<void>;
  addStep(id: string, input: CreateJourneyStepDto, ctx: RequestContext): Promise<JourneyStepDto>;
  removeStep(id: string, stepId: string, ctx: RequestContext): Promise<void>;
}

interface ActivationService {
  preview(input: ActivateCampaignDto, ctx: RequestContext): Promise<ActivationPreview>;
  activate(input: ActivateCampaignDto, ctx: RequestContext): Promise<ActivationBatchDto>;
  retry(id: string, ctx: RequestContext): Promise<void>;
  reconcile(id: string, ctx: RequestContext): Promise<ReconciliationResult>;
}
```

## 7. Controllers / API

### CampaignController

```text
GET    /v1/marketing/campaigns
POST   /v1/marketing/campaigns
GET    /v1/marketing/campaigns/:id
PATCH  /v1/marketing/campaigns/:id
POST   /v1/marketing/campaigns/:id/schedule
POST   /v1/marketing/campaigns/:id/pause
POST   /v1/marketing/campaigns/:id/resume
POST   /v1/marketing/campaigns/:id/cancel
POST   /v1/marketing/campaigns/:id/preview
POST   /v1/marketing/campaigns/:id/activate
```

### AudienceController

```text
GET    /v1/marketing/audiences
POST   /v1/marketing/audiences
GET    /v1/marketing/audiences/:id
PATCH  /v1/marketing/audiences/:id
POST   /v1/marketing/audiences/:id/evaluate
GET    /v1/marketing/audiences/:id/members
GET    /v1/marketing/audiences/:id/members/:subjectKey
```

### JourneyController

```text
POST   /v1/marketing/journeys
GET    /v1/marketing/journeys/:id
POST   /v1/marketing/journeys/:id/activate
POST   /v1/marketing/journeys/:id/pause
POST   /v1/marketing/journeys/:id/steps
DELETE /v1/marketing/journeys/:id/steps/:stepId
```

### ProviderController

```text
GET    /v1/marketing/providers
POST   /v1/marketing/providers/:key/connect
POST   /v1/marketing/providers/:key/test
DELETE /v1/marketing/providers/:key
```

## 8. Worker roles

### AudienceEvaluationWorker

Reads analytics through bounded query contracts, evaluates rule ASTs, writes membership changes and checkpoints batches.

### CampaignScheduler

Claims due schedules using database locking/lease semantics and emits activation commands.

### JourneyWorker

Claims due journey steps, evaluates conditions and creates notification/activation intents.

### ActivationWorker

Calls Notifications or external conversion providers through adapters. Provider calls are idempotency-aware where supported and reconciled where not.

### ReconciliationWorker

Compares activation state with provider/delivery outcomes and repairs retryable divergence.

## 9. Persistence

```text
marketing_campaign
marketing_campaign_version
marketing_audience
marketing_segment_rule
marketing_audience_membership
marketing_journey
marketing_journey_step
marketing_campaign_schedule
marketing_suppression_rule
marketing_activation
marketing_conversion_definition
marketing_conversion
marketing_provider_connection
marketing_delivery_attempt
marketing_job_checkpoint
```

Core indexes:

```text
unique(tenant_id, key)
(tenant_id, status, start_at)
(tenant_id, audience_id, subject_key)
(journey_id, sequence)
(tenant_id, scheduled_at, status)
```

Secrets for provider connections are references to secret storage, never plaintext columns.

## 10. Relations

```text
Identity ──principal──→ Marketing
Tenant ─────────────────→ Marketing
Scope ──────────────────→ Marketing
IAM/Policy ─────────────→ Marketing authorization
Entitlements ───────────→ Marketing capability limits
Tracking ───────────────→ Analytics ──→ Marketing
Marketing ──────────────→ Notifications
Marketing ──────────────→ external activation providers
Marketing ──────────────→ Audit
```

### Critical call sequence

```text
Request
 ↓
Gateway
 ↓
Marketing authentication/context
 ↓
IAM.authorize(principal, tenant, scope, action, resource)
 ↓
Entitlements.check(tenant, capability)
 ↓
Marketing use case
 ↓
Analytics query / domain contracts
 ↓
transaction + outbox
 ↓
worker
 ↓
Notifications / provider adapter
 ↓
Audit + analytics conversion event
```

Marketing MUST NOT call Identity for permission decisions. It calls Identity only for identity/authentication context operations defined by the identity contract.

## 11. Consent and suppression

Marketing MUST respect the canonical consent/privacy contracts. Suppression is checked before every activation and again at execution time for asynchronous work.

```text
eligible
 + entitlement
 + consent
 + suppression=false
 + channel eligibility
 + frequency cap
 → activate
```

A stale audience membership is never sufficient to bypass current suppression/consent checks.

## 12. Security

- IAM authorization on all administrative endpoints.
- Tenant isolation at application and DB/RLS layers.
- Provider secrets externalized.
- Rule AST allowlisted and bounded.
- Audience evaluation resource limits: max depth, nodes, query window and batch size.
- No arbitrary SQL or code execution.
- Security-sensitive provider/campaign changes audited.
- External webhooks verified and idempotent.

## 13. Reliability / concurrency

- at-least-once event processing
- unique activation idempotency keys
- leased job claims
- optimistic campaign/journey versioning
- retryable vs permanent error classification
- DLQ for poison jobs
- provider circuit breakers/timeouts
- checkpointed audience evaluation
- reconciliation after partial external failure
- never activate a cancelled/paused campaign after a stale job claim

## 14. Events

Owned events:

```text
marketing.campaign.created.v1
marketing.campaign.scheduled.v1
marketing.campaign.started.v1
marketing.campaign.paused.v1
marketing.campaign.completed.v1
marketing.audience.updated.v1
marketing.audience.membership.changed.v1
marketing.activation.requested.v1
marketing.activation.completed.v1
marketing.activation.failed.v1
marketing.conversion.recorded.v1
```

Inbound events are consumed through versioned `@stackra/contracts` envelopes. Marketing never publishes raw tracking payloads as domain events.

## 15. Observability

Metrics:

```text
campaigns_active
campaigns_scheduled
audience_evaluation_duration
membership_changes
activation_requested
activation_success_rate
activation_failure_rate
provider_latency
provider_rate_limit_count
journey_step_lag
suppression_count
```

Trace activation across Marketing → Notifications/provider and propagate correlation/causation IDs. Never emit provider secrets or audience PII into logs/traces.

## 16. Testing

Unit: campaign state machine, rule AST, eligibility, consent/suppression, frequency caps, scheduling.  
Integration: PostgreSQL, RLS, Analytics contract, Entitlements contract, Notifications contract, provider adapters.  
Contract: OpenAPI, events, provider adapter interfaces.  
E2E: create → audience → schedule → worker → notification, cancellation race, duplicate delivery, tenant isolation, revoked entitlement, suppression at execution time.

## 17. Definition of done

All models, DTOs, repositories, use cases, controllers, workers, scheduler, provider adapters, migrations, contracts, security checks, consent/suppression enforcement, audit integration, observability, retry/DLQ/reconciliation and tests are specified as implementation contracts. No business behavior is left to an unspecified future design decision.
