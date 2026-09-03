# 03 — Tenancy & Domains

**Status:** Baseline **Owner:** Tenant service **Related:**
[02 Identity & actors](02-identity-and-actors.md),
[04 IAM](04-iam-and-authorization.md),
[14 Data & persistence](14-data-and-persistence.md)

---

## 1. Purpose

The Tenant service owns the **business/resource ownership boundary** and the
**domain → tenant → application** routing relationship. Domains start as a
module inside the Tenant service, not a separate microservice.

---

## 2. Supabase Auth Organization vs Figentra Tenant

Related but intentionally distinct concepts.

| Supabase Auth Organization (`org_…`)       | Figentra Tenant (`ten_…`)                             |
| ------------------------------------------ | ----------------------------------------------------- |
| Identity/access organization               | Business / resource ownership boundary                |
| Owns membership + org roles + auth context | Owns config, region, domains, billing ref, app access |
| Managed by Supabase Auth                   | Managed by the Tenant service                         |

```text
Supabase Auth Organization
        │  1:1 initially (do not assume permanently 1:1)
        ▼
Figentra Tenant
        ├── configuration (region, timezone, currency, data residency)
        ├── status (active | suspended | ...)
        ├── domains
        ├── application access (via IAM)
        ├── billing account reference (→ Monetization)
        └── subscription reference (→ Monetization)
```

**Rule:** never treat the application as the tenant; never treat Supabase Auth
as the full Figentra business domain.

### 2.1 Tenant record

```json
{
  "id": "ten_123",
  "supabaseOrganizationId": "org_456",
  "name": "Acme Corporation",
  "status": "active",
  "region": "me-central",
  "timezone": "Asia/Riyadh",
  "currency": "SAR",
  "dataResidency": "me-central",
  "billingAccountId": "bacc_789",
  "createdAt": "2026-08-30T00:00:00Z",
  "updatedAt": "2026-08-30T00:00:00Z"
}
```

```text
tenants
-------
id                 ten_...
supabase_org_id       org_...  (unique, trusted mapping)
name
status             active | suspended | pending | archived
region
timezone
currency
data_residency
billing_account_id bacc_...  (reference; owned by Monetization)
created_at
updated_at
```

---

## 3. Responsibilities

**Tenant service owns:**

- Tenant lifecycle (create, update, suspend, archive)
- Supabase Auth Organization → Tenant mapping
- Tenant configuration (region, timezone, currency, data residency, metadata)
- Tenant status
- Domains (ownership, verification, mapping)
- Hostname → tenant → application resolution metadata
- Tenant routing context

**Tenant service does NOT own:**

- Authentication or org membership (Supabase Auth)
- Roles/permissions/authorization (IAM)
- Plans/subscriptions/billing/entitlements (Monetization) — it only holds a
  reference to the billing account
- Application business logic or data (each application)

---

## 4. Domain model (combined with Tenant initially)

Domain is a module inside the Tenant service. Extract to its own service only if
DNS/certificate/routing infrastructure becomes an independent scaling or
security boundary.

```text
domains
-------
id                    dom_...
tenant_id             ten_...
hostname              e.g. crm.acme.com | acme.figentra.com
type                  platform | tenant | application | custom
application_id        nullable (set when the domain maps to a specific app)
verification_status   pending | verified | failed
is_primary            bool
created_at
updated_at
```

Domain types:

| Type          | Example             | Notes                                  |
| ------------- | ------------------- | -------------------------------------- |
| `platform`    | `app.figentra.com`  | Platform-owned surface.                |
| `tenant`      | `acme.figentra.com` | Tenant subdomain of the platform apex. |
| `application` | `crm.figentra.com`  | Maps to a specific application.        |
| `custom`      | `crm.acme.com`      | Tenant-owned custom domain (verified). |

---

## 5. Hostname resolution

The platform resolves:

```text
hostname → tenant → application
```

Examples:

