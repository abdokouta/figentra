---
authored_by: kiro
authored_at: 2026-08-31
source: prompt://production-and-full-deployment-roadmap
reviewed_by: null
reviewed_at: null
---

# Production & full-deployment roadmap

The executable, ops-and-delivery companion to
[`spec 20 — Implementation Roadmap`](../specs/figentris-platform/20-implementation-roadmap.md).
Spec 20 defines **what** to build and the P0/P1/P2 capability tiers; this plan
defines **how we get every deployable live across dev → staging → prod** and
**who owns each step**. Drive it top-to-bottom; check items off in place.

> **Scope note.** The brand is **figentra** (the repo folder is
> `figentris-platform`; the code, packages, and domains are all `figentra`).

---

## Legend

**Owner tags**

- 👤 **Human-only** — accounts, billing, credentials, store consoles, DNS
  ownership, production apply approvals. These are MUST-escalate per
  [`ai-agent-governance.md`](../steering/ai-agent-governance.md); the agent
  never does them autonomously.
- 🤖 **Agent-executable** — code, IaC authoring, scaffolds, scripts, docs,
  non-prod plans. The agent can do these end-to-end on a feature branch.
- 🤝 **Shared** — agent drafts/proposes + wires; human provides input, a secret,
  or an approval.

**State**

