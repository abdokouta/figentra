---
status: canonical
component: service
service: monetization
version: v1
runtime: nestjs
---
# Monetization Service — implementation-complete plan

## Mission
Own commercial configuration and effective commercial access: products/plans, subscriptions, pricing, billing state, usage allowances and entitlements. Entitlements are not a separate service; they are the effective access result produced here.

## Modules
`catalog`, `plans`, `pricing`, `subscriptions`, `billing`, `invoices`, `entitlements`, `limits`, `providers`, `webhooks`, `persistence`.

## Models and relations
`Plan(id,tenantId,key,name,version,status,currency,interval,features,limits)`; `Price(id,planId,amountMinor,currency,interval,providerRef)`; `Subscription(id,tenantId,accountId,planId,status,currentPeriodStart,currentPeriodEnd,cancelAt)`; `Invoice(id,tenantId,subscriptionId,status,totalMinor,dueAt,providerRef)`; `Entitlement(id,tenantId,subjectId,featureKey,source,quantity,startsAt,endsAt,version)`; `UsageLimit(id,tenantId,subjectId,featureKey,period,limit,consumed)`. Plans contain prices; subscriptions reference plans; invoices reference subscription; entitlements are derived commercial grants.

## DTOs
Create/update plan, price, subscription checkout/change/cancel, invoice query, entitlement check, usage allowance and provider webhook DTOs. Webhook DTOs are provider-versioned and normalized immediately; provider payloads never leak to domain contracts.

## Interfaces
```ts
interface MonetizationService { getEntitlement(ctx,subjectId,feature):Promise<EntitlementResult>; checkLimit(ctx,subjectId,feature,cost):Promise<LimitDecision>; }
interface SubscriptionService { create(ctx,input):Promise<Subscription>; change(ctx,id,input):Promise<Subscription>; cancel(ctx,id,input):Promise<Subscription>; }
interface BillingProvider { createCustomer(...):Promise<ProviderCustomer>; createSubscription(...):Promise<ProviderSubscription>; verifyWebhook(input):Promise<VerifiedWebhook>; }
```

## Controllers
`GET/POST/PATCH/DELETE /v1/plans`; `GET/POST/PATCH /v1/prices`; `POST /v1/subscriptions`; `PATCH /v1/subscriptions/:id`; `POST /v1/subscriptions/:id/cancel`; `GET /v1/invoices`; `POST /v1/entitlements/check`; `POST /v1/usage/authorize`; provider webhooks under `/v1/webhooks/billing/:provider`.

## Identity/IAM/Tenant calls
Identity establishes principal and tenant context. IAM authorizes plan administration and subscription actions. Tenant is consulted for tenant status/billing ownership. Monetization never authenticates users or stores role/permission tables. Feature access decisions can be cached but authoritative entitlement state remains PostgreSQL.

## Commercial correctness
Subscription state transitions are explicit and idempotent. Provider webhook processing uses provider event IDs for deduplication. Entitlements are recalculated from authoritative subscription/plan state and versioned. A failed billing provider call cannot create a local “paid” state without verified provider confirmation.

## Persistence
PostgreSQL tables: `plans`, `prices`, `subscriptions`, `subscription_items`, `invoices`, `entitlements`, `usage_limits`, `billing_customers`, `provider_events`, `outbox`. Unique tenant/key and provider-event constraints. Monetary amounts stored in minor units with currency.

## Workers
NestJS consumer handles verified billing events; worker reconciles provider state and entitlement materialization; scheduler handles renewals/expiry/reconciliation with bounded batches. No standalone worker codebase.

## Security
Webhook signature verification, secret references, PCI boundary avoidance, no raw payment credentials, tenant isolation, immutable financial records, idempotency keys and strict provider allowlists.

## Reliability/observability
Track billing provider latency/failures, webhook lag/duplicates, subscription transition failures, entitlement evaluation latency and reconciliation drift. Financial mutations produce audit events and outbox messages transactionally.

## Testing
Subscription transition matrix; entitlement derivation; limit atomicity; webhook signature/deduplication; provider contract fixtures; failed-payment recovery; tenant isolation; concurrent plan changes; migration compatibility; reconciliation tests.

## Completion gate
All commercial access is resolved here; no `entitlements` service remains; every provider is a real adapter with verification tests; no payment credential enters application persistence.