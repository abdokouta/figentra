---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: monetization
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024]
---
# Monetization Service — implementation plan

## Mission and boundary
Monetization owns the commercial control plane: product plans, prices, subscriptions, billing state, invoices, commercial limits and **effective entitlements**. Entitlements are an internal module/result, not a standalone service. Monetization does not own authentication, authorization policy, usage fact ingestion, notifications or analytics.

## Source tree
```text
services/monetization/src/
├── modules/{plans,prices,subscriptions,billing,invoices,entitlements,limits,providers,webhooks,reconciliation}
├── application/{commands,queries,services}
├── domain/{aggregates,value-objects,policies}
├── infrastructure/{database,cache,messaging,config}
├── presentation/{http,openapi,mappers}
├── events/
├── database/{entities,migrations,seeds}
├── app.module.ts
└── main.ts
```

## Models
`Plan(id,tenantId,key,name,status,version,currency,features,limits,createdAt,updatedAt)`
`Price(id,tenantId,planId,amountMinor,currency,interval,providerRef,status)`
`Subscription(id,tenantId,accountId,planId,status,currentPeriodStart,currentPeriodEnd,cancelAt,version)`
`SubscriptionItem(id,subscriptionId,priceId,quantity)`
`Invoice(id,tenantId,subscriptionId,status,subtotalMinor,taxMinor,totalMinor,currency,dueAt,paidAt,providerRef,version)`
`Entitlement(id,tenantId,subjectId,featureKey,source,quantity,startsAt,endsAt,version)`
`UsageLimit(id,tenantId,subjectId,featureKey,period,limit,consumed,version)`
`BillingCustomer(id,tenantId,subjectId,provider,providerCustomerRef,status)`
`ProviderEvent(id,provider,eventId,type,receivedAt,verifiedAt,processedAt,status,payloadHash)`

All monetary values use integer minor units + ISO currency. Provider IDs are opaque. Financial records are never hard deleted after finalization.

## Contracts
```ts
interface EntitlementService {
  get(ctx:RequestContext, subjectId:string, featureKey:string):Promise<EntitlementResult>;
  checkLimit(ctx:RequestContext, subjectId:string, featureKey:string, cost:number):Promise<LimitDecision>;
}
interface SubscriptionService {
  create(ctx:RequestContext,input:CreateSubscriptionInput):Promise<SubscriptionView>;
  change(ctx:RequestContext,id:string,input:ChangeSubscriptionInput):Promise<SubscriptionView>;
  cancel(ctx:RequestContext,id:string,input:CancelSubscriptionInput):Promise<SubscriptionView>;
}
interface BillingProvider {
  createCustomer(input:ProviderCustomerInput):Promise<ProviderCustomer>;
  createSubscription(input:ProviderSubscriptionInput):Promise<ProviderSubscription>;
  changeSubscription(input:ProviderChangeInput):Promise<ProviderSubscription>;
  cancelSubscription(input:ProviderCancelInput):Promise<ProviderSubscription>;
  verifyWebhook(input:unknown, signature:string):Promise<VerifiedProviderEvent>;
}
```

DTOs: `CreatePlanDto`, `UpdatePlanDto`, `CreatePriceDto`, `CreateSubscriptionDto`, `ChangeSubscriptionDto`, `CancelSubscriptionDto`, `InvoiceQueryDto`, `EntitlementCheckDto`, `UsageLimitCheckDto`, `BillingWebhookDto` and provider-normalization DTOs.

## HTTP controllers
```text
GET    /v1/plans
POST   /v1/plans
GET    /v1/plans/:id
PATCH  /v1/plans/:id
DELETE /v1/plans/:id
POST   /v1/plans/:id/prices
PATCH  /v1/prices/:id
POST   /v1/subscriptions
GET    /v1/subscriptions/:id
PATCH  /v1/subscriptions/:id
POST   /v1/subscriptions/:id/cancel
GET    /v1/invoices
GET    /v1/invoices/:id
POST   /v1/entitlements/check
POST   /v1/usage/authorize
POST   /v1/webhooks/billing/:provider
```

