---
inclusion: always
---

# Tenancy, application, and scope columns

> **ADR anchor.** This steering codifies
> [ADR-0027](../../docs/adr/0027-row-level-attribution-three-axes.md) —
> Row-level attribution: three-axes column contract (`tenant_id` /
> `application_id` / `scope_node_id`). §§1-5 below are the enforceable surface
> of that ADR; §§6-9 are its operational tail (enforcement points, auditor
> agent, migration templates, living gap register).

Row-level attribution contract for every backend service. Complements
`hierarchy.md` — the parent doc defines the platform tree; this doc defines
which columns each row carries to participate in that tree. When the two
disagree, `hierarchy.md` wins.

Contradict this file only with an explicit design note in the relevant spec.
Every change to the column mandate below is a migration event — treat it as
such.

## 1. The three orthogonal axes

Three column families answer three different questions. They do NOT substitute
for each other. A row can need one, two, or three of them; most rows need one.

| Axis            | Column                                     | Answers                                                        | Substrate                                                                                                                           |
| --------------- | ------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**      | `tenant_id` (text ULID)                    | "Which tenant owns this row?"                                  | Reference column. The `withTenant()` helper applies the read scope + fills the column on write; Supabase RLS enforces it at the DB. |
| **Application** | `application_id` (text ULID)               | "Which of the N products does this row belong to?"             | Reference column on the 12 top-level rows only. Cascades through `tenant_id` for everything else — never a shortcut.                |
| **Scope**       | `scope_node_id` (text ULID) + `scopedTo()` | "What cascading-resolution path does this row participate in?" | `@stackra/scope` substrate. Materialised path. **Configuration consumers only** — never on domain data rows.                        |

Rule of thumb: if you can't state the question your column answers in one
sentence from that table, you're using the wrong axis.

## 2. The `application_id` mandate (locked, 12 rows)

> **ADR anchor.** The base 8-row mandate is codified by
> [ADR-0027](../../docs/adr/0027-row-level-attribution-three-axes.md) §D2. The
> extension from 8 → 12 rows for central-plane infrastructure is codified by
> [ADR-0031](../../docs/adr/0031-application-id-central-plane-extension.md).

Only **twelve** row types carry `application_id` directly. Every other row
cascades through `tenant_id`. The list is CLOSED — adding a 13th row requires a
new ADR that names it.

The 12 rows split into two subgroups:

- **The base 8 (ADR-0027 §D2)** — per-Application top-level aggregates that
  every tenant-scoped row cascades through.
- **The 4 central-plane extensions (ADR-0031 §D1)** — infrastructure rows that
  operate ABOVE the tenant plane; no cascade path through `tenants` exists at
  their layer.

```
Row                        Column                Notes                                                     Group
─────────────────────────  ────────────────────  ────────────────────────────────────────────────────────  ─────────────
tenants                    application_id  ✅    required, UNIQUE(application_id, slug)                    base (0027)
users                      application_id  ✅    required, UNIQUE(identity_id, application_id)             base (0027)
roles                      application_id  ✅    nullable (null = platform-admin audience)                 base (0027)
permissions                application_id  ✅    nullable (null = platform-admin audience)                 base (0027)
tenant_subscriptions       application_id  ✅    required, scoped by (application_id, tenant_id)           base (0027)
entitlement_licenses       application_id  ✅    required, scoped by (application_id, tenant_id)           base (0027)
audits                     application_id  ✅    required for tenant-audience, nullable for platform       base (0027)
activity_log               application_id  ✅    required for tenant-audience, nullable for platform       base (0027)
plans                      application_id  ✅    required — product catalog is per-Application             extension (0031)
auth_jwt_signing_keys      application_id  ✅    required — JWKS keyring is per-Application                extension (0031)
service_accounts           application_id  ✅    required — machine credentials scoped per Application     extension (0031)
domains                    application_id  ✅    required — host resolution runs above tenant plane        extension (0031)
```

The four extension rows carry `application_id` as **required**, not nullable.
Their central-plane role has no "platform-wide" audience (unlike `audits` and
`activity_log`, which can be platform-audience because a super-admin action
legitimately has no tenant / no application). Plans + JWKS + service accounts

- domains are always per-Application by construction.

