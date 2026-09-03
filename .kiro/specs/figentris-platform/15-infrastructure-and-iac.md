# 15 — Infrastructure & IaC

**Status:** Baseline **Owner:** Platform infrastructure **Related:**
[01 Architecture](01-platform-architecture.md),
[09 Service communication](09-service-communication.md),
[19 Environments & CI/CD](19-environments-and-cicd.md)

---

## 1. Purpose

Define the compute model (Cloudflare Workers vs Containers), the Terraform /
Wrangler ownership boundary, the optional Infrastructure Orchestrator API, and
secrets/config. This carries R-2: **Figentra is not a deployment PaaS** —
Terraform is the deployment plane.

---

## 2. Compute strategy

Cloudflare is the **default** edge + application-compute platform. Choose the
**smallest appropriate runtime**:

```text
Lightweight / edge
    → Cloudflare Worker + Hono

Substantial application/service
    → Cloudflare Container + Node.js 22 + NestJS + Docker

Specialized / exceptional workload
    → External compute (AWS/GCP/Azure) — escape hatch only
```

### 2.1 Workers (edge/lightweight)

Use for: API Gateway, Application Registry, edge routing, auth middleware, rate
limiting, webhook ingress, small stateless APIs, frontend asset delivery,
Cloudflare-native integrations. Prefer **bindings** over REST for Cloudflare
resources; **service bindings** for Worker→Worker; **Queues/Workflows** for
async; **Durable Objects** for stateful coordination; **Hyperdrive** for
external Postgres from Workers.

### 2.2 Containers (substantial services)

Use for: IAM, Tenant, Monetization, Audit, Notifications, and application
backends that need full Node/NestJS. A Worker sits in front of each Container
([09 §5]).

**Container rules (stateless by contract):**

- Keep containers stateless; do not use container disk as the system of record.
- Persist to Supabase / R2 / D1 / Durable Object storage ([14]).
- Fast, deterministic startup; health + readiness endpoints; handle SIGTERM /
  graceful shutdown.
- Tolerate **cold starts** and **scale-to-zero** — never assume a process stays
  warm; never rely on local filesystem across restarts/sleep.
- Small Docker images; pinned Node major; lockfile committed.

### 2.3 External compute (escape hatch)

AWS/GCP/Azure only when a workload materially exceeds the Cloudflare model: GPU,
very large memory/CPU, specialized networking, persistent stateful workloads, or
a required vendor-managed service. It is an **escape hatch**, not the default.
AWS free-tier/credits do not justify architecture choices.

---

## 3. Deployment plane = Terraform (R-2)

Figentra is **not** Heroku/Vercel/Render. There is **no** platform Build /
Artifact / Deployment / Preview-env service. New product deployments are managed
through **Terraform**:

```text
Git → Terraform → Cloudflare + AWS + Supabase + Supabase Auth + Stripe/Paddle
```

Figentra **orchestrates** infrastructure (declares desired state); it does not
**become** the infrastructure scheduler.

Removed from scope (vs. the early PaaS proposal): Build Service, Artifact
Service, Deployment Scheduler, custom container orchestrator, Preview
Environment Service, custom CI/CD engine.

---

## 4. Terraform / Wrangler boundary (mandatory)

```text
TERRAFORM owns (durable infra + provider config)
├── Cloudflare: zones, DNS, routes, D1, KV, R2, Queues, DO config, access/security
├── Supabase Auth: application/instance configuration (where the provider supports it)
├── Supabase: projects/config (where supported)
├── Better Stack: monitors, heartbeats, status pages, telemetry, dashboards, alerts, on-call
└── secret references/config (never plaintext secrets)

WRANGLER owns (deploy artifacts)
├── Worker source deployment
├── Worker bindings that are part of the app deployment
├── Container image build/push/deploy
└── Container rollout + deploy-specific runtime config
```

**Never** create a Terraform resource that fights Wrangler for the same deploy
artifact. Terraform = durable state; Wrangler = application build/deploy.

---

## 5. Providers

```text
cloudflare/cloudflare     primary infrastructure
supabase/supabase       identity provisioning (Platform API resources are beta / require enablement)
supabase/supabase         database/project configuration
Better Stack provider     observability
hashicorp/aws             optional escape hatch
```

Rules:

