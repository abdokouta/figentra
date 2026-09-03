---
inclusion: always
---

# Data ownership — one service owns each table

> **ADR anchor.** Codified by
> [ADR-0089](../../.docs/adr/0089-cross-service-fk-ban-and-event-driven-cascade.md)
> — Cross-service FK ban + event-driven cascade. Every rule below is the
> enforceable surface of that ADR; a violation is a review-blocking finding
> caught by the CI schema-lint check `no-cross-service-foreign-key`.

Row-ownership contract for every backend service. Extends
[`tenancy-columns.md`](tenancy-columns.md) (which decides WHICH COLUMNS a row
carries) with the sibling rule for WHERE a row physically lives + how a
downstream service references it without inheriting the row's package.

Read alongside:

- [`tenancy-columns.md`](tenancy-columns.md) — three-axis attribution contract
  (`tenant_id` / `application_id` / `scope_node_id`) every domain row satisfies.
- [`cross-service-events.md`](cross-service-events.md) — the cascade contract
  this doc's Rule 3 delegates to.
- [`observability-signals.md`](../../.ref/steering/observability-signals.md) — the parallel
  three-signal contract that services already emit through `@stackra/events`
  (the workspace event bus).

## Precedence

1. This file wins over generic microservice-boundary guidance elsewhere.
2. When this file and a package README disagree, this file wins.
3. `tenancy-columns.md` still owns the COLUMN mandate (which rows carry
   `tenant_id` / `application_id`); THIS file owns the OWNERSHIP mandate (which
   SERVICE writes to which row).

## Rule 1 — Foreign keys are LEGAL within a single service

A migration inside service X may declare a foreign key whenever the referenced
table is OWNED by service X. Both tables live in the same Supabase Postgres
database + participate in the same transaction boundary, so the constraint
installs cleanly and enforces referential integrity on writes.

```sql
-- ✅ identity-service migration — both `users` and `profiles` are
--    owned by identity-service. FK is legal.
CREATE TABLE profiles (
  id          TEXT PRIMARY KEY,               -- prefixed ULID
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Same rule applies to every same-service pair — `athletes` ↔
`athlete_enrollments` inside academorix-api, `orders` ↔ `order_lines` inside
commerce-service, etc.

## Rule 2 — Cross-service FKs are FORBIDDEN

Under the [ADR-0032](../../.docs/adr/0032-six-service-split.md) six-service
split every backend service owns an INDEPENDENT Supabase Postgres database. A FK
constraint that references a table living in a different DB either:

- **Fails to install** — Postgres can't validate the referent.
- **Silently ties the schema** to a locally-replicated copy of the target table
  that drifts from the authoritative copy in the owner's DB.

Both outcomes are wrong. The correct shape is a **canonical column definition**
(shipped as a helper by `@stackra/database`) that emits the column + local index
WITHOUT a database-level FK:

```sql
-- ❌ WRONG — notifications-service reaching into identity-service's
--    tenants + users tables.
CREATE TABLE push_subscriptions (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),  -- cross-service FK
  user_id   TEXT NOT NULL REFERENCES users(id)     -- cross-service FK
);

-- ✅ RIGHT — reference columns + local indexes, no cross-service FK.
--    Cascade lives in an event-listener (Rule 3).
CREATE TABLE push_subscriptions (
  tenant_id TEXT NOT NULL,   -- + index (tenant_id, created_at)
  user_id   TEXT NOT NULL    -- + index (user_id)
);
CREATE INDEX push_subscriptions_tenant_created_idx
  ON push_subscriptions (tenant_id, created_at);
CREATE INDEX push_subscriptions_user_idx
  ON push_subscriptions (user_id);