**Everything else is forbidden from carrying `application_id`.** Application
flows through `tenant_id → tenants.application_id`. Adding `application_id` to
Branch, Team, Organization, Facility, Region, User's Profile, or any
AI/Auth/Access domain row is a schema violation.

Enforced by:

- Migration review — every new migration that adds `application_id` outside the
  12 rows must be rejected.
- `ApplicationMismatch` (422) on cross-app writes at the write path.
- The **`tenancy-columns-check`** CI schema-lint (see §7) — its R3 allow-list
  recognises all 12 rows as compliant per ADR-0031 §D5.

## 3. The `tenant_id` mandate

Every domain row that lives below Tenant carries `tenant_id`. Every module below
owns rows tenant-scoped this way. Use the `withTenant()` helper from
`@stackra/contracts` — it applies the read scope + auto-fills the column on
write; a Supabase Row-Level Security (RLS) policy enforces the same boundary at
the database.

### Package matrix (current + target)

| Package          | Rows                                                                                          | Tenant-scoped via `withTenant()`                                                    | State                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Tenancy**      | `tenants`                                                                                     | (owns it)                                                                           | ✅ carries `application_id`                                           |
| **User**         | `User`, `Profile`, `ServiceAccount`, `PlatformUser`                                           | ✅ (except PlatformUser)                                                            | PlatformUser is central-plane and correctly has no tenant_id          |
| **Access**       | `Role`, `Permission`                                                                          | via the RBAC tenant column — same column, RBAC-managed                              | ✅                                                                    |
| **Auth**         | `MfaMethod`, `SocialAccount`, `WebAuthnCredential`, `OAuthClient`                             | Mixed — identity-plane objects belong to `identity_id` post-split; audit each model | Verify post-Identity-spec                                             |
| **Organization** | `Organization`                                                                                | ✅                                                                                  | ✅                                                                    |
| **Region**       | `Region`                                                                                      | ✅                                                                                  | ✅                                                                    |
| **Branch**       | `Branch`                                                                                      | ✅                                                                                  | ✅ + carries `organization_id` + `region_id`                          |
| **Facilities**   | `Facility`, `ResourceBooking`, `DayPass`, `Pass`                                              | ✅                                                                                  | ✅ (Facility cascades through `branch_id`, no direct organization_id) |
| **Teams**        | `Team`, `TeamMember`, `TeamTrial`, `EventTeam`                                                | ✅                                                                                  | ✅ + Team carries `organization_id` + `branch_id`                     |
| **Subscription** | `TenantSubscription`, `Chargeback`, `CouponRedemption`, `CreditMemo`, `Refund`, `Transaction` | ✅                                                                                  | ✅                                                                    |
| **Entitlements** | `EntitlementLicense`, `LicenseUsage`, `Grant`                                                 | ✅                                                                                  | ✅                                                                    |
| **AI**           | `AiRun`, `AiToolCall`, `AiDraft`                                                              | ✅ (via reference column)                                                           | ✅                                                                    |
| **Audit**        | `audits`                                                                                      | ❌ — tenant_id lives in a JSON blob                                                 | **Gap** — add `tenant_id` column + index                              |
| **Activity**     | `activity_log`                                                                                | ❌ — tenant_id lives in a JSON blob                                                 | **Gap** — add `tenant_id` column + index                              |
| **settings**     | Consumes scope substrate                                                                      | N/A — owns no tenant-scoped domain rows                                             | ✅                                                                    |
| **scope**        | `scope_nodes`, `scope_definitions`, `scope_values`, `scope_aliases`                           | Uses `owner_id` (semantic = tenant, different column name for substrate reasons)    | ✅                                                                    |
| **Foundation**   | (framework tier)                                                                              | N/A                                                                                 | ✅                                                                    |

### Two known gaps

1. **Audit** — the first-party `audits` table currently stores the tenant id
   inside a JSON blob. Compliance queries extract tenant id from the blob, which
   prevents indexing. **Action:** add `tenant_id TEXT NULL` + index
   `(tenant_id, created_at)` via a migration + wire the audit repository through
   `withTenant()`. Backfill from the JSON blob for existing rows.
2. **Activity** — the first-party `activity_log` table has the same gap. Same
   pattern, same fix.

