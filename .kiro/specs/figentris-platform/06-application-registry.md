# 06 — Application Registry

**Status:** Baseline **Owner:** Registry **Runtime:** Cloudflare Worker + Hono ·
**Store:** D1 (+ KV for read cache) **Related:**
[01 Architecture](01-platform-architecture.md),
[07 Integration Platform](07-integration-platform.md),
[12 Versioning](12-versioning.md)

---

## 1. Purpose

The Application Registry describes **which applications exist and where they
live**. It is intentionally **lightweight** — configuration, metadata, lookup,
routing — not a heavy business service. It is a Worker + Hono over D1, not a
NestJS container.

An **application** is an independent Figentra product (CRM, Commerce, POS,
Analytics, …). The registry stores its metadata; the application owns its logic
and data. An application is **not** an integration
([07](07-integration-platform.md)).

---

## 2. Why Worker + D1

The registry is primarily high-read / low-compute: metadata lookup, routing,
CRUD. A full NestJS service would add unnecessary operational overhead.

- **D1** — application definitions, versions, environments (relational, small).
- **KV** — hot read cache for resolution paths (optional).
- **Durable Objects** — only if a future feature needs strongly consistent
  coordination (not required at baseline).

The registry stores **no business data** and performs **no** authorization
decisions (that is IAM).

---

## 3. What an application owns vs. does not

| Application OWNS                       | Application does NOT own                   |
| -------------------------------------- | ------------------------------------------ |
| Business logic + application API       | Authentication (Supabase Auth)             |
| Application database                   | Global tenant identity (Tenant)            |
| Application frontend                   | Global billing/subscription (Monetization) |
| Application-specific permissions/roles | Platform entitlement definitions           |
| Application-specific workflows         |                                            |
| Application deployment lifecycle       |                                            |

---

## 4. Data model

```text
applications
------------
id            app_...
key           unique slug (crm, commerce, pos, analytics)
name
slug
status        active | disabled | deprecated
icon_url
branding      JSON (colors, logo refs)
capabilities  JSON string[] (e.g. ["customers","leads","analytics","ai"])
supported_plans     JSON (plan keys this app is offered under)
required_entitlements JSON (entitlement keys gating the app)
created_at
updated_at

application_environments
------------------------
id            appenv_...
application_id app_...
environment   development | staging | production
url           e.g. https://crm.figentra.com
version       e.g. 2.4.0
status        active | maintenance | disabled
deployment_metadata JSON
updated_at

application_versions            -- optional history / compatibility
------------------
id
application_id
version
released_at
notes
```

Example record:

```json
{
  "key": "crm",
  "name": "Figentra CRM",
  "slug": "crm",
  "status": "active",
  "capabilities": ["customers", "leads", "analytics", "ai"],
  "requiredEntitlements": ["crm.enabled"],
  "environments": {
    "production": { "url": "https://crm.figentra.com", "version": "2.4.0" }
  }
}
```

---

## 5. Application manifest

Each application ships a **manifest** the registry ingests. The manifest is the
source of truth for the application's platform-facing metadata and its declared
permissions/roles/entitlements/capabilities. It ties into
[12 Versioning](12-versioning.md) (manifest version + compatibility).

```json
{
  "key": "crm",
  "name": "Figentra CRM",
  "manifestVersion": "1.0",
  "capabilities": ["customers", "leads", "analytics", "ai"],
  "permissions": [
    "crm.customer.read",
    "crm.customer.create",
    "crm.customer.update",
    "crm.customer.delete"
  ],
  "roles": [
    { "key": "crm:admin", "system": true },
    { "key": "crm:viewer", "system": true }
  ],
  "requiredEntitlements": ["crm.enabled"],
  "environments": {
    "production": "https://crm.figentra.com"
  }
}
```

On registration/update, the registry publishes the manifest's permissions/roles
to IAM (via API/event) and its entitlement keys to Monetization — the registry
does not evaluate them, it declares them.

---

## 6. Core APIs

```text
GET   /v1/applications
GET   /v1/applications/:key
POST  /v1/applications
PATCH /v1/applications/:key
GET   /v1/applications/:key/environments
POST  /v1/applications/:key/environments
```

Read paths are cache-friendly; write paths are low-frequency (release/config
changes). The portal reads the registry (filtered by IAM access + Monetization
entitlements) to build the application launcher
([13](13-frontend-architecture.md)).

---

## 7. New-application onboarding

```text
1. Author application metadata + manifest
2. Register application            (registry)
3. Declare capabilities            (manifest → registry)
4. Declare IAM permissions         (manifest → IAM)
5. Declare application roles        (manifest → IAM)
6. Declare monetization entitlements(manifest → Monetization)
7. Configure domains                (Tenant service — [03])
8. Deploy application               (Terraform + Wrangler — [15])
9. Enable application for tenant     (IAM grant + Monetization entitlement)
10. Application appears in the portal launcher
```

The golden constraint (Rule 20): adding a new application must **not** require
redesigning identity, tenant, billing, or IAM.

---

## 8. Security & trust

- The registry controls **metadata and routing**, never executable code. The
  portal must not generate arbitrary executable routes from registry data, and
  must never execute JavaScript received from the registry
  ([13](13-frontend-architecture.md)).
- The registry performs no authorization; access to an application is the
  intersection of IAM grants + Monetization entitlements.
- Application URLs are validated; only known environments/hosts are served.

---

## 9. Events

**Emitted:** `application.registered`, `application.updated`,
`application.enabled`, `application.disabled`, `application.version.released`.

**Consumed:** none required at baseline (registry is upstream of
IAM/Monetization for manifest declarations).

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                | Correct                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| Building the registry as a NestJS container | Worker + Hono + D1.                                             |
| Storing business data in the registry       | Registry = metadata/config/routing only.                        |
| Registry making authorization decisions     | IAM decides; registry declares.                                 |
| Portal executing code from the registry     | Metadata + routing only; no arbitrary JS execution.             |
| Treating an application as an integration   | Applications ≠ integrations ([07]).                             |
| Using D1 as a transactional business DB     | D1 for registry/config; Supabase for transactional data ([14]). |

---

## 11. Open questions

- Confirm whether application manifests are pulled by the registry from a known
  URL or pushed at deploy time (affects the registration pipeline in [15]).
