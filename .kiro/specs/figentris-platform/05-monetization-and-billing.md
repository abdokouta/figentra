# 05 — Monetization & Hierarchical Billing

**Status:** Baseline
**Owner:** Monetization service
**Runtime:** Cloudflare Container + NestJS · **Store:** Supabase PostgreSQL
**Related:** [04 IAM](04-iam-and-authorization.md), [03 Tenancy](03-tenancy-and-domains.md), [17 Security](17-security-and-compliance.md)

---

## 1. Purpose & naming

One bounded service owns the entire commercial domain. It is called
**Monetization**, not `subscription-service` (subscription is one part) and not
`commerce` (that name is reserved for the Commerce **application**).

Monetization answers: **what has the tenant purchased, what capabilities are
available, and who pays?**

---

## 2. Scope (one service, many modules)

The following concepts are strongly related and therefore start as **modules in
one service**, not separate deployments:

```text
Product → Plan → Subscription → Entitlements → Usage/Metering → Billing → Invoice
```

```text
monetization-service
├── catalog          products, plans, pricing
├── subscriptions    subscription lifecycle
├── billing          billing accounts, hierarchy, payment provider adapter
├── invoices         invoice generation, credit notes
├── entitlements     capability + quota resolution
├── metering         usage-event ingestion
├── usage            usage aggregation / rollups
└── credits          credit balances, grants
```

Extract `billing-service`, `entitlement-service`, or `usage-service` later only
for a measurable reason (volume, independent scaling, team ownership).

---

## 3. Catalog: products, plans, pricing

```text
products
--------
id            prod_...
key
name
description
status        active | retired
created_at

plans
-----
id            plan_...
product_id    prod_...
key           e.g. enterprise
name
interval      month | year | one_time
price_amount  minor units (e.g. cents)
currency
status        active | retired
entitlements  JSON (capability + quota template applied on subscribe)
created_at

prices        -- optional: multi-currency / regional pricing per plan
------
id            price_...
plan_id       plan_...
currency
amount
region        nullable
```