## 4. The scope substrate mandate

`scope_node_id` is **not** a general-purpose tenancy column. It exists for one
job: cascading value resolution across a per-tenant configurable hierarchy. Only
**configuration consumers** integrate with it.

### Who integrates with scope

| Package                                   | Role                     | Notes                                                                           |
| ----------------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| **scope**                                 | Owner                    | Provides `ScopeNode`, `ScopeValue`, `scopedTo()`, the resolve-scope middleware. |
| **settings**                              | Consumer                 | Uses `scope.resolve('settings', key)` for hierarchical value resolution.        |
| **Access** (permissions overlay)          | Consumer, planned        | Cascading permission grants through the tree.                                   |
| **Entitlements** (feature flags + quotas) | Consumer, planned        | Reads tier + flag values via scope.                                             |
| **Subscription** (pricing)                | Consumer, planned        | Per-node pricing overrides.                                                     |
| **notifications**                         | Consumer, planned        | Per-user / per-branch prefs.                                                    |
| Every other package                       | **Not a scope consumer** | Do not add `scope_node_id` to domain data rows.                                 |

The Application, Tenant, Organization, Region, Branch, Team, User models are
**entities** the scope nodes reference (via `scope_nodes.entity_id`) — not
consumers of scope resolution. Reverse lookup is what the substrate does; the
entities themselves stay clean.

### Adding a scope consumer

Two steps for a package that legitimately consumes scope:

1. Register the namespace in the module's registration hook:

   ```ts
   // In the module's register()
   scope.consumer("settings", {
     defaultValueFactory: (key: string) => null,
     validator: (value: unknown) =>
       typeof value === "string" ||
       typeof value === "number" ||
       Array.isArray(value),
   });
   ```

2. Store keyed values against nodes (never against domain rows):
   `scope_values(scope_node_id, namespace, key, value)`.

Domain data rows still use `tenant_id`. Scope only owns config.

## 5. Non-goals (forbidden columns)

These columns must NEVER exist. Each one exists elsewhere for a reason; the
shortcut always drifts.

| Forbidden                                                         | On                                                        | Why                                                               | Correct path                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `application_id`                                                  | Any row below Tenant except the 12 named in §2            | Cascades through `tenant_id`                                      | Join through `tenants` if the answer's ever needed  |
| `region_id`                                                       | `organizations`                                           | Regions + Orgs are orthogonal                                     | They meet at Branch                                 |
| `organization_id`                                                 | `facilities`, `regions`                                   | Facilities cascade through `branch_id`; Regions are tenant-scoped | Join through `branches` for facility→org            |
| `scope_node_id`                                                   | Any tenant-scoped domain row that isn't a config consumer | Not what scope is for                                             | Use `tenant_id`                                     |
| Any FK crossing tenants                                           | Everywhere below the platform plane                       | Tenant isolation is a hard boundary                               | Per-tenant materialised views for reporting rollups |
| Cross-audience role/permission rows                               | `roles`, `permissions`                                    | The tenant audience and platform-admin audience never mix         | `AudienceMismatch` (422) on write                   |
| Cross-application role/permission rows                            | `roles`, `permissions`                                    | Sports role ≠ Marketplace role                                    | `ApplicationMismatch` (422) on write                |
| `parent_id` chains that cross `application_id` on `organizations` | `organizations`                                           | Applications are hard boundaries                                  | Reject at the write path                            |

## 6. Enforcement points

Enforcement is layered — every layer catches what the layer above missed.

1. **Migration review** — every new migration adding a column above (or a
   forbidden column) must pass the `tenancy-columns-check` schema-lint (§7).
2. **`withTenant()` helper + RLS** — auto-fills `tenant_id` on write and applies
   the read scope; the Supabase RLS policy enforces the boundary at the DB. A
   tenant-scoped table missing either is a compliance failure.
3. **`ApplicationMismatch` / `AudienceMismatch` (422)** — write-path guards in
   the role-permission sync action and every Application-aware action.
4. **The resolve-application middleware** — rejects requests missing
   `X-Application-Id` (400 / 404 / 403 per spec §Req 2).
5. **The scope-definition seeder** — reads the tier from the active
   per-Application subscription and inserts only allowed rows.