## Cross-service interactions
Identity establishes principal/session context. Tenant validates tenant status/ownership context. IAM authorizes plan administration and subscription operations. Usage publishes authoritative consumption facts; Monetization consumes only the usage contract necessary for commercial limits/billing. Notifications delivers billing communications but is never called from a database transaction. Audit receives finalized commercial mutations after commit.

Monetization is authoritative for the **commercial** decision. IAM can consume `EntitlementResult` as one input to an authorization check but does not recreate it.

## Subscription and billing correctness
Subscription transitions are explicit: `trialing → active → past_due → canceled → expired` with guarded transitions. Local state cannot become paid solely because an API call was made; verified provider confirmation is required. Provider webhooks are deduplicated by `(provider,eventId)` and signature-verified before persistence. Every external mutation accepts an idempotency key.

Entitlements are recalculated from plan + subscription + explicit commercial grants and versioned. A stale cache can reduce availability only; it cannot grant access after expiry. Limit consumption uses atomic compare-and-set/transaction semantics for race safety.

## Persistence
PostgreSQL tables listed above plus `outbox`. Required indexes cover `(tenant_id,status)`, subscription period boundaries, `(tenant_id,subject_id,feature_key)`, provider references and webhook event IDs. Unique keys prevent duplicated provider events and active commercial records.

Migrations use expand/contract. Invoice and payment-history schemas are append-safe. Reconciliation jobs rebuild derived entitlement/limit state from authoritative records without silently changing financial history.

## Provider boundary
Each payment/billing provider implements `BillingProvider`. Provider SDK types never leave adapters. A production environment must name at least one real provider implementation; an unconfigured provider cannot silently behave as success. Sandbox/test providers are test-only and cannot be selected by production configuration.

## Security/compliance
No raw card/payment credentials are stored. Webhooks require signature verification and replay protection. Provider credentials are secret-manager references. Tenant isolation applies to every commercial row/query. Audit payloads contain action/result metadata rather than payment secrets. Financial exports require explicit IAM permission and bounded date ranges.

## Runtime roles
`api` serves catalog/subscription/invoice/entitlement queries and authorized mutations. `consumer` processes verified provider events. `worker` performs entitlement rebuild, reconciliation and provider state repair. `scheduler` runs renewal/expiry and retention jobs. All roles share one service source tree.

## Reliability
Provider calls have explicit connect/read/deadline limits and bounded retry rules based on idempotency. Webhook processing is at-least-once and resumable. Reconciliation detects drift between local and provider state. Failed jobs are retried with bounded exponential backoff and DLQ after the retry budget. No infinite retry loop.

## Observability
Metrics: provider latency/failure rate, webhook lag/duplicates, payment transition failures, entitlement latency, limit conflicts, reconciliation drift and invoice generation duration. OTel spans redact provider headers, tokens and payment identifiers. Financial mutation audit events include actor, tenant, aggregate, action and result.

## Testing
Subscription transition matrix; entitlement derivation; atomic usage-limit consumption; idempotent external mutations; webhook signature/replay/deduplication; provider contract fixtures; invoice calculation; tenant isolation; concurrent subscription changes; reconciliation recovery; migration compatibility; load tests for entitlement checks.

## Implementation phases
1. Contracts, service scaffold, config and database.
2. Plans/prices and catalog administration.
3. Subscription lifecycle + billing-provider adapter.
4. Invoices/webhooks/idempotency/reconciliation.
5. Entitlement and commercial-limit engine.
6. IAM/Identity/Tenant integration, audit/outbox and workers.
7. Security, failure-injection, load testing and production rollout.

## Exit criteria
- One authoritative Monetization service resolves commercial access.
- No standalone Entitlements service remains.
- Payment/provider state cannot be forged through local API success alone.
- All provider events are verified and deduplicated.
- Entitlement/limit decisions are deterministic and tenant-isolated.
- Financial and commercial mutation paths are auditable, migration-safe and tested.
