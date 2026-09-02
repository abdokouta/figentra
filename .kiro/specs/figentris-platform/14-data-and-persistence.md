# 14 — Data & Persistence

**Status:** Baseline (core), Deferred (residency depth, DR automation)
**Owner:** Platform architecture / each service
**Related:** [10 Domain patterns](10-domain-and-application-patterns.md), [03 Tenancy](03-tenancy-and-domains.md), [17 Security](17-security-and-compliance.md)

---

## 1. Purpose

Define where each kind of data lives, database ownership, tenant isolation
(including Supabase RLS), data residency, backup/DR, and data lifecycle.

---

## 2. Storage decision matrix

| Data kind                              | Technology                     | Notes                                            |
| -------------------------------------- | ------------------------------ | ------------------------------------------------ |
| Identity                               | Supabase Auth                          | External managed.                                |
| Platform relational data (IAM, Tenant, Monetization) | Supabase PostgreSQL | Per-service DB/schema.                            |
| Application relational data            | Supabase PostgreSQL            | Per-application DB.                               |
| Application registry / config          | Cloudflare D1                  | Lightweight, high-read.                           |
| Edge cache / config                    | Cloudflare KV                  | Where read-optimized.                             |
| Files / objects                        | Cloudflare R2                  | S3-compatible, no egress fees; long-term archive. |
| Durable per-instance coordination      | Durable Objects                | Only where strong consistency is required.        |
| High-performance shared cache          | Redis / Upstash                | Only where justified.                             |
| Async / usage / event buffering        | Cloudflare Queues              | See [11].                                         |
| Event archive / long-term logs         | R2                             | Cheap retention for replay/audit.                 |
| Logs / traces                          | Better Stack / OTel            | See [16].                                         |

**Rule:** D1 is for registry/config, **not** a replacement for the primary
transactional PostgreSQL. Do not use container disk or process memory as a
system of record ([15 §Container rules]).

---

## 3. Database ownership

Do **not** use one giant database for everything. Each service/application owns
its own database (or schema), and **no service reads or writes another
service's database** ([09 §3]).

```text
Platform
├── IAM DB              (Supabase PostgreSQL)
├── Tenant DB           (Supabase PostgreSQL)
├── Monetization DB     (Supabase PostgreSQL)
├── Registry            (D1)
└── Application DBs
    ├── CRM DB          (Supabase PostgreSQL)
    ├── Commerce DB
    ├── POS DB
    └── Analytics DB
```

Cross-service reads use the owning service's API or an event-fed projection
([04 §9], [09 §3]).

---

## 4. Tenant isolation

Every table that stores tenant-owned data carries a tenant boundary column.
Prefer **`tenant_id`** (Figentra business/resource ownership). Where Supabase Auth
organization identity is needed, store `supabase_org_id` as a trusted mapping —
never as the isolation key itself.

```sql
-- every tenant-owned table
tenant_id   uuid not null   -- Figentra ownership boundary
-- supabase_org_id kept on the tenant record as the trusted mapping (see 03)
```

Isolation is enforced at **three layers** (defense in depth):

1. **Server-side authorization** — the request context's `tenantId` is derived,
   never client-supplied ([02 §4]); queries are scoped to it.
2. **Supabase RLS** — row-level security as a second layer (§5).
3. **Tenant-scoped queries** — repositories filter by `tenant_id` by default.

Never rely on frontend filtering; never trust `?tenantId=ten_other` from the
client.

---

## 5. Supabase RLS

Row Level Security is **defense-in-depth**, not the only control.

```sql
-- conceptual policy
create policy tenant_isolation on <table>
  using (tenant_id = current_setting('request.tenant_id')::uuid);
```

- The exact JWT claim → RLS binding must match the **current** Supabase Auth↔Supabase
  third-party auth integration (not the deprecated JWT-template approach —
  [02 §2]).
- RLS complements server-side authorization; it is not a substitute for it.
- Application databases that store tenant data enable RLS on tenant-owned tables.

---

## 6. IDs

Domain-prefixed identifiers ([18](18-error-model-and-api-conventions.md) §ID scheme):

```text
usr_  org_  ten_  app_  role_  perm_  sub_  plan_  ent_  dom_  bacc_  intg_  evt_  req_  trace_ ...
```

Supabase Auth IDs are **never renamed** (`user_...`, `org_...`). A tenant record maps a
Supabase Auth `org_...` to a Figentra `ten_...`.

---

## 7. Data residency

**Status: Deferred depth.** The model is defined; region breadth phases in.

Enterprise tenants may require region pinning:

```text
Tenant
 └── region / data_residency = eu-west | me-central | us-...
```

Residency affects: PostgreSQL region, R2 bucket region, logs, analytics,
backups, and AI processing. Target regions (EU / KSA / UAE / US) are an open
question (**O-6**). The `tenants.region` / `data_residency` fields
([03 §2.1]) carry the intent now; enforcement across every substrate is a
later hardening pass.

---

## 8. Backup & disaster recovery

**Status: Deferred automation.** Principles defined; automation is a later
platform capability ([20](20-implementation-roadmap.md) P1/P2).

- Every system-of-record store has a **backup policy** with an explicit **RPO**
  (recovery point objective) and **RTO** (recovery time objective).
- Cross-region recovery + object replication (R2) for durability.
- Database snapshots (Supabase) on a defined schedule.
- **A backup that has never been restored is not a tested backup** — restore
  testing is part of the DR policy, not optional.

---

## 9. Data lifecycle

Policies for the full lifecycle (mandatory for compliance — [17]):

```text
retention → archival → deletion → anonymization → legal hold → purge
```

Especially:

- **Tenant deletion** — cascade/anonymize per policy; honor legal holds.
- **User deletion** — GDPR-style erasure.
- **Expired logs / files / billing history** — retention windows enforced.

Export/import/backup/restore for tenants (users, customers, orders, config,
audit logs, files, reports) is a compliance-relevant capability
([17 §Data rights], [20] P1).

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                            | Correct                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| One giant DB for all apps/services                      | DB (or schema) per service/application.                     |
| A service reading another service's DB                  | API / event-fed projection ([09]).                          |
| D1 as the transactional business DB                     | D1 = registry/config; Supabase = transactional.             |
| Container disk / memory as a system of record           | Persist to Supabase / R2 / D1 / Durable Object storage.     |
| `organization_id` as the isolation key                  | `tenant_id`; keep `supabase_org_id` as a trusted mapping.      |
| Trusting `?tenantId=` from the client                   | Derive server-side; RLS as defense in depth.                |
| RLS as the only tenant control                          | Server-side authz + RLS + scoped queries (three layers).    |
| Untested backups                                        | Restore testing is part of DR.                              |

---

## 11. Open questions

- **O-6** — Target data-residency regions at launch (EU / KSA / UAE / US)?
  Determines how much residency enforcement is P0 vs deferred.
- Confirm the exact Supabase Auth→Supabase claim mapping used for RLS (`request.tenant_id`
  binding) against the current integration.
- Confirm backup RPO/RTO targets per store (platform vs application).