6. **The `tenancy-columns-check` schema-lint** (§7) — run in CI or via a save
   hook to scan a package for compliance.
7. **`no-cross-service-foreign-key` (CI schema-lint)** — every migration's
   foreign key is checked at the lint gate: a cross-service FK (a migration in
   service X referencing a table owned by service Y) fails CI. The
   workspace-wide rule + ownership catalog lives in
   [`data-ownership.md`](data-ownership.md) (codified by
   [ADR-0089](../../.docs/adr/0089-cross-service-fk-ban-and-event-driven-cascade.md));
   cross-service cascade travels through domain events per
   [`cross-service-events.md`](cross-service-events.md).

## 7. The `tenancy-columns-check` schema-lint

CI schema-lint that scans one package (or the whole codebase) against this
mandate — the tenancy-attribution sibling of `no-cross-service-foreign-key`
(§6.7). It walks each service's migrations, schema, and repositories statically;
no runtime required.

**When it fires:**

- CI gate: every PR that touches a migration, schema, or repository file runs
  the check; a violation fails the lint stage.
- On save: the `.kiro/hooks/tenancy-columns-check.json` hook reminds this
  steering doc exists when a package's schema / repository / migration file is
  saved.
- Locally: run via the workspace lint task before pushing.

**What it checks (structured report):**

1. **Missing required column** — package advertises tenant-scoping in its
   `catalog.json` / `package.json` but a table lacks `tenant_id`.
2. **Illegal `application_id`** — row outside the 12 named rows carries
   `application_id` directly.
3. **Illegal shortcut FKs** — `region_id` on `organizations`, `organization_id`
   on `facilities` or `regions`, etc.
4. **Missing `withTenant()` scoping** — tenant-scoped table whose repository
   doesn't compose the helper (or lacks the RLS policy).
5. **Illegal scope adoption** — non-config-consumer package adds `scope_node_id`
   or `scopedTo()`.
6. **Cross-tenant/cross-audience/cross-app FKs** — any FK column pointing at a
   row in a different tenant / audience / application.
7. **Naming drift** — `owner_id` outside `scope_nodes`, `workspace_id` where
   `tenant_id` is expected, etc.

**Output shape (structured markdown):**

```
# Tenancy compliance report — <package>

## Summary
- Compliant: <count>
- Violations: <count>
- Warnings: <count>

## Violations
### VIO-001 <package/path/file.ts>:<line> — <rule id>
<one-paragraph description>
**Fix:** <suggested migration or code change>

## Warnings
...

## Passing checks
...
```

Reports are advisory at the file level — the check never edits files. It reports
findings and suggests fixes; a human (or a follow-up prompt) applies the change.
A P0 finding fails CI.

## 8. Migration templates

Copy-paste-ready shapes for the most common operations. Migrations are SQL files
applied via `supabase migration up`. `@stackra/database` ships column helpers
(`tenantId()`, `applicationId()`, ...) that emit the canonical column + index
DDL so every table spells them identically — never hand-roll a column family a
helper already covers (reviewers flag hand-rolled `tenant_id` column chains as
`COLUMN_BYPASS` findings).

The helpers used below:

- `tenantId()` — `tenant_id TEXT NOT NULL` + composite `(tenant_id, created_at)`
  index (the composite mandated by ADR-0041).
- `tenantIdOptional()` — nullable `tenant_id TEXT` + bare `tenant_id` index.
  Retrofit-only.
- `applicationId()` — `application_id TEXT NOT NULL` + bare `application_id`
  index.
- Timestamp + audit columns: `created_by / updated_by / deleted_by TEXT`,
  `deleted_at TIMESTAMPTZ` (soft delete), `created_at / updated_at TIMESTAMPTZ`.

### Create a tenant-scoped table (new package)

The canonical shape every new tenant-scoped table follows. The `tenantId()`
helper emits the tenant column + composite `(tenant_id, created_at)` index.