```

`@stackra/database` ships schema helpers that emit each canonical reference
column + its index so every table spells them identically:

| Helper                 | Column            | Origin (owning service) |
| ---------------------- | ----------------- | ----------------------- |
| `tenantId()`           | `tenant_id`       | identity-service        |
| `tenantIdOptional()`   | `tenant_id NULL`  | identity-service        |
| `applicationId()`      | `application_id`  | identity-service        |
| `userId()`             | `user_id`         | identity-service        |
| `organizationId()`     | `organization_id` | platform-service        |
| `branchId()`           | `branch_id`       | platform-service        |
| `regionId()`           | `region_id`       | platform-service        |

**Enforcement.** The CI schema-lint check `no-cross-service-foreign-key` fires
on any FK (`REFERENCES <table>` in a migration) whose target table is owned by a
different service than the one hosting the migration. Zero-hit gate. Reviewers
reject the PR unless a documented `ignored_tables` config entry justifies the
exception.

## Rule 3 — Cross-service cascade via domain events, never via FK ON DELETE

When the owning service deletes a row (e.g. identity-service deletes a tenant),
every non-owning service that persists the referenced column MUST cascade the
delete inside ITS OWN database. FKs with `ON DELETE CASCADE` are NOT the
mechanism — they can't cross database boundaries.

The mechanism:

1. **Owning service** — publishes a canonical `<Entity>Deleted` domain event via
   `@stackra/events`. Exactly one event type per cascadeable entity, living in
   `@stackra/contracts` `events/<domain>/`.
2. **Non-owning services** — each service that persists the referenced column
   authors an `@OnEvent` handler that cascades the delete inside its own DB. The
   listener is idempotent (dedupe by event ID) and follows the workspace
   `@stackra/events` fanout contract.

Full listener contract, event vocabulary, DLQ semantics, and idempotency rules
live in [`cross-service-events.md`](cross-service-events.md). This rule anchors
the WHY; that doc anchors the HOW.

**Never** author an `ON DELETE CASCADE` on a cross-service reference column. The
helpers deliberately DO NOT emit FKs; adding one manually reintroduces the
coupling this rule bans.

## Rule 4 — Table-ownership catalog

Every table in the workspace is OWNED by exactly one service. Ownership means
"authoritative writes live here + the migration ships in this service's
dependency graph". The catalog below mirrors the schema-lint rule's ownership
map — the two stay in sync.

### identity-service

Owns identity + auth + access-control tables:

`access_grants`, `access_request_projections`, `applications`,
`auth_cross_app_grants`, `auth_email_verifications`, `auth_jwt_deny_lists`,
`auth_jwt_signing_keys`, `auth_mfa_challenges`, `auth_password_resets`,
`auth_refresh_tokens`, `brandings`, `business_types`, `domains`,
`domain_records`, `identities`, `impersonation_sessions`, `invitations`,
`invitation_events`, `mfa_challenges`, `model_has_permissionses`,
`model_has_roleses`, `permissions`, `person_identities`,
`person_guardian_links`, `personal_access_tokens`, `platform_users`,
`platform_profiles`, `profiles`, `role_definitions`, `role_delegations`,
`role_has_permissionses`, `roles`, `service_accounts`, `tenant_contacts`,
`tenant_link_requests`, `tenant_members`, `tenants`, `users`,
`webauthn_credentials`.

### commerce-service

Owns subscriptions + entitlements + every finance-\* table:

`budgets`, `chargebacks`, `chargeback_evidences`, `cost_centers`, `coupons`,
`coupon_redemptions`, `credit_notes`, `dunning_events`, `dunning_plans`,
`dunning_runs`, `entitlements`, `entitlement_usages`, `expenses`,
`expense_categories`, `fee_applications`, `fee_payouts`, `fee_schedules`,
`gateway_webhook_events`, `invoices`, `invoice_lines`, `memberships`,
`membership_plans`, `membership_renewals`, `orders`, `order_lines`,
`order_adjustments`, `payments`, `payment_disputes`, `payment_gateway_configs`,
`payment_intents`, `payment_methods`, `payouts`, `payout_items`,
`payout_reconciliations`, `payroll_lines`, `payroll_runs`, `plans`, `refunds`,
`refund_lines`, `subscriptions`, `subscription_events`, `tax_calculations`,
`tax_exemptions`, `tax_jurisdictions`, `tax_rates`, `transactions`,
`transaction_ledger_entries`, `wallets`, `wallet_holds`, `wallet_passes`,
`wallet_transactions`.

### notifications-service

Owns delivery + messaging + newsletter tables:

`announcements`, `announcement_views`, `conversations`,
`conversation_participants`, `in_app_messages`, `in_app_message_reads`,
`mail_suppressions`, `messages`, `newsletters`, `newsletter_audiences`,
`newsletter_campaigns`, `newsletter_issues`, `newsletter_subscriptions`,
`notifications`, `notification_categories`, `notification_deliveries`,
`notification_digests`, `notification_preferences`, `notification_templates`,
`push_subscriptions`, `sms_opt_outs`.

### observability-service

Owns audit + activity + compliance tables:

`activities`, `activity_retention_policies`, `audits`,
`audit_retention_policies`, `consent_categories`, `consent_records`, `dsars`,
`dsar_artefacts`, `legal_holds`, `retention_runs`, `safeguarding_incidents`,
`subprocessors`.

### platform-service

Owns infrastructure + admin + hierarchy tables (regions / organizations /
branches / facilities / teams / staff — the platform-tree entities):

`admin_dashboard_configs`, `app_installations`, `app_webhook_subscriptions`,
`approvable_actions`, `approval_decisions`, `approval_instances`,
`approval_reminders`, `approval_requirements`, `approval_templates`,
`approval_template_approvers`, `apps`, `attribute_definitions`,
`attribute_groups`, `attribute_sets`, `branches`, `checkin_logs`,
`chunked_uploads`, `cities`, `coaches`, `content_blocks`, `countries`,
`credentials`, `currencies`, `day_passes`, `event_teams`, `facilities`,
`features`, `feature_definitions`, `feature_kill_switches`, `feature_overrides`,
`feature_rollouts`, `files`, `file_variants`, `forms`, `form_submissions`,
`form_versions`, `gates`, `geofence_checks`, `integration_providers`,
`languages`, `organizations`, `passes`, `platform_languages`, `public_pages`,
`reception_visits`, `regions`, `report_definitions`, `report_runs`,
`resource_bookings`, `saved_reports`, `scope_aliases`, `scope_definitions`,
`scope_nodes`, `scope_values`, `search_analytics_events`, `search_indexes`,
`search_saved_queries`, `search_sync_jobs`, `search_synonyms`, `seo`,
`signed_url_audits`, `staff`, `states`, `stored_activities`, `stored_workflows`,
`sync_cursors`, `tasks`, `task_assignments`, `task_comments`, `teams`,
`team_members`, `team_trials`, `tenant_integrations`, `tenant_locales`,
`timezones`, `translations`, `translation_jobs`, `webhook_deliveries`,
`webhook_subscriptions`, `workflow_idempotency_keys`, `xfer_artifacts`,
`xfer_jobs`, `xfer_mapping_profiles`, `xfer_shards`.

### marketing-service

Owns growth signals — analytics + attribution + marketing + referrals:

`analytics_deliveries`, `analytics_events`, `analytics_identities`,
`analytics_provider_configs`, `attributions`, `attribution_touchpoints`,
`marketing_dead_letters`, `marketing_deliveries`, `marketing_events`,
`marketing_provider_configs`, `referrals`, `referral_codes`,
`referral_fraud_flags`, `referral_programs`, `referral_rewards`.

### academorix-api (per-Application)

Owns Academorix product-specific tables (sports + coaching + registrations

- safeguarding + medical + performance):

`absence_records`, `age_groups`, `allergies`, `athletes`, `athlete_enrollments`,
`athlete_guardians`, `attendance_policies`, `attendance_records`, `awards`,
`background_checks`, `belt_ranks`, `benchmarks`, `bracket_nodes`,
`calendar_subscriptions`, `certificates`, `coach_assignments`,
`coach_certifications`, `coach_notes`, `coach_skill_ratings`,
`coaching_profiles`, `companies`, `competitions`, `competition_fixtures`,
`competition_teams`, `curriculums`, `curriculum_weeks`, `dashboards`,
`development_pathways`, `disciplines`, `drills`, `drill_categories`, `events`,
`event_facilities`, `formations`, `formation_slots`, `goals`, `grading_events`,
`grading_results`, `injuries`, `late_arrivals`, `leads`, `lead_activities`,
`lead_tasks`, `match_events`, `match_fixtures`, `match_notes`,
`match_participants`, `match_results`, `match_squad_entries`, `medical_records`,
`medical_clearances`, `medications`, `offers`, `opponent_logos`,
`pathway_stages`, `performance_tests`, `performance_test_results`,
`policy_acknowledgements`, `positions`, `posts`, `private_session_requests`,
`progress_assessments`, `progress_cards`, `registrations`,
`registration_activities`, `registration_tasks`, `rsvps`, `scouting_reports`,
`seasons`, `sessions`, `session_attendances`, `session_credits`,
`session_plans`, `session_plan_items`, `sports`, `standing_rows`,
`talent_flags`, `test_batteries`, `treatments`, `trial_bookings`,
`waitlist_entries`.

The full ownership catalog lives inline in the schema-lint rule's ownership map
— the rule is the enforceable source of truth; this doc's Rule 4 is its
human-readable mirror. When a new table lands, extend the rule's map AND this
doc's Rule 4 section in the same commit.

## Rule 5 — Tenant-scoping helpers on non-owning services

Every non-owning service that PERSISTS a column referencing another service's
row composes the sibling tenant-scoping helper from `@stackra/contracts`:

```ts
// notifications-service — a repository over a tenant-scoped table.
import { withTenant } from "@stackra/contracts";