```text
crm.acme.com
   ├── tenant       = ten_acme
   └── application  = crm

acme.figentra.com
   └── tenant       = ten_acme   (application resolved from path/route)
```

Resolution API (Tenant service):

```text
GET /v1/resolve?hostname=crm.acme.com
→ { "tenantId": "ten_acme", "applicationKey": "crm", "domainType": "custom", "verified": true }
```

The resolver is read-heavy and cache-friendly (KV / edge cache at the gateway).
Resolution results feed the request identity context
([02](02-identity-and-actors.md) §4) — the browser never supplies the tenant.

---

## 6. Custom-domain verification

A custom domain is not activated until ownership is proven.

```text
Custom domain added (status = pending)
        │
        ▼
Verification challenge issued
   • DNS TXT record  (primary), and/or
   • HTTP file challenge
        │
        ▼
Verification check (async, retried)
        │
   ┌────┴─────┐
   ▼          ▼
verified    failed → retry / surface error
   │
   ▼
Tenant mapping activated → certificate + routing provisioned via edge/CDN
```

Rules:

- Do not route traffic for an unverified custom domain.
- Certificates and routing are managed through the edge/CDN infrastructure
  (Cloudflare); the Tenant service holds the mapping + verification state, not
  the certificate material.
- Verification is idempotent and re-runnable.

Domain lifecycle events: `domain.added`, `domain.verified`, `domain.failed`,
`domain.removed` (see [11](11-events-and-workflows.md)).

---

## 7. Core APIs

```text
GET   /v1/tenants/:id
POST  /v1/tenants
PATCH /v1/tenants/:id
POST  /v1/tenants/:id/suspend
POST  /v1/tenants/:id/domains
GET   /v1/tenants/:id/domains
POST  /v1/domains/:id/verify
DELETE /v1/domains/:id
GET   /v1/resolve?hostname=...
```

All tenant-scoped operations authorize against the caller's active tenant; a
caller can never operate on a tenant it is not a member of (enforced server-side

- RLS in [14](14-data-and-persistence.md)).

---

## 8. Tenant onboarding

```text
User signs up (Supabase Auth)
        │
        ▼
Create / select Supabase Auth organization
        │
        ▼
Tenant created (ten_…)  ── emits tenant.created
        ├── tenant configuration seeded (region/timezone/currency)
        ├── billing account created           (→ Monetization)
        ├── default subscription + entitlements(→ Monetization)
        ├── default domain assigned
        └── default application access granted (→ IAM)
        │
        ▼
Portal shows the tenant
```

Provisioning is **idempotent** — re-running onboarding for an existing tenant
does not duplicate resources. Onboarding fans out via events (`tenant.created`
consumed by IAM, Monetization, Registry, Audit) — see
[11](11-events-and-workflows.md).

---

## 9. Events

**Emitted:** `tenant.created`, `tenant.updated`, `tenant.suspended`,
`tenant.archived`, `domain.added`, `domain.verified`, `domain.failed`,
`domain.removed`.

**Consumed:** `subscription.updated` / `entitlement.changed` (to reflect tenant
status where relevant), `organization.updated` (Supabase Auth webhook → mapping
sync).

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                      | Correct                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| Treating the application as the tenant            | Tenant is a distinct platform boundary.                                   |
| A separate Domain microservice on day one         | Domain is a module inside Tenant; extract later if needed.                |
| Activating a custom domain before verification    | Verify ownership (DNS TXT / HTTP) first.                                  |
| Trusting `hostname`/`tenantId` from the client    | Resolve server-side; cache the trusted result.                            |
| Storing plans/subscriptions in the Tenant service | Tenant holds a billing-account reference only; Monetization owns billing. |
| Non-idempotent onboarding                         | Provisioning tolerates re-runs.                                           |

---

## 11. Open questions

- **O-2** — Supabase Auth org ↔ tenant 1:1 at launch vs 1:N early. If 1:N is
  needed soon, the `tenants.supabase_org_id` unique constraint becomes a join
  table and the org switcher must disambiguate tenant selection.