```sql
CREATE TABLE <table> (
  id           TEXT PRIMARY KEY,             -- prefixed ULID: `xxx_<26>`
  tenant_id    TEXT NOT NULL,                -- tenantId() helper column

  -- Domain columns — bespoke definitions for anything the helper
  -- catalogue does not cover.

  metadata     JSONB,                        -- metadata bag
  created_by   TEXT,
  updated_by   TEXT,
  deleted_by   TEXT,
  deleted_at   TIMESTAMPTZ,                  -- soft delete
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- composite (tenant_id, created_at) index — mandated by ADR-0041
CREATE INDEX <table>_tenant_created_at_idx ON <table> (tenant_id, created_at);
```

Add a Supabase RLS policy so reads are scoped to the active tenant, and wire the
table's repository through `withTenant()`.

### Add `tenant_id` to an existing table

Retrofit path — the table existed before tenancy landed. The column MUST be
nullable during the backfill window (existing rows carry no tenant), and the
bare `tenant_id` index is what existing query paths expect.

Two known consumers per §3: `audits` and `activity_log`. Both tables
additionally carry the ADR-0029 composite `<table>_app_tenant_created_idx` —
that ships in a separate migration.

```sql
-- migration: add_tenant_id_to_<table>.sql
ALTER TABLE <table> ADD COLUMN tenant_id TEXT;     -- nullable during backfill
CREATE INDEX <table>_tenant_id_idx ON <table> (tenant_id);

-- down:
-- DROP INDEX <table>_tenant_id_idx;
-- ALTER TABLE <table> DROP COLUMN tenant_id;
```

Then wire the table's repository through `withTenant()` + add the RLS policy.

### Add `application_id` (only if the row is one of the 12)

Retrofit path for the twelve rows enumerated in §2. The base 8 rows also need a
composite `(application_id, tenant_id)` index for composite scoping — add it in
the SAME migration. The four central-plane extensions (`plans`,
`auth_jwt_signing_keys`, `service_accounts`, `domains`) skip the composite
because they don't carry `tenant_id`.

```sql
ALTER TABLE <table> ADD COLUMN application_id TEXT NOT NULL;
-- OR: ... TEXT NULL for audits + activity_log (the two rows in §2
--     where application_id is nullable).
CREATE INDEX <table>_application_id_idx ON <table> (application_id);

-- Composite scoping index — base-8 rows only (skip for the 4
-- central-plane extensions that don't carry tenant_id).
CREATE INDEX <table>_application_tenant_idx
  ON <table> (application_id, tenant_id);
```

### Register a scope consumer namespace

```ts
// In the module's register()
scope.consumer("<my_namespace>", {
  defaultValueFactory: (key: string) => defaultFor(key),
  validator: (value: unknown) => validate(value),
});
```

### Add composite `(tenant_id, created_at)` index

> **ADR anchor.** Every tenant-scoped table with a `created_at` column carries a
> composite `<table>_tenant_created_at_idx` on `(tenant_id, created_at)`.
> Codified by
> [ADR-0041](../../docs/adr/0041-composite-tenant-created-at-indexes.md). Two
> documented exceptions: append-only audit tables (`audits`, `activity_log`)
> that already carry `<table>_app_tenant_created_idx` per
> [ADR-0029](../../docs/adr/0029-audit-consolidation.md), and the 12
> central-plane rows per
> [ADR-0031](../../docs/adr/0031-application-id-central-plane-extension.md) §D5
> which don't carry `tenant_id` at all.

Every tenant-scoped table with a `created_at` column MUST carry the composite
`<table>_tenant_created_at_idx`. The index answers the "recent list" pattern
(`WHERE tenant_id = ? ORDER BY created_at DESC LIMIT N`) with a single range
scan; a bare `tenant_id` index requires a per-query sort.

**New migrations don't need this block** — the `tenantId()` helper (used in the
"Create a tenant-scoped table" template above) emits the composite index by
default. The template below is the RETROFIT path for tables that predate the
helper's composite emission.

```sql
CREATE INDEX <table>_tenant_created_at_idx ON <table> (tenant_id, created_at);

-- down:
-- DROP INDEX <table>_tenant_created_at_idx;
```

The `tenancy-columns-check` schema-lint flags missing indexes on tenant-scoped
tables as `MISSING_TENANT_INDEX` findings. The retroactive batch across the
current tenant-scoped tables ships in Phase H5 (per ADR-0041 §D4).

## 9. Living gap register