Plans carry an **entitlements template** — the set of capabilities/quotas
granted when a tenant subscribes. Applications never hard-code plans; they ask
for entitlements ([§7](#7-entitlements)).

---

## 4. Billing hierarchy (R-3)

The reference commercial hierarchy is:

```text
Figentra          (company / platform vendor — top)
   │
Academorix        (product / reseller account)
   │
Barcelona         (customer organization)
   │
Parent            (end payer / responsible account)
```

This is a **commercial** hierarchy, not the organizational hierarchy. The two
are modeled **separately**:

```text
ORGANIZATION HIERARCHY            BILLING HIERARCHY
(who structurally belongs         (who pays / who is billed for whom)
 to whom — Supabase Auth orgs/tenants)
        │                                 │
   Tenant / Orgs                    Billing Accounts (parent/child tree)
```

### 4.1 Billing account model

```text
billing_accounts
----------------
id                bacc_...
parent_id         bacc_... | null      (self-referential → hierarchy)
owner_tenant_id   ten_...              (the tenant that "owns" this account)
payer             self | parent | bacc_...  (who is financially responsible)
provider          stripe | paddle
external_customer_id
currency
billing_profile   JSON (tax id, address, contacts)
status            active | past_due | suspended | closed
created_at
updated_at
```

Hierarchy example:

```text
Parent billing account (bacc_parent, payer = self)
├── Academorix child account (bacc_acad, payer = parent)
│    ├── Subscription
│    ├── Usage
│    └── Entitlements
└── Barcelona child account (bacc_barca, payer = parent)
     ├── Subscription
     ├── Usage
     └── Entitlements
```

### 4.2 Billing responsibility (payer ≠ owner)

Several roles can differ and are tracked explicitly:

| Role              | Meaning                                            |
| ----------------- | -------------------------------------------------- |
| Resource owner    | Tenant that owns the resource/application          |
| Subscription owner| Billing account the subscription belongs to        |
| **Payer**         | Account financially responsible (may be an ancestor)|
| Invoice recipient | Who receives the invoice                           |
| Payment account   | Which provider customer is charged                 |
| Usage owner       | Which account's usage is being metered             |

Example: **Parent pays**, **Academorix owns the application**, **Barcelona
consumes the service**. Resolution walks the `payer` chain up to the responsible
account.

> **Do not** let a payment provider's customer/subscription hierarchy become the
> domain model. Figentra owns the hierarchy; Stripe/Paddle are processors
> ([§9](#9-payment-provider-integration)).

---

## 5. Subscriptions

```text
subscriptions
-------------
id                   sub_...
tenant_id            ten_...
billing_account_id   bacc_...
plan_id              plan_...
status               trialing | active | past_due | canceled | grace_period | lapsed
start_at
current_period_start
current_period_end
cancel_at            nullable
created_at
updated_at
```

Billing is **account/tenant-centric**, never user-centric (unless a product
explicitly supports individual consumers):

```text
Billing Account → Subscription → Plan   (preferred)
User → Subscription                      (only for B2C products)
```

Lifecycle emits `subscription.created`, `subscription.updated`,
`subscription.canceled`, each of which projects into entitlements + access caches
([04 §9](04-iam-and-authorization.md), [11](11-events-and-workflows.md)).

---

## 6. Five distinct consumption concepts

These must never be conflated (they answer different questions):

| Concept        | Question                              | Owner        | Example                       |
| -------------- | ------------------------------------- | ------------ | ----------------------------- |
| **Permission** | Can the actor do this action?         | IAM          | `crm.export`                  |
| **Entitlement**| Has the tenant enabled this capability?| Monetization | `crm.exports = true`          |
| **Quota**      | How much is allowed in a period?      | Monetization | `10,000 exports / month`      |
| **Rate limit** | How fast is allowed?                  | Gateway/edge | `10 export requests / minute` |
| **Usage**      | How much has been consumed?           | Monetization | `7,245 exports consumed`      |

---

## 7. Entitlements

Entitlements answer "does the tenant have this capability?" They may be boolean,
integer, decimal, string, or structured config.

```text
entitlements
------------
id            ent_...
tenant_id     ten_...
application   e.g. crm
key           e.g. crm.ai | crm.max_users
value         JSON (bool | number | string | object)
source        plan | override | grant
subscription_id nullable
updated_at
```

Example set:

```text
crm.ai                    = true
crm.max_users             = 500
commerce.max_products     = 100000
commerce.advanced_reports = true
pos.terminals             = 50
analytics.advanced        = true
api.requests_per_minute   = 10000
```

Resolution API:

```text
GET /v1/tenants/:id/entitlements
GET /v1/tenants/:id/entitlements/:key
```

The IAM/SDK `requireEntitlement('crm.ai')` and `getEntitlement('crm.max_users')`
helpers wrap these ([04 §6.1](04-iam-and-authorization.md)). Entitlements resolve
against the tenant; where a capability is inherited down a billing hierarchy, the
resolver may consult the parent account's plan (documented per-capability).

---

## 8. Metering & usage

Applications emit usage events; Monetization ingests, aggregates, and exposes.

```json
{
  "tenantId": "ten_123",
  "application": "crm",
  "metric": "ai_requests",
  "quantity": 1,
  "timestamp": "2026-08-30T00:00:00Z",
  "idempotencyKey": "usage_evt_abc"
}
```

Common metrics: `ai_requests`, `api_requests`, `storage_bytes`,
`documents_processed`, `orders`, `active_users`, `tokens`, `messages`.

```text
usage_events                     usage_rollups
------------                     -------------
id                               tenant_id
tenant_id                        application
application                      metric
metric                           period (day/month)
quantity                         total
timestamp                        updated_at
idempotency_key (unique)
```

Ingestion is idempotent (dedupe on `idempotency_key`). At high scale, usage
ingestion extracts into a `usage-service` behind a queue
([11](11-events-and-workflows.md)); the API contract stays stable.

```text
POST /v1/usage                  -- single or batch usage events
POST /v1/metering/events        -- alias / bulk ingest
GET  /v1/tenants/:id/usage?metric=ai_requests&period=2026-08
```

---

## 9. Payment provider integration

Payment providers sit **behind an adapter**. Provider-specific logic never leaks
into applications or the domain.

```text
Monetization
   │
   ▼
BillingGateway (adapter interface)
   │
   ├── StripeAdapter
   └── PaddleAdapter
```

Billing operations are **idempotent** and tolerate provider retries via
`idempotency_key` / `provider_event_id` / `external_event_id`. Provider webhooks
(`payment.completed`, `invoice.created`, `subscription.updated`) are verified
(signature) and deduplicated before processing ([17](17-security-and-compliance.md)).

---

## 10. Invoices & credits

```text
invoices                          credits
--------                          -------
id            inv_...             id            cred_...
billing_account_id                billing_account_id / tenant_id
recipient_account_id              amount (minor units)
period                            currency
line_items    JSON                reason
subtotal / tax / total            expires_at
currency                          balance
status  draft|open|paid|void      created_at
provider_invoice_id
created_at
```

The invoice `recipient_account_id` follows the `payer` chain from
[§4.2](#42-billing-responsibility-payer--owner). Credit notes and refunds are
recorded here; the actual money movement is the provider adapter's job.

---

## 11. Two billing domains (do not mix)

There are **two** distinct billing concerns; keep them separate:

```text
Figentra Revenue                Figentra Infrastructure Cost
(tenants pay Figentra)          (Figentra pays Cloudflare/Supabase/Stripe/...)
        │                                 │
        ▼                                 ▼
   Tenant Billing                       FinOps
   (this service)                (Operations plane, P2 — [16]/[20])
```

Also distinct from **`Finance` inside an application** (e.g. a parent paying an
academy) — that runs on the application/tenant's own processor account, not
Figentra's, and is application domain, not platform monetization.

---

## 12. Core APIs

```text
GET  /v1/plans
GET  /v1/tenants/:id/subscription
GET  /v1/tenants/:id/entitlements
POST /v1/tenants/:id/subscriptions
POST /v1/billing-accounts
GET  /v1/billing-accounts/:id
POST /v1/usage
POST /v1/metering/events
GET  /v1/tenants/:id/invoices
```

---

## 13. Events

**Emitted:** `subscription.created`, `subscription.updated`,
`subscription.canceled`, `entitlement.changed`, `usage.recorded`,
`invoice.created`, `payment.completed`, `payment.failed`.

**Consumed:** `tenant.created` (create default billing account + subscription +
entitlements), `application.enabled` (apply application entitlements),
`usage.recorded` (own event, for rollups) — provider webhooks are ingested via
the gateway then re-emitted internally.

---

## 14. Non-goals / anti-patterns

| Anti-pattern                                                       | Correct                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Naming this `subscription-service` or `commerce`                   | `monetization-service`; `commerce` = the application.        |
| Letting Stripe/Paddle define the domain hierarchy                  | Figentra owns billing hierarchy; providers are adapters.    |
| Conflating permission / entitlement / quota / rate-limit / usage   | Five distinct concepts, [§6](#6-five-distinct-consumption-concepts). |
| Merging org hierarchy and billing hierarchy                        | Two separate trees ([§4](#4-billing-hierarchy-r-3)).          |
| User-centric subscriptions for B2B products                        | Account/tenant-centric.                                      |
| Non-idempotent billing/usage processing                           | `idempotency_key` on every mutation + webhook.               |
| Applications hard-coding plan names                                | Ask for entitlements.                                        |
| Mixing tenant billing with Figentra infra FinOps                  | Two separate domains ([§11](#11-two-billing-domains-do-not-mix)). |

---

## 15. Open questions

- **O-3** — Primary payment processor at launch (Stripe or Paddle)? Affects the
  first adapter and webhook surface.
- **O-4** — Does billing responsibility (payer ≠ owner, full hierarchy) ship in
  v1 or v1.1? The tables are defined now; the resolution logic may phase in.
- Confirm whether entitlement inheritance down the billing hierarchy is
  automatic or per-capability opt-in.