export class PushSubscriptionRepository {
  // withTenant() auto-fills + validates tenant_id from the request
  // tenant context on writes, and scopes every read to the active
  // tenant. Fail-soft: no-ops when no tenant context is bound
  // (single-tenant CLI, test harness, standalone deployment).
  async create(input: NewPushSubscription): Promise<PushSubscription> {
    return this.db.pushSubscriptions.insert(withTenant(input));
  }

  async listForCurrentTenant(): Promise<PushSubscription[]> {
    return withTenant(this.db.pushSubscriptions).all();
  }
}
```

The tenant-scoping helpers — `withTenant`, `withTenantOptional`, `withUser`,
`withApplication`, `withOrganization`, `withBranch`, `withRegion` — live in
`@stackra/contracts`. Every helper:

- **Engages the runtime substrate** when a tenant context is bound (read scope +
  auto-fill on write + write-path guards). Supabase Row-Level Security (RLS)
  policies enforce the same boundary at the database.
- **No-ops silently** when no context is bound (single-tenant CLI, test harness,
  standalone deployment).
- **Never reaches across the database boundary** — validation happens locally
  against the bound tenant context, not via a cross-DB read.

Consuming services import these helpers UNCONDITIONALLY. No feature-detection at
the call site; the guard lives inside the helper.

## Rule 6 — The three-package cross-cutting substrate

Every backend service composes EXACTLY three cross-cutting dependencies from the
workspace framework layer:

1. **`@stackra/contracts`** — light-tier package. Ships every cross-package
   interface, enum, DI token, and tenant-scoping helper. Zero runtime code
   beyond the helper's guarded branches.
2. **`@stackra/database`** — the canonical column helpers (`tenantId()` /
   `applicationId()` / `userId()` / `organizationId()` / `branchId()` /
   `regionId()`) + shared migration + schema utilities.
3. **`@stackra/service-client`** — the typed HTTP transport for cross-service
   calls (per
   [ADR-0087](../../.docs/adr/0087-openapi-first-contract-and-generated-typescript-sdks.md)).
   Every generated `@figentra/<peer>-service-sdk` builds on this.

Every heavy domain package (`@stackra/tenancy`, `@stackra/identity`,
`@stackra/user`, `@stackra/application`, `@stackra/organization`,
`@stackra/branch`, `@stackra/region`, `@stackra/subscription`,
`@stackra/entitlements`, every `@stackra/finance-*`, `@stackra/rbac`,
`@stackra/observability-audit`, `@stackra/observability-activity`,
`@stackra/notifications`, `@stackra/newsletter`, `@stackra/messaging`,
`@stackra/feature-flags`, `@stackra/settings`, ...) lives ONLY in its owning
service. A service that persists a `tenant_id` column DOES NOT install
`@stackra/tenancy` — it composes the tenant-scoping helper from
`@stackra/contracts` + emits the cascade listener via `@stackra/events`.

This inversion is where the Wave 1 refactor lands (see ADR-0089): before the
refactor, every service pulled `@stackra/tenancy` because it needed the tenant
helper and the migrations. After the refactor, only identity-service pulls it —
every other service pulls `@stackra/contracts` + `@stackra/database` and reaches
semantic parity via composition.

## Anti-patterns

| Anti-pattern                                                                | Correct                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `REFERENCES tenants(id)` in a non-identity service's migration              | `tenantId()` column helper. Cascade via a `TenantDeleted` listener.                              |
| `REFERENCES users(id)` in a non-identity service's migration                | `userId()` column helper. Cascade via a `UserDeleted` listener.                                  |
| `REFERENCES branches(id)` in a non-platform service's migration             | `branchId()` column helper. Cascade via a `BranchDeleted` listener.                              |
| `ON DELETE CASCADE` on a cross-service reference column                     | Never. Reference columns emit column + index only; cascade lives in the event listener.          |
| `@stackra/tenancy` in a non-identity service's `package.json`               | `@stackra/contracts` — declare against the tenant-scoping helper only. tenancy is identity's.    |
| `@stackra/identity` in a non-identity service's `package.json`              | `@stackra/contracts` — same rule.                                                                |
| `@stackra/user` in a non-identity service's `package.json`                  | `@stackra/contracts` — same rule.                                                                |
| Duplicating the `tenants` migration in every service's dependency graph     | `tenants` lives in identity-service only. Every other service references via `tenantId()` + event. |
| Hand-rolled tenant-scoping helper in a non-identity service                 | Compose `withTenant` from `@stackra/contracts` per Rule 5.                                        |
| A service reading peer data via SQL (`SELECT ... FROM peer_service.tenants`) | Every peer read goes through the generated SDK per ADR-0087; every peer write via an event.       |
| Any FK across service boundaries                                            | Rule 2 — reference columns + event cascade. No exceptions.                                        |

## Enforcement

Zero-hit greps a reviewer runs before merging:

```sh
# Any cross-service FK inside a foreign service's migrations.
# Handled by the schema-lint rule; grep is a manual backstop.
grep -rEn "REFERENCES tenants" \
  services/{commerce,notifications,observability,platform,marketing}/**/migrations/ \
  services/api/**/migrations/ 2>/dev/null

