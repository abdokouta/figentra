# 19 — Environments & CI/CD

**Status:** Baseline
**Owner:** Platform infrastructure
**Related:** [15 Infrastructure & IaC](15-infrastructure-and-iac.md), [12 Versioning](12-versioning.md), [16 Observability](16-observability.md)

---

## 1. Purpose

Define environments, per-environment configuration, the CI/CD pipeline, and the
deployment flow — consistent with R-2 (Terraform is the deploy plane; Wrangler
deploys artifacts; Figentra is not a CI/CD platform).

---

## 2. Environments

Three standard environments:

```text
Development → Staging → Production
```

- Each environment has its **own** Terraform state ([15 §6]), config, secrets,
  Cloudflare resources, Supabase project/branch, and Supabase Auth instance/config as
  appropriate.
- Applications carry **environment-aware registry records** ([06 §4]):

```json
{ "application": "crm", "environment": "production", "url": "https://crm.figentra.com" }
```

Preview environments per PR are **out of scope** as a platform service (R-2). If
ephemeral preview is desired, it is achieved through the normal Terraform +
Wrangler flow in a scratch environment, not a bespoke Figentra preview-env
engine.

---

## 3. Per-environment configuration

Configuration is environment-based; secrets are never committed ([15 §9]):

```text
SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF
DATABASE_URL
REDIS_URL
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET   (or Paddle equivalents)
CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN
BETTER_STACK_...  SENTRY_DSN
```

Separate values per `development` / `staging` / `production`. Config lives in
env/CI secret stores; the platform reads it at runtime.

---

## 4. Two pipelines (kept separate)

Infrastructure and application deployment are **separate** flows.

### 4.1 Infrastructure (Terraform)

```text
Code → terraform fmt → terraform validate → terraform plan → Review → terraform apply
```

Runs on infrastructure changes only. Never auto-applied without review.

### 4.2 Application (Wrangler)

```text
Pull Request
   ├── typecheck
   ├── lint
   ├── unit tests
   ├── integration tests
   └── security checks
        ↓
Build
   ├── frontend artifact (Vite)
   └── Docker image (Container services)
        ↓
Staging  → smoke tests
        ↓
Production
```

- **Workers:** `wrangler deploy` in CI.
- **Containers:** Docker build → push to Cloudflare Container registry →
  `wrangler deploy` → Worker + Container rollout.
- Cloudflare Worker/Container deployment is executed through **Wrangler in CI**;
  Terraform runs separately for infra.

---

## 5. Container deployment standard

Every substantial Node service ships:

```text
Dockerfile · health endpoint · startup logging · structured logs
readiness behavior · graceful shutdown (SIGTERM) · non-root user
pinned Node major · lockfile · small image
```

Deployment flow:

```text
Git → CI (test/lint/build) → Docker build → Cloudflare Container registry → wrangler deploy → rollout
```

Design for cold starts + scale-to-zero ([15 §2.2]).

---

## 6. Release & versioning integration

- Packages/SDK use **Changesets** for versioning + changelogs ([12 §7]).
- Public API version routing + deprecation headers are applied per
  [12 Versioning](12-versioning.md).
- A release does not break existing contracts without a new version + migration
  path.

---

## 7. Promotion

```text
Development → Staging → Production
```

- Promotion is a deliberate, reviewed step (merge to the environment branch or a
  gated pipeline stage), not automatic prod deploys on every merge.
- Staging must pass smoke tests before production.
- Infra changes promote through the same env progression via per-environment
  Terraform state.

---

## 8. CI gates (summary)

Every service PR must pass, before merge:

```text
typecheck · lint · unit tests · integration tests · security checks
```

Then build → staging (smoke) → production. Add tests for business rules; do not
add tests speculatively where they add no value (matches the platform's
"test business rules" guidance, [10 §8]).

---

## 9. Non-goals / anti-patterns

| Anti-pattern                                                    | Correct                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| A Figentra-owned CI/CD / preview-env platform                  | Terraform + Wrangler + standard CI (R-2).                   |
| One pipeline mixing infra apply + app deploy                    | Two separate flows.                                         |
| Auto-`terraform apply` without review                           | Plan → review → apply.                                      |
| Auto prod deploy on every merge                                 | Reviewed promotion; staging smoke first.                    |
| Committing secrets / per-env values into git                    | Env/CI secret stores ([15 §9]).                             |
| Breaking a public contract without a new version                | Version + deprecation path ([12]).                          |

---

## 10. Open questions

- Confirm the CI system (GitHub Actions assumed — also the initial Terraform
  runner in [15 §8]).
- Confirm whether ephemeral scratch environments are needed pre-v1 or deferred.