- `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Current state snapshot (2026-08-31)

Verified this session:

- **19 deployables** scaffolded and registered in `npm overrides`:
  - **11 NestJS services** (`cloudflare-container`): `iam`, `tenant`,
    `monetization`, `notifications`, `integration`, `audit`, `workflows`,
    `approval`, `reporting`, `search`, `webhook`.
  - **4 Cloudflare Workers**: `api-gateway`, `application-registry` (+ D1),
    `ai-gateway` (Hono, subdomain `ai`), `infrastructure-orchestrator` (Hono,
    subdomain `infra`).
  - **3 static assets** (`cloudflare-assets`): `portal`, `figentra-landing`,
    `academorix-landing`.
  - **1 mobile** (`expo-mobile`): `family`.
- **Entities**: every entity is **id-only** MikroORM `defineEntity` and now
  carries the **7 base columns** (`metadata`, `createdBy`, `updatedBy`,
  `deletedBy`, `createdAt`, `updatedAt`, `deletedAt`) — 40/40 entities, applied
  by `scripts/patch-entity-base-columns.mjs` (idempotent).
- **Green gates**: `npm install` clean · all 11 services `tsc --noEmit` clean ·
  `npm overrides` resolves 19 deployables · `terraform validate` → Success.

What is **NOT** done: zero CI, zero live infra, zero real secrets, zero Doppler
projects provisioned, zero business logic (services are Nest hello-world shells;
workers are stubs; UIs are shells). This plan closes that gap.

---

## Two shaping decisions (answer these first)

These set the sequence for everything below.

- [ ] 🤝 **D-A · "Production" definition — walking-skeleton-first vs
      feature-first.**
  - **Walking-skeleton-first (recommended):** ship all 19 scaffolds to dev →
    staging → prod first. Proves the entire pipeline (Track A) with cheap
    payloads, then fills in Track B behind a live, promotable platform.
  - **Feature-first:** build Track B product depth before the pipeline exists —
    higher risk, no promotion path to validate against.
  - _Recommendation: walking-skeleton-first. Track A Phases 0–3 to dev, then
    Track B per spec-20 phase order._
- [ ] 🤝 **D-B · DNS zones in Terraform or pre-created?** The `dns` module
      currently **looks up** zones by name, so `figentra.com` + `academorix.com`
      must pre-exist in Cloudflare. Either (a) 👤 create the zones + point
      nameservers first, or (b) 🤖 move zone-creation into TF. _Recommendation:
      (a) for the two apex zones (human owns registrar), TF-manage records._

---

## Track A — Platform & deployment readiness

### Phase 0 — Accounts, secrets, published deps (hard blockers, mostly 👤)

Nothing in Phases 1+ can start until these land. Ordered by unblock-value.

- [~] 👤 **AWS account move** — new account id + creds; bootstrap the S3 state
      bucket. _In progress; top blocker._ Agent needs: account id, region,
      bucket name, dynamodb/lockfile choice (backend is already
      `use_lockfile=true`), and confirmation the credentials are active.
- [ ] 🤝 **Publish `@stackra/*` config packages** (`oxlint` / `typescript` /
      `prettier`) to npm — **hard CI blocker**. The current `link:`→`~/dev`
      overrides won't exist on a CI runner. Alternatives: (a) publish to npm
      (OTP-gated — 👤), (b) switch to git deps (🤖). _Pick one before Phase 4._
- [ ] 👤 **Cloudflare** — confirm the `figentra` account; create the
      `academorix` account; mint an API token per account; create/verify zones
      `figentra.com` + `academorix.com` (nameservers → Cloudflare). See **D-B**.
- [ ] 🤝 **Doppler** — `figentra-workspace/dev` (Layer 1 tooling) + **one
      project per deployable** with `dev`/`stg`/`prd` configs; populate secrets;
      mint env-scoped CI service tokens. **⚠ Free-tier cap:** we now have 19
      deployables → ~20 projects incl. workspace. Decide: consolidate
      (config-per-env inside fewer projects), or upgrade tier. _Tracked as
      **W5** below._
- [ ] 👤 **GCP** — org id + billing account + Terraform service-account JSON
      (Firebase/FCM for mobile push).
- [ ] 👤 **Expo/EAS** — account + `EXPO_TOKEN` + account name.
- [ ] 👤 **Supabase** — org id + management token + per-env DB passwords.
- [ ] 👤 **Sentry** — orgs (`figentra`, `academorix`) + a project per deployable
      + DSNs.
- [ ] 👤 **Better Stack** — API token (monitors + status page).
- [ ] 👤 **Supabase Auth** — instances per env + keys. `variables.tf` names Supabase Auth the
      **runtime identity authority** (spec 20 Phase 1 = "Supabase Auth configured");
      identity is composed, not built.
- [ ] 👤 **Apple Developer + Google Play** — accounts for mobile store delivery.

### Phase 1 — Terraform infra bring-up (per env: dev → staging → prod)

- [ ] 🤖 Bootstrap the S3 state bucket (new account) → `terraform init` → create
      `dev` / `staging` / `production` workspaces. _(Blocked on Phase 0 AWS.)_
- [x] 🤖 **Two-phase apply ordering DOCUMENTED 2026-08-31** →
      [`.docs/runbooks/two-phase-apply.md`](../../.docs/runbooks/two-phase-apply.md).
      Repo-accurate 3-step sequence per env: **(1)** TF apply bindable resources
      (D1/KV/Queue/R2) + Supabase + zone → **(2)** Wrangler deploys the
      Worker/Container scripts → **(3)** TF attaches custom-domains/routes. The
      CI pipeline automates this (`tf:apply` → `deploy:*` → `tf:apply`).
      _(Live apply still blocked on Phase 0 AWS + the DNS-zone decision.)_
- [ ] 🤝 Supabase project per env; Firebase/GCP project + FCM; EAS app + update
      channels.
- [ ] 🤝 `plan → review → apply` per env; capture outputs (resource ids). Prod
      apply is 👤 MUST-escalate.

### Phase 2 — Runtime config & binding wiring

- [ ] 🤖 Inject TF outputs (D1/KV/Queue ids) into each `wrangler.jsonc` binding.
- [ ] 🤝 Populate Layer-2 Doppler runtime env per deployable per env: `VITE_*`,
      `LOG_LEVEL`, peer `*_SERVICE_URL`, `DATABASE_URL`, Supabase Auth project configuration, Sentry DSN.
- [ ] 🤖 Verify `remap-secrets.sh` covers every alias (`WORKSPACE_AWS_*`,
      Cloudflare ×2, GCP, Expo, Supabase, Better Stack).

### Phase 3 — App deploy pipelines (walking skeleton live everywhere)

- [ ] 🤝 **Assets** (portal + 2 landings): `pnpm build` → `wrangler deploy`
      (static assets) → custom domain.
- [ ] 🤝 **Workers** (api-gateway, application-registry, ai-gateway,
      infrastructure-orchestrator): `wrangler deploy` + bindings +
      `wrangler secret`.
- [ ] 🤝 **Containers** (11 NestJS services): docker build/push → container
      deploy + fronting worker → `/health` + `/health/ready` reachable → queue +
      DB wired.
- [ ] 🤝 **Mobile** (family): app config (bundle `com.figentra.family`, scheme,
      associated domain `app.figentra.com`), FCM creds, EAS build iOS+Android,
      EAS Update, store submit.
- [ ] 🤝 **Prove dev end-to-end** (every deployable reachable at its
      `*.dev.<tld>`), then promote staging, then prod.

### Phase 4 — CI/CD (pipeline AUTHORED 2026-08-31 → [`.gitlab-ci.yml`](../../.gitlab-ci.yml))

- [x] 🤝 **D-C · Platform = GitLab** (workspace convention; spec 19 §10's
      "GitHub Actions assumed" is superseded here). _Confirm if you prefer
      GitHub Actions instead — the stage design ports 1:1._
- [x] 🤖 Pipeline authored: `install → format:check → lint → typecheck →
      test(non-blocking) → catalog:drift → build → docker:build →
      tf validate/plan/apply → wrangler deploy (workers + containers) → eas`.
- [x] 🤖 Branch→env inlined: `develop→dev`, `staging→staging`,
      `main→production`.
- [x] 🤝 Doppler-injected creds (`doppler run --config <env>`), no plaintext;
      **prod `tf:apply` + every prod deploy = `when: manual`** (👤 MUST-escalate).
- [x] 🤖 Turbo `affected` on MRs (`--filter=...[$CI_MERGE_REQUEST_DIFF_BASE_SHA]`).
- [ ] 🤖 **Runs green only after Phase 0** — `npm install` needs `@stackra/*`
      configs published (the `link:`→`~/dev` overrides don't resolve on a CI
      runner); infra/deploy stages need the Doppler + AWS + Cloudflare + EAS
      tokens. Pipeline is correct + committed; it activates when the credentials
      land.

### Phase 5 — Data layer

- [ ] 🤖 Per-service Supabase schemas + migrations (each service owns its
      schema) + migration tooling + seeds; wire `DATABASE_URL`.
- [ ] 🤝 Prod backups / PITR.
- [ ] 🤖 **Depends on W4** (MikroORM `forFeature` wiring) and **W2**
      (full property sets) — id-only entities can't generate meaningful
      migrations yet.

### Phase 6 — Observability & ops

- [ ] 🤖 Sentry wired + source-map upload + releases per build.
- [ ] 🤝 Better Stack monitors (TF, health-path-aware via
      `try(each.value.container.health_path,"/")`) + status page.
- [ ] 🤝 Cloudflare Logpush / dashboards; alerting / on-call.
- [ ] 🤖 Deploy / rollback / incident runbooks under `.docs/runbooks/`.

### Phase 7 — Security & compliance hardening

- [ ] 🤖 Cloudflare WAF, rate limits, HSTS, cache rules
      (per [`cloudflare-conventions.md`](../steering/cloudflare-conventions.md)).
- [ ] 🤝 Supabase Auth + RBAC + tenancy isolation (minors' data → COPPA/FERPA).
- [ ] 🤝 PCI scope for `monetization`/billing
      ([`pci-scope.md`](../../.docs/compliance/pci-scope.md)); SOC2 controls
      ([`soc2-controls.md`](../../.docs/compliance/soc2-controls.md)).
- [ ] 👤 Secrets rotation; least-priv tokens; DR/rollback rehearsal.

### Phase 8 — Mobile store readiness

- [ ] 👤 App Store Connect + TestFlight + provisioning; Google Play console +
      internal track.
- [ ] 🤖 AASA (`app.figentra.com/.well-known/apple-app-site-association`) +
      `assetlinks.json`.
- [ ] 🤝 EAS credentials (keystore, push keys); store assets + privacy /
      data-safety declarations.

### Phase 9 — Verification & go-live

- [ ] 🤝 Smoke + E2E per env; Lighthouse budgets; k6 load; WCAG 2.2 AA a11y.
- [ ] 🤝 Per-promotion go/no-go checklist.
- [ ] 👤 Prod cutover + rollback rehearsal.

---

## Track B — Application feature development

The real product work behind the endpoints. **Sequence per spec-20 §2**
(control plane before applications); each maps to a spec-20 phase. All 🤖 with
🤝 review, gated on **W4** (ORM wiring) + **W2** (full entity models).

- [ ] **`iam`** — auth/identity/RBAC + policy engine module (spec 04; spec-20
      Phase 3). _Today: nest shell._
- [ ] **`tenant`** — tenancy / org / branch / academy model (spec 03; Phase 2).
- [ ] **`monetization`** — billing / subscriptions / entitlements + PCI surface
      (spec 05; Phase 5).
- [ ] **`application-registry`** — registry logic + D1 schema (spec 06; Phase 4).
- [ ] **`api-gateway`** — routing / auth / rate-limit (spec 08). _Today: stub._
- [ ] **`portal` + landings** — real UI / features (spec 13; Phase 6).
- [ ] **`family`** — mobile app features.
- [ ] **P1 services** — `notifications`, `integration`, `workflows`, `approval`,
      `webhook` (spec 07/11). **P2** — `reporting`, `search`, `ai-gateway`,
      `infrastructure-orchestrator`.
- [ ] **Shared** — domain models, DB schemas, cross-service `@figentra/contracts`
      (contracts-before-consumers, spec 09 §8), test suites.
- [ ] **Phase-7 model validation** — build ONE application end-to-end and prove
      every seam (spec 20 §6) before adding more.

---

## New workstreams (this session's additions)

- [x] **W1 · Base columns on every entity** — `metadata` + `createdBy` /
      `updatedBy` / `deletedBy` + `createdAt` / `updatedAt` / `deletedAt` on all
      40 entities via `scripts/patch-entity-base-columns.mjs` (idempotent;
      re-runnable). All 11 services typecheck clean. **Done 2026-08-31.**
- [ ] **W2 · Entity-model expansion** 🤖 — replace id-only scaffolds with the
      full property sets from the specs, and add the **satellite/sub-entities**:
  - Tenant satellites — tenant configuration, branding/theme, verification, etc.
    (spec 03). _Note: per current scoping, `Branding`/`Theme` belong to the
    future per-Application **`api`** service domain, not `tenant` — confirm._
  - The **`api` per-Application service** domain (not yet scaffolded):
    Region / Organization / Branch / Facility / Team / Staff / Branding / Theme.
  - Blocks Phase 5 (migrations) + Track B.
- [x] **W3 · AI-Gateway decision** 🤝 — **DECIDED 2026-08-31**
      ([ADR-0113](../../.docs/adr/0113-ai-gateway-cloudflare-managed.md)). Use
      Cloudflare **managed** AI Gateway for the proxy plane; demote
      `workers/ai-gateway` to an optional thin **platform-policy** layer
      (entitlement / persona / cost) or drop it. No speculative
      `cloudflare_ai_gateway` HCL until the resource is verified present in
      `cloudflare ~> 5.20` (spec 15 §5). Follow-ups tracked in the ADR
      (verify resource · keep-vs-drop review).
- [x] **W4 · MikroORM `forRoot` / `forFeature` wiring** 🤖 — **DONE 2026-08-31**
      via `scripts/wire-mikro-orm.mjs` (idempotent). Per-service
      `DatabaseModule` (`forRoot` + PostgreSQL driver + `DATABASE_URL` +
      `autoLoadEntities`), `forFeature([...])` in all 37 feature modules,
      `DatabaseModule` imported into all 11 `app.module`s. **typecheck + build
      green.** Runtime boot connects `DATABASE_URL` → remains gated on Phase 5
      (live Supabase Postgres); typecheck/build never boot, so both stay green
      without a DB.
- [ ] **W5 · Doppler project topology** 🤝 — reconcile 19 deployables against
      the Doppler free-tier project cap. Decide consolidate-vs-upgrade
      (see Phase 0).
- [x] **W6 · ULID prefix registry** 🤖 — **DONE 2026-08-31**. 15 service-plane
      prefixes registered in spec 18 §5
      (`wf_ wfr_ apr_ apd_ rpt_ rptr_ sidx_ sq_ ntf_ chan_ ntpl_ npref_ whs_
      whe_ whd_`) + a Rules bullet noting the audit micro-gap (audit-log reuses
      `evt_`; `alog_` / `retpol_` / `aud_` pending the audit data model).
- [ ] **W7 · Internal-service exposure** 🤝 — new internal services were given
      public subdomains for TF fqdn consistency; spec 01 §3 prefers
      **internal-behind-gateway**. Refine TF so internal services route via
      `api-gateway` rather than public custom domains.

---

## Decisions register

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| DR-1 | Policy engine placement | **Module inside `iam`** (`services/iam/src/modules/policies`, spec 04 §7) | Separate service |
| DR-2 | AI Gateway | **Flag redundant** vs CF AI Gateway; prefer CF-managed + thin policy worker or drop (**W3**) | Full custom worker gateway; unilateral delete |
| DR-3 | Infrastructure Orchestrator | **Hono worker** (terraform-as-a-service; runs delegated to CI) | Skip it |
| DR-4 | Webhook platform | **NestJS on-substrate** (Supabase + CF Queues); Convoy documented as buy-alt in README | Adopt Convoy now |
| DR-5 | Base columns | User's exact 7-column list only (no `tenant_id`/`application_id` in base — those are per-entity domain columns) | Add tenancy axes to base |
| DR-6 | Entity style | `defineEntity` (spec 10 R-4 default) | class + decorator |
| DR-7 | Sub-entities | Deferred to **W2** (spec-driven, not invented now) | Invent satellites ad hoc |

---

## Critical path (dependency order)

```text
AWS account + state bucket ─┐
                            ├─► terraform init ─► Phase 1 (infra) ─► Phase 2 ─► Phase 3 (deploy) ─► Phase 9 (go-live)
Cloudflare accounts + zones ┘                                        ▲
                                                                     │
Publish @stackra/* configs ─► Phase 4 (CI) ──────────────────────────┘
Doppler projects (W5) ─────► Phase 2 runtime secrets
W4 (ORM wiring) + W2 (full models) ─► Phase 5 (data/migrations) ─► Track B
```

**Immediate next (unblocks the most):**

1. 👤 Finish the **AWS account move** → 🤖 bootstrap state + `terraform init` +
   real per-env plan.
2. 🤝 **Publish `@stackra/*` configs** (or approve git-deps) → unblocks CI
   installs.
3. 🤝 **Confirm CI platform** (GitLab?) → 🤖 scaffold the pipeline.
4. 🤝 Answer **D-A** (skeleton-first vs feature-first) → sequences Track A vs B.

---

## Cross-references

- [`spec 20 — Implementation Roadmap`](../specs/figentris-platform/20-implementation-roadmap.md)
  — capability tiers + phased build order (the "what").
- [`spec 15 — Infrastructure & IaC`](../specs/figentris-platform/15-infrastructure-and-iac.md)
- [`spec 19 — Environments & CI/CD`](../specs/figentris-platform/19-environments-and-cicd.md)
- [`spec 14 — Data & Persistence`](../specs/figentris-platform/14-data-and-persistence.md)
  — the base-columns contract W1 satisfies.
- [`spec 18 — Error model & API conventions`](../specs/figentris-platform/18-error-model-and-api-conventions.md)
  §5 — ULID prefix registry (W6).
- [`ai-agent-governance.md`](../steering/ai-agent-governance.md) — MAY vs
  MUST-escalate (every 👤 item is escalate-before-action).
- `scripts/patch-entity-base-columns.mjs` — the idempotent W1 patcher.
- [`2026-08-30 production-readiness audit`](../reports/2026-08-30-figentris-monorepo-production-readiness-audit.md).