- Pin provider versions; verify each resource against the **pinned** version —
  do not assume every new Cloudflare product has a Terraform resource yet.
- Do not make Figentra depend on the Supabase Auth provider being able to create
  every Supabase Auth object; runtime identity remains Supabase Auth's
  responsibility.
- Terraform never contains application secrets in plaintext — use secret
  references / env / CI secret stores.

---

## 6. Terraform state

- Remote backend with **state locking** (e.g. S3 + DynamoDB lock, or HCP
  Terraform). **Do not** store Terraform state in the Figentra database.
- One state per environment (dev / staging / production) — [19].
- `terraform.tfstate` is never committed.

---

## 7. Repository structure

```text
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── cloudflare-zone/
│   │   ├── cloudflare-worker/
│   │   ├── cloudflare-container/
│   │   ├── cloudflare-d1/
│   │   ├── cloudflare-queue/
│   │   ├── supabase/
│   │   ├── supabase/
│   │   └── betterstack/
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   └── providers.tf
├── wrangler/
│   ├── gateway/
│   └── registry/
└── docker/
    ├── iam/
    ├── tenant/
    └── monetization/
```

Module names are logical boundaries; use only resources the pinned provider
supports. Per the workspace `AGENTS.md`, these trees are created only when the
first real implementation lands — this is the target layout, not a scaffold to
generate now.

---

## 8. Infrastructure Orchestrator API (optional)

Figentra **may** expose an API to trigger Terraform runs — but must **not**
execute arbitrary `terraform apply` directly from an HTTP request.

```text
Figentra API
    ↓ enqueue run
Infrastructure Run  (record: plan | apply | destroy)
    ↓
Queue
    ↓
Terraform Runner  (GitHub Actions initially; CodeBuild / CF Container later)
    ↓
Terraform → Cloudflare / AWS / Supabase / Supabase Auth / Stripe
    ↓ callback
Figentra (run status + logs)
```

Illustrative API:

```text
POST /v1/infrastructure/plans
POST /v1/infrastructure/applies
POST /v1/infrastructure/destroy
GET  /v1/infrastructure/runs/:id
GET  /v1/infrastructure/runs/:id/logs
```

- The infrastructure **definition** remains Terraform, not a JSON deploy engine.
- The runner is **GitHub Actions + Terraform** initially (simplest); it can move
  to CodeBuild or a Cloudflare Container later.
- Whether this API ships in v1 or Terraform is run by hand initially is **O-5**.

---

## 9. Secrets & configuration

Separate **secrets** from **configuration**.

|                | Secrets                                                                                            | Configuration                                                 |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Examples       | `DATABASE_URL`, `SUPABASE_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`, integration OAuth tokens             | API URLs, timeouts, limits, feature config, region, log level |
| Store          | Secret store (Cloudflare Secrets Store / secret manager); referenced by `credential_ref` ([07 §7]) | Env-based config per environment                              |
| Must NOT enter | Registry, frontend runtime, manifest, git, logs, events                                            | —                                                             |

Secrets flow: environment-scoped, never committed, never logged. The Integration
Platform stores only a `credential_ref`; the secret material lives in the secret
store ([07 §7]). Terraform manages secret **references**, not values.

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                                 | Correct                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| Building a Figentra Build/Deploy/Artifact/PaaS engine        | Terraform + Wrangler (R-2).                                |
| Forcing NestJS into a Worker or rewriting NestJS→Hono        | Worker+Hono for edge; Container+NestJS for substantial.    |
| Terraform + Wrangler fighting over the same artifact         | Terraform = durable infra; Wrangler = deploy artifact.     |
| `terraform apply` directly from an HTTP handler              | Enqueue a run → runner → Terraform → callback.             |
| Terraform state in the Figentra DB                           | Remote backend with locking.                               |
| Secrets in Terraform / registry / frontend / manifest / logs | Secret store; Terraform manages references only.           |
| Choosing AWS because of the free tier                        | Choose by total architecture/ops cost; AWS = escape hatch. |
| Assuming a container stays warm / disk persists              | Stateless containers; external system of record.           |

---

## 11. Open questions

- **O-5** — Does the Infrastructure Orchestrator API ship in v1, or is Terraform
  run by hand at launch? Determines whether an `infrastructure` API surface +
  runner exist early.
- Confirm the Terraform state backend (S3+DynamoDB vs HCP Terraform).