Update this section every time a schema change lands or a new package joins the
codebase. The `tenancy-columns-check` reads it to know what's expected to exist
vs what's a known deferred fix.

### 9a. Open gaps

| Gap                                                                                                               | Owner                       | Blocker                                      | Priority |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------- | -------- |
| Add `tenant_id` to `audits`                                                                                       | Audit module                | None                                         | High     |
| Add `tenant_id` to `activity_log`                                                                                 | Activity module             | None                                         | High     |
| Split `User` into `Identity` + `User` (per-app)                                                                   | Identity + User modules     | Identity spec landing                        | High     |
| Add `application_id` to `tenants`                                                                                 | Tenancy module              | Application module scaffold                  | High     |
| Add `application_id` to `users` (post-split)                                                                      | User module                 | Identity split                               | High     |
| Add `application_id` to `roles`, `permissions`                                                                    | Access module               | Application module scaffold                  | High     |
| Add `application_id` to `tenant_subscriptions`, `entitlement_licenses`                                            | Subscription + Entitlements | Application module scaffold                  | High     |
| Add `application_id` to `audits`, `activity_log`                                                                  | Audit + Activity            | Post-tenant_id + Application module scaffold | Medium   |
| Register `settings` as scope consumer                                                                             | settings module             | None                                         | Medium   |
| Register `Access` permission overlay as scope consumer                                                            | Access module               | Post-Identity split                          | Low      |
| Verify Auth models against Identity split                                                                         | Auth module                 | Identity spec landing                        | Deferred |
| `ServiceAccount` model + `service_accounts` migration (backend side of the service-identity contract)             | Auth / Access               | None                                         | High     |
| `ServiceJwt` signer + verifier (backend side of the service-jwt contract; HS256, `>=32`-byte secret from Doppler) | Auth                        | `ServiceAccount` landing                     | High     |
| `@stackra/domain` — shared HTTP-DTO package referenced by the service-boundary contract                           | Foundation                  | contracts finalised                          | Medium   |

### 9b. Closed rows (E9 batch — ADR-0031 §D3)

The E9 batch drops `application_id` from 11 domain rows and rewrites 2 composite
unique indexes to their natural keys. Every row cascades through a legitimate
parent (`tenants.application_id`, `users.application_id`,
`roles.application_id`, `permissions.application_id`) so no attribution is lost.

| Row                          | Package                            | Cascade path                 | Index change                                                                                        |
| ---------------------------- | ---------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `role_delegations`           | access/delegation                  | `roles.application_id`       | none                                                                                                |
| `invitations`                | access/invitations                 | `tenants.application_id`     | none                                                                                                |
| `invitation_events`          | access/invitations                 | `invitations.tenant_id`      | none                                                                                                |
| `model_has_permissions`      | access/rbac (RBAC pivot)           | `permissions.application_id` | none                                                                                                |
| `model_has_roles`            | access/rbac (RBAC pivot)           | `roles.application_id`       | none                                                                                                |
| `role_has_permissions`       | access/rbac (RBAC pivot)           | both parents                 | none                                                                                                |
| `access_request_projections` | access/requests                    | `users.application_id`       | none                                                                                                |
| `in_app_messages`            | notifications/notifications-in-app | `tenants.application_id`     | none                                                                                                |
| `push_subscriptions`         | notifications/notifications-push   | `users.application_id`       | `(user_id, application_id, device_token_fingerprint)` → `(user_id, device_token_fingerprint)`       |
| `notifications`              | notifications/notifications        | `tenants.application_id`     | none                                                                                                |
| `approval_templates`         | workflow/approvals                 | `tenants.application_id`     | `(tenant_id, application_id, action_key, name, version)` → `(tenant_id, action_key, name, version)` |

## 10. Cross-references

- `hierarchy.md` — canonical platform tree + tier boundaries.
- `.kiro/specs/identity/design.md` — Identity + Application module contracts
  (D1–D3 locked).
- `.kiro/specs/observability/design.md` — the two-signal audit/activity split.
- `.kiro/hooks/tenancy-columns-check.json` — save-time reminder.
- [`data-ownership.md`](data-ownership.md) — the sibling
  `no-cross-service-foreign-key` schema-lint; `tenancy-columns-check` follows
  the same CI-gate model.