# Any REFERENCES users / audits outside identity- or observability-service.
grep -rEn "REFERENCES (users|audits)" \
  services/{commerce,notifications,platform,marketing}/**/migrations/ 2>/dev/null

# Heavy domain packages declared as deps outside their owning service.
grep -rE '"@stackra/tenancy"' services/{commerce,notifications,observability,platform,marketing}/package.json 2>/dev/null
grep -rE '"@stackra/identity"' services/{commerce,notifications,observability,platform,marketing}/package.json 2>/dev/null
```

Every grep MUST return zero hits on a compliant workspace. Any hit is either a
legacy migration (backlog: rewrite to reference column + event) OR a Rule 2
violation (reviewer rejects the PR).

The primary enforcement is the CI schema-lint check `no-cross-service-foreign-key`
at every service's lint gate. See
[`.kiro/steering/tenancy-columns.md` §Enforcement](tenancy-columns.md) for the
parallel row-attribution enforcement layer.

## Cross-references

- [ADR-0089](../../.docs/adr/0089-cross-service-fk-ban-and-event-driven-cascade.md)
  — Cross-service FK ban + event-driven cascade (this doc's authorising ADR).
- [ADR-0032](../../.docs/adr/0032-six-service-split.md) — six-service split that
  gives each service its own database.
- [ADR-0033](../../.docs/adr/0033-cross-service-authentication-contract.md) —
  cross-service authentication contract (JWT + `X-Service-Identity` header).
- [ADR-0027](../../.docs/adr/0027-row-level-attribution-three-axes.md) —
  three-axis attribution contract this doc's Rule 4 catalog respects.
- [ADR-0031](../../.docs/adr/0031-application-id-central-plane-extension.md) —
  central-plane `application_id` extension.
- [ADR-0065](../../.docs/adr/0065-central-observability-store-via-sdk.md) — the
  audit + activity central store pattern; the same event fanout shape Rule 3
  extends to every domain event.
- [ADR-0087](../../.docs/adr/0087-openapi-first-contract-and-generated-typescript-sdks.md)
  — the peer-read path via generated TypeScript SDKs (never SQL across service
  boundaries).
- Steering — [`tenancy-columns.md`](tenancy-columns.md) — sibling column
  contract.
- Steering — [`cross-service-events.md`](cross-service-events.md) — the cascade
  event contract Rule 3 delegates to.
- Steering — [`observability-signals.md`](../../.ref/steering/observability-signals.md) — parallel
  three-signal contract via `@stackra/events`.
- Package — `@stackra/database` — the canonical column helpers + schema utilities.
- Package — `@stackra/events` — the event bus (Cloudflare Queues fanout).
