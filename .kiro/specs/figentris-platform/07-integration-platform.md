# 07 — Integration Platform

**Status:** Baseline (core), Draft (marketplace) **Owner:** Integration Platform
**Runtime:** Cloudflare Container + NestJS (core) · Worker + Hono (edge
ingress/webhooks) **Related:**
[06 Application Registry](06-application-registry.md),
[02 Identity & actors](02-identity-and-actors.md),
[11 Events & workflows](11-events-and-workflows.md)

---

## 1. Purpose

The Integration Platform lets a tenant connect Figentra (and its applications)
to **third-party systems** — install, connect, configure, pause, and disconnect
integrations, with credentials isolated from the registry and the frontend.

---

## 2. Applications ≠ Integrations (R-9)

This distinction is fundamental.

|              | Application                           | Integration                                                                     |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------- |
| What         | A Figentra product (CRM, Commerce, …) | A connection to a third-party system (Slack, Stripe, HubSpot, a webhook target) |
| Owns         | Business logic + data + UI            | Connection config + credentials + sync rules                                    |
| Registry     | Application Registry ([06])           | Integration catalog (this doc)                                                  |
| Actor        | Users/service accounts                | **Integration Actor** ([02] §3)                                                 |
| Availability | IAM access + entitlement              | Entitlement + **installation** + **connection state**                           |

An application is something Figentra **runs**; an integration is something a
tenant **connects to**.

---

## 3. Marketplace scope

The marketplace can eventually contain four listing kinds. Only Integrations are
in baseline scope; the others are recognized future kinds.

```text
Marketplace
├── Applications   (Figentra products — listed, installed/enabled per tenant)
├── Integrations   (third-party connectors — this doc, baseline)
├── Extensions     (future: extend an application's behavior)
└── Connectors     (future: data/event connectors)
```

Marketplace UI + Extensions/Connectors are **Draft/deferred**; the integration
install/connect lifecycle is baseline.

---

## 4. Availability model

An integration's actual availability for a tenant is the **intersection** of
three independent states (feature flags only gate rollout/beta, never
availability):

```text
Entitlement        (Monetization: is the tenant allowed this integration?)
      ∩
Installation       (has the tenant installed it?)
      ∩
Connection state   (is it currently connected, not paused/errored?)
      =
Effective availability
```

Feature flags control **rollout / beta exposure** only — they never substitute
for entitlement + installation + connection state.

---

## 5. Lifecycle

```text
Discover (marketplace/catalog)
      │
      ▼
Install            → creates an installation record for the tenant
      │
      ▼
Connect            → OAuth / API-key exchange; issues isolated credentials
      │              + provisions an Integration Actor ([02] §3) with least-privilege grants
      ▼
Configure          → per-integration settings, field mappings, sync rules
      │
      ▼
Active  ⇄  Pause   → temporarily suspend without losing config/credentials
      │
      ▼
Disconnect         → revoke credentials, retain or purge config per policy
```

Each transition emits an event (`integration.installed`,
`integration.connected`, `integration.configured`, `integration.paused`,
`integration.disconnected`).

---

## 6. Data model

```text
integrations                     -- catalog of available integrations
------------
id            intg_...
key           e.g. slack | hubspot | stripe-connect
name
category
capabilities  JSON
auth_type     oauth2 | api_key | webhook
manifest      JSON (scopes, config schema, event subscriptions)
status        active | beta | deprecated

integration_installations        -- per-tenant install
-------------------------
id            intgi_...
integration_id intg_...
tenant_id     ten_...
status        installed | connected | paused | error | disconnected
installed_by  act_...
created_at

integration_connections          -- credential + connection state (isolated)
-----------------------
id            intgc_...
installation_id intgi_...
actor_id      act_...  (the Integration Actor)
credential_ref  reference to secret store (NEVER the secret itself)
connection_state connected | paused | error
last_sync_at
scopes        JSON
created_at

integration_configs
-------------------
id
installation_id
config        JSON (field mappings, sync rules, options)
updated_at
```

---

## 7. Credential isolation (mandatory)

OAuth tokens / API credentials are **isolated** from the Application Registry
and the frontend runtime.

- Credentials never enter: the Application Registry, the frontend runtime, an
  application manifest, git, logs, or events.
- The connection record stores a **reference** (`credential_ref`) to a secret in
  the secret store ([15](15-infrastructure-and-iac.md) §Secrets); the secret
  material lives only there.
- Integration Actors receive **least-privilege** IAM grants derived from the
  integration manifest + tenant configuration
  ([04](04-iam-and-authorization.md)).

---

## 8. Inbound & outbound

- **Inbound** (third-party → Figentra): webhook ingress via a Worker + Hono
  edge, signature-verified and deduplicated, then translated to platform
  events/commands. Shares the webhook platform patterns
  ([11](11-events-and-workflows.md) §Webhooks).
- **Outbound** (Figentra → third-party): event-driven; a domain event the tenant
  subscribed an integration to is delivered via Queues with retry + DLQ.

---

## 9. Core APIs

```text
GET   /v1/integrations                         -- catalog
GET   /v1/tenants/:id/integrations             -- installed
POST  /v1/tenants/:id/integrations/:key/install
POST  /v1/integrations/:installationId/connect     -- begins OAuth/API-key flow
POST  /v1/integrations/:installationId/configure
POST  /v1/integrations/:installationId/pause
POST  /v1/integrations/:installationId/reconnect
DELETE /v1/integrations/:installationId            -- disconnect
```

`reconnect` is an explicit business command (matches the reference's
`POST /integrations/:id/reconnect` example,
[10](10-domain-and-application-patterns.md)).

---

## 10. Events

**Emitted:** `integration.installed`, `integration.connected`,
`integration.configured`, `integration.paused`, `integration.disconnected`,
`integration.sync.completed`, `integration.sync.failed`.

**Consumed:** tenant-subscribed domain events (for outbound delivery),
`tenant.suspended` (pause a tenant's integrations), provider webhooks (inbound).

---

## 11. Non-goals / anti-patterns

| Anti-pattern                                                      | Correct                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Treating an integration like an application                       | Distinct model, actor, and availability rules (R-9).        |
| Storing OAuth tokens in the registry / frontend / manifest / logs | Store a `credential_ref`; secret lives in the secret store. |
| Feature flag as the availability gate                             | Availability = entitlement ∩ installation ∩ connection.     |
| Granting an integration broad IAM access                          | Least-privilege grants from the manifest.                   |
| Building Extensions/Connectors marketplace now                    | Baseline = Integrations; others deferred.                   |
| Unverified inbound webhooks                                       | Signature-verify + dedupe at the edge.                      |

---

## 12. Open questions

- Confirm the initial integration set for launch (which third parties).
- Confirm whether the marketplace UI ships with v1 integrations or later (core
  install/connect APIs are baseline regardless).
