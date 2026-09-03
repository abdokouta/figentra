---
inclusion: always
authored_by: kiro
authored_at: 2026-08-04
source: prompt://workspace-env-naming-convention
reviewed_by: null
reviewed_at: null
---

# Env var + secret naming (workspace-wide)

> **ADR anchor.** Codified by
> [ADR-0085](../../.docs/adr/0085-workspace-env-var-naming.md) — workspace-wide
> env var + secret naming convention. Every rule below is enforceable; every
> exception is a review-blocking finding until an amendment lands in the ADR.

The single naming rule for every env var, Doppler-stored secret, terraform
variable, `.env.example` entry, `docker-compose.yml` reference, `wrangler.toml`
binding, `process.env.*` read, and framework runtime-injected value across every
workspace tier and every downstream repo (~130 repos as of 2026-08-04).

Read alongside:

- [`.kiro/steering/brand-hierarchy.md`](brand-hierarchy.md) — the three-brand
  model this doc's `<BRAND>` slot operationalizes.
- [`.kiro/steering/package-naming.md`](package-naming.md) — sibling naming
  convention for npm vendor scopes.
- [`.kiro/steering/doppler.md`](doppler.md) — Doppler-per-deployable rule + the
  `figentra-workspace/dev` shared project this convention's Layer 1 targets.
- [`scripts/_lib/env-naming.mjs`](../../scripts/_lib/env-naming.mjs) — the
  machine-readable canonical map (single source of truth for every script).

## Precedence

1. This file wins over generic env-var naming guidance elsewhere in the repo.
2. Framework runtime prefixes (`VITE_*`, `EXPO_PUBLIC_*`, `TF_VAR_*`, `AWS_*`)
   are EXTERNAL contracts — they always come first in the key stem. This doc's
   `<BRAND>_<VENDOR>_<RESOURCE>` shape applies to the segment AFTER any runtime
   prefix.
3. When this file and a repo's local README disagree, this file wins.

## The three layers

Every env var / secret lives in EXACTLY ONE layer. The layer determines the
naming rule:

```
Layer 1 — Workspace-tooling
  Location: Doppler project figentra-workspace/dev (SOLE source of truth)
  Access:   `doppler run --scope <workspace-path> --` at the consumer
            edge; workstation-scope binding stored in ~/.doppler/
            (via `doppler login` OR `doppler configure set token`).
            No local mirror file (retired 2026-08-09).
  Serves:   terraform, CI, workspace scripts, cross-brand tooling
  Naming:   <BRAND>_<VENDOR>_<RESOURCE>[_<QUALIFIER>]

Layer 2 — Per-deployable
  Location: Doppler project <deployable>/<env>
            e.g. figentra-identity-service/prd
                 academorix-api/dev
                 figentra-landing/prd
                 academorix-mobile/stg
  Serves:   the deployable's runtime (Cloudflare Worker env, Vite build,
            Expo build, RN app bundle)
  Naming:   [<RUNTIME_PREFIX>_]<VENDOR>_<RESOURCE>[_<QUALIFIER>]

Layer 3 — Runtime-injected client bundles
  Location: baked into the built bundle at deploy time by the build tool
  Serves:   browser SPA + RN app clients
  Naming:   Same as Layer 2 (mandated runtime prefix + no brand).
            Distinct only because the runtime prefix is a syntactic constraint.
```

## Rule 1 — Layer 1 keys carry `<BRAND>_<VENDOR>_<RESOURCE>[_<QUALIFIER>]`

Every key in `figentra-workspace/dev` Doppler follows this shape. All segments
SCREAMING_SNAKE_CASE.

### `<BRAND>` — one of exactly four values

| Prefix       | Owns                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `FIGENTRA`   | Figentra corporate operator resources — figentra Cloud org, figentra Cloudflare account, figentra Sentry (default org), figentra GitLab, etc.   |
| `ACADEMORIX` | Academorix product resources — academorix Cloud org, academorix Cloudflare account (post-split), academorix Resend, Apple / Play (mobile), etc. |
| `STACKRA`    | Stackra framework operations — stackra GitLab namespace, stackra npm registry, HeroUI Pro token, Uniwind token (framework-tier consumers).      |
| `WORKSPACE`  | Cross-brand shared vendors — AWS terraform state backend (single account), OneUptime (single project), Better Stack, PagerDuty, Slack, GCP.     |

Never invent a fifth brand. `SHARED_`, `COMMON_`, `GLOBAL_` are review-blocking
findings — use `WORKSPACE_`. Never omit the brand — bare `SENTRY_AUTH_TOKEN` in
Layer 1 is a finding.

### `<VENDOR>` — canonical name from §Vendor catalog

One spelling per vendor. See §Vendor catalog below.

### `<RESOURCE>` — the artifact kind

Reserved values (extend the list only via an ADR amendment):

```
TOKEN                      Generic authentication token
API_KEY                    API-style key (interchangeable with TOKEN — pick vendor's docs' spelling)
AUTH_TOKEN                 Reads / general-scope token (distinct when a MANAGE_TOKEN exists)
MANAGE_TOKEN               Admin-scope token
DEPLOY_TOKEN               Deploy-scope token
DEPLOY_USER                Deploy user for tokenless auth
ACCOUNT_ID                 Vendor's account identifier
ACCOUNT_TOKEN              Account-scoped token (distinct from user token)
ZONE_ID                    Cloudflare zone ID
PROJECT_ID                 Vendor project ID (Sentry, OneUptime, GCP)
ORG_SLUG                   Vendor org / workspace slug
INTEGRATION_KEY            PagerDuty-style ingest key
WEBHOOK_URL                Full webhook URL
DSN                        Sentry Data Source Name
SIGNING_KEY                Cryptographic signing material
BILLING_ID                 Billing account ID (GCP)
SERVICE_ACCOUNT_JSON_PATH  Filesystem path to a service-account JSON key
EMAIL                      Vendor-account email
TEAM_ID                    Apple team ID; GitLab team slug
APP_ID                     Apple App Store Connect app ID; Play package name
APP_SPECIFIC_PASSWORD      Apple-specific password
ACCESS_KEY_ID              AWS-style access key
SECRET_ACCESS_KEY          AWS-style secret access key
REGION                     Vendor region (AWS, GCP)
```

### `<QUALIFIER>` — optional, only when disambiguating

Only when 2+ keys share the same `<BRAND>_<VENDOR>_<RESOURCE>`:

```
WORKSPACE_SLACK_WEBHOOK_URL_DEPLOYS         (deploys channel)
WORKSPACE_SLACK_WEBHOOK_URL_DRIFT           (drift channel)
WORKSPACE_SLACK_WEBHOOK_URL_OBSERVABILITY   (observability channel)
WORKSPACE_SLACK_WEBHOOK_URL_TRIAGE          (triage channel)
WORKSPACE_PAGERDUTY_INTEGRATION_KEY_HIGH    (high-severity route)
WORKSPACE_PAGERDUTY_INTEGRATION_KEY_MEDIUM  (medium-severity route)
ACADEMORIX_APPLE_APP_ID_COACH               (Coach iOS app in ASC)
ACADEMORIX_APPLE_APP_ID_FAMILY              (Family iOS app in ASC)
```

Never invent a qualifier when only one key of that shape exists — noise.

## Rule 2 — Layer 2 keys carry `[<RUNTIME_PREFIX>_]<VENDOR>_<RESOURCE>[_<QUALIFIER>]`

Inside a `<deployable>/<env>` Doppler project:

- Brand is IMPLICIT (the Doppler project name IS the brand + deployable).
- Env is IMPLICIT (the Doppler config name IS the env).
- Runtime prefix is FIRST when the runtime demands one.

Examples:

```
figentra-identity-service/prd:
  SENTRY_DSN                                 (server runtime — no prefix)
  SUPABASE_SERVICE_ROLE_KEY                  (server-only key)
  DB_PASSWORD                                (server-runtime env)
  JWT_SIGNING_KEY                            (workspace-authored)

figentra-landing/prd:
  VITE_SENTRY_DSN                            (Vite → client bundle)
  VITE_API_BASE_URL                          (Vite → client bundle)

academorix-mobile/prd:
  EXPO_PUBLIC_SENTRY_DSN                     (Expo SDK 49+ → RN client bundle)
  EXPO_PUBLIC_API_BASE_URL                   (Expo → RN client bundle)
```

**Never add a brand prefix in Layer 2.** `FIGENTRA_SENTRY_DSN` inside
`figentra-identity-service/prd` is a finding — the brand is already the
project's identity.

## Rule 3 — Runtime prefix catalog (framework-mandated)

Framework runtime prefixes are EXTERNAL contracts. Prefix comes FIRST in the key
stem; the `<VENDOR>_<RESOURCE>` shape follows:

| Prefix          | Runtime + role                                        | Example                     |
| --------------- | ----------------------------------------------------- | --------------------------- |
| `VITE_*`        | Vite build → injects into client SPA bundle           | `VITE_SENTRY_DSN`           |
| `EXPO_PUBLIC_*` | Expo SDK 49+ → injects into RN bundle                 | `EXPO_PUBLIC_API_BASE_URL`  |
| `NEXT_PUBLIC_*` | Next.js build → injects into client bundle (reserved) | `NEXT_PUBLIC_SENTRY_DSN`    |
| `TF_VAR_*`      | Terraform auto-loads into `var.<name>`                | `TF_VAR_cloudflare_zone_id` |
| `AWS_*`         | AWS SDK expects bare `AWS_ACCESS_KEY_ID` etc.         | `AWS_ACCESS_KEY_ID`         |
| _(bare)_        | Server runtime, terraform via `var.*`, CI, workspace  | `SENTRY_DSN`                |

**`NODE_*` is reserved by Node** for runtime tuning (`NODE_ENV`,
`NODE_OPTIONS`). Never use `NODE_*` for app secrets — it collides with the
runtime's own env contract.

Runtime-prefixed keys still respect the layer rule:

- In Layer 1: `<BRAND>_<RUNTIME_PREFIX>_<VENDOR>_<RESOURCE>` — the brand prefix
  COMES FIRST because the runtime prefix only matters at build time (Layer 1
  doesn't build anything). Example: `FIGENTRA_VITE_SENTRY_DSN`
  (workspace-tooling copy of the landing SPA's Sentry DSN, cached for terraform
  to push to the per-deployable Doppler).
- In Layer 2: `<RUNTIME_PREFIX>_<VENDOR>_<RESOURCE>` — runtime prefix first, no
  brand.

## Rule 4 — Vendor catalog (canonical names — one spelling each)

| Canonical      | Aliases to reject                                   |
| -------------- | --------------------------------------------------- |
| `CLOUDFLARE`   | `CF`                                                |
| `SENTRY`       | —                                                   |
| `ONEUPTIME`    | `1UPTIME`, `OU`                                     |
| `DOPPLER`      | **`DOOPLER`** (typo — every occurrence renames)     |
| `AWS`          | `S3`, `IAM`, `KMS`, `DYNAMODB` (roll under `AWS_*`) |
| `GITLAB`       | `GL`                                                |
| `GITHUB`       | `GH`                                                |
| `SLACK`        | —                                                   |
| `PAGERDUTY`    | `PD`                                                |
| `BETTER_STACK` | `BS`, `BETTERSTACK` (canonical is underscored)      |
| `RESEND`       | —                                                   |
| `EXPO`         | `EAS` (EAS is a service under Expo — same vendor)   |
| `APPLE`        | `APPLE_ID`, `ASC`, `APP_STORE_CONNECT`              |
| `GOOGLE_PLAY`  | `PLAY`, `GPLAY`                                     |
| `GOOGLE_CLOUD` | `GCP`, `GCLOUD`                                     |
| `FIREBASE`     | —                                                   |
| `HEROUI`       | `HERO_UI`                                           |
| `UNIWIND`      | —                                                   |
| `TURBO`        | `TURBOREPO`, `VERCEL_TURBO`                         |
| `POSTGRES`     | `PG`, `POSTGRESQL`                                  |
| `REDIS`        | —                                                   |
| `VALKEY`       | —                                                   |
| `MEILISEARCH`  | `MEILI`                                             |
| `MAILPIT`      | —                                                   |
| `STRIPE`       | —                                                   |
| `PADDLE`       | —                                                   |
| `OPENAI`       | `OAI`                                               |
| `ANTHROPIC`    | —                                                   |

Adding a new vendor: (1) add here, (2) add to
[`scripts/_lib/env-naming.mjs`](../../scripts/_lib/env-naming.mjs)
`VENDOR_CANONICAL`, (3) reference in the commit message.

## Rule 5 — Per-deployable Doppler projects (Layer 2 locations)

Every deployable owns exactly one Doppler project. Env-scoping via config (`dev`
/ `stg` / `prd`). Doppler project names use the SHORT form (no `-service`
suffix) — the npm scope + Worker deployable name carries the suffix; Doppler
substrate keeps a shorter key stem.

| Deployable                       | Doppler project          | Configs         | Serves                                         |
| -------------------------------- | ------------------------ | --------------- | ---------------------------------------------- |
| `figentra-identity-service`      | `figentra-identity`      | dev / stg / prd | 1 Cloudflare Worker (identity plane)           |
| `figentra-commerce-service`      | `figentra-commerce`      | dev / stg / prd | 1 Cloudflare Worker (commerce plane)           |
| `figentra-notifications-service` | `figentra-notifications` | dev / stg / prd | 1 Cloudflare Worker (notifications plane)      |
| `figentra-observability-service` | `figentra-observability` | dev / stg / prd | 1 Cloudflare Worker (observability plane)      |
| `figentra-platform-service`      | `figentra-platform`      | dev / stg / prd | 1 Cloudflare Worker (platform plane)           |
| `academorix-api`                 | `academorix-api`         | dev / stg / prd | 1 Cloudflare Worker (per-Application backend)  |
| `academorix-ai`                  | `academorix-ai`          | dev / stg / prd | 1 FastAPI + LangGraph service                  |
| `figentra-landing`               | `figentra-landing`       | dev / stg / prd | 1 Vite static site (figentra.com)              |
| `academorix-dashboard`           | `academorix-dashboard`   | dev / stg / prd | 1 Vite static site (dashboard.academorix.com)  |
| `academorix-landing`             | `academorix-landing`     | dev / stg / prd | 1 Next.js static site (academorix.com)         |
| `academorix-coach`               | `academorix-coach`       | dev / stg / prd | 1 RN/Expo flavor (coaches + admins + staff)    |
| `academorix-family`              | `academorix-family`      | dev / stg / prd | 1 RN/Expo flavor (parents + athletes)          |
| _(workspace tooling)_            | `figentra-workspace`     | dev             | terraform + CI + scripts — Layer 1 rules apply |

Adding a new deployable adds a new row here + a new Doppler project. Never share
a Doppler project across deployables; never share a config across envs.

The mobile split (`academorix-coach` + `academorix-family`) is TWO Doppler
projects that both build from the ONE `academorix/mobile` GitLab repo — see Rule
6b's terraform-managed CI pipe for the dual-flavor GitLab env-scope discipline.

## Rule 6 — Process-boundary remap (Doppler-canonical → vendor-standard)

Downstream tools (terraform, curl, aws CLI, sentry-cli, Vite build, Expo build)
expect specific env var names they can't reconfigure. The workspace's
Doppler-canonical Layer 1 names remap at the process boundary via a two-step
pipeline: **`doppler run` fetches, `scripts/remap-secrets.sh` translates**.

### The pipeline

```bash
doppler run --scope <workspace-path> -- \
  ./scripts/remap-secrets.sh <command> [args...]
```

- **`doppler run`** — Doppler CLI's native subprocess wrapper. Reads the
  workstation-scope binding from `~/.doppler/`, fetches every Layer 1 canonical
  secret from `figentra-workspace/dev`, injects them as env vars into the child
  process. Zero shell-sourcing, zero mirror files, zero `set -e` traps.
- **`scripts/remap-secrets.sh`** — pure translation layer. Reads the Layer 1
  canonical vars from env (already injected by `doppler run`), re-exports them
  under vendor-standard names + `TF_VAR_*` bindings, then `exec "$@"` to hand
  off to the target command.

Consumer usage:

- **Workspace Makefile** — every terraform target composes the pipeline via the
  `WITH_SECRETS` variable defined in `terraform/terraform.mk`:
  ```makefile
  WITH_SECRETS := doppler run --scope $(CURDIR) --no-check-version -- ./scripts/remap-secrets.sh
  TF := $(WITH_SECRETS) terraform -chdir=terraform/envs/$(ENV)
  ```
- **CI runners** — Doppler service token via `$DOPPLER_TOKEN` env var; same
  `doppler run -- ./scripts/remap-secrets.sh <command>` shape.
- **Ad-hoc shell** — `doppler run --scope . -- ./scripts/remap-secrets.sh bash`
  drops into an interactive shell with every alias exported.
- **Cloudflare Worker per-service** — the `cloudflare-worker` terraform module
  reads Layer 1 vars via `TF_VAR_*` bindings + provisions the Layer 2 Doppler
  secrets under vendor-standard names (never a brand prefix inside a Worker's
  env).

### Rules

- **Single remap file for the workspace.** Adding a new alias adds ONE
  `export FOO="${LAYER1_KEY:-}"` line to `scripts/remap-secrets.sh`. Scattered
  remap logic across N scripts is a review-blocking finding.
- **`remap-secrets.sh` is pure transformation.** No fetching, no network I/O, no
  doppler-CLI invocation inside. It expects the Layer 1 vars to already be in
  env (from `doppler run` upstream).
- **No `.env` files at repo roots + no `secrets.txt` mirror.** Every secret
  flows through Doppler on demand.

### Bootstrap (one-time per workstation)

```bash
# 1. Install doppler CLI
brew install dopplerhq/cli/doppler

# 2. Auth — pick one:
#    (a) Interactive OAuth  (creates a Personal Access Token in ~/.doppler/)
doppler login
#    (b) Or paste a workspace-scoped service/personal token directly:
doppler configure set token dp.pt.XXX \
  --scope /Users/<you>/Projects/figentra-workspace

# 3. Bind project + config to the workspace directory
doppler setup --project figentra-workspace --config dev \
  --no-interactive \
  --scope /Users/<you>/Projects/figentra-workspace

# 4. Verify — every subsequent `doppler run` from within the workspace
#    dir auto-uses the binding:
make doctor
```

Retired pattern (pre-2026-08-09): `.tmp/secrets/secrets.txt` local mirror +
`scripts/secrets-from-doppler.sh` conflated fetching + remap into one script
that swallowed errors via `>/dev/null 2>&1` and produced silent env-var drops.
Deleted.

## Rule 6b — GitLab CI runners run `doppler run` too — via terraform-managed Doppler service tokens

CI runners consume Layer 1 + Layer 2 Doppler secrets identically to workstations
— same `doppler run -- <cmd>` shape, same `remap-secrets.sh` translation layer.
What differs is the SUBSTRATE that seeds `$DOPPLER_TOKEN` in the runner's
environment:

- **Workstation** — `~/.doppler/` binding (from `doppler login` OR
  `doppler configure set token --scope <workspace-path>`).
- **CI runner** — GitLab CI variable `DOPPLER_TOKEN`, env-scoped to
  `development` / `staging` / `production` (or `production_coach` /
  `production_family` for the dual-flavor mobile repo).

Every GitLab CI variable that provisions this pipe is **terraform-managed** from
`terraform/envs/gitlab-ci-secrets/`. Zero click-ops. Zero Doppler-UI-configured
sync integrations.

### The three CI variables per (repo, env)

| Var name          | Value                             | Masked | Notes                             |
| ----------------- | --------------------------------- | :----: | --------------------------------- |
| `DOPPLER_TOKEN`   | Doppler service token (read-only) |  yes   | Distinct token per Doppler config |
| `DOPPLER_PROJECT` | e.g. `figentra-identity`          |   no   | Layer 2 project name              |
| `DOPPLER_CONFIG`  | one of `dev` / `stg` / `prd`      |   no   | Layer 2 config name               |

### GitLab env-scope → Doppler config alignment

```
Doppler config    GitLab env name    protected    Consumer
─────────────    ────────────────    ─────────    ────────
dev              development         false        feature branch MRs
stg              staging             true         staging branch pipelines
prd              production          true         main branch pipelines
```

Dual-flavor mobile (`academorix-mobile` GitLab repo → `academorix-coach`

- `academorix-family` Doppler projects):

```
Doppler project     Doppler config    GitLab env name       protected
─────────────       ────────────────  ────────────────      ─────────
academorix-coach    dev               development_coach     false
academorix-coach    stg               staging_coach         true
academorix-coach    prd               production_coach      true
academorix-family   dev               development_family    false
academorix-family   stg               staging_family        true
academorix-family   prd               production_family     true
```

### Consumer `.gitlab-ci.yml` shape

```yaml
image: ubuntu:22.04

before_script:
  - apt-get update -qq && apt-get install -qq -y curl gnupg
  - curl -Ls --tlsv1.2 --proto "=https" --retry 3 \
    https://cli.doppler.com/install.sh | sh

build:
  stage: build
  environment: production # or development / staging per branch
  script:
    - doppler run -- ./scripts/remap-secrets.sh pnpm build

test:
  stage: test
  environment: development
  script:
    - doppler run -- ./scripts/remap-secrets.sh pnpm test
```

`environment: <name>` matches the GitLab env; GitLab auto-injects the scoped
`DOPPLER_TOKEN` + `DOPPLER_PROJECT` + `DOPPLER_CONFIG`; every subsequent command
runs under `doppler run` with the correct config loaded.

### Why not Doppler's UI-configured GitLab sync?

Doppler's Terraform provider (v1.16 as of 2026-08-09) does NOT ship a
`doppler_secrets_sync_gitlab` resource — only GitHub Actions / AWS SM / GCP SM /
Azure Vault / Terraform Cloud sync destinations. Attempting to drive Doppler's
GitLab-sync integration via the MCP/UI hit env-scope dedupe bugs — the API
dedupes syncs by (integration, gitlab_project) at `*` env-scope regardless of
the `env_scope` field in the request payload; 3 configs (dev/stg/prd) all push
to one `*` scope, later writes silently overwrite earlier. The
`terraform/envs/gitlab-ci-secrets/` root bypasses that integration entirely.

The Doppler-side GitLab-sync integrations were DELETED post-migration (both
`figentra-inc-gitlab-sync` in the Figentra workplace + the
`academorix-gitlab-sync` in the Academorix workplace — 2026-08-09).

### Rotation flow

**Rotate Doppler secret values** — no terraform work. Update the value in
Doppler; the next CI run's `doppler run` picks up the new value.

**Rotate the Doppler service token itself** — annual security cycle:

```bash
terraform -chdir=terraform/envs/gitlab-ci-secrets \
  taint 'module.figentra_identity_gitlab_pipe.doppler_service_token.envs["prd"]'
make apply ENV=gitlab-ci-secrets
```

Taint marks the token for destroy+recreate; apply creates a fresh token

- updates the GitLab CI var value in one plan.

## Rule 7 — Framework runtime code reads via Doppler-canonical names too

Inside a Worker, `env.SENTRY_DSN` reads the value Wrangler injected from
Layer 2. Inside `src/main.tsx` for a Vite SPA, `import.meta.env.VITE_SENTRY_DSN`
reads the value Vite built into the bundle from Layer 2.

Neither reads a Layer 1 key directly. The remap layer (Rule 6) is the sole
bridge; framework code stays clean.

## Rule 8b — Layer 2 minimalism (per-deployable Doppler)

> **ADR anchor.** Codified by ADR-0085 §D7. Extends this doc's §Rule 2 with the
> concrete envelope every per-deployable Doppler config follows.

Per-deployable Doppler configs carry ONLY runtime-essential values. The
workspace-tooling project (`figentra-workspace/dev`) is the "everything" bucket
where the operator types values once; every per-deployable project is
terraform-provisioned from those Layer 1 values.

### Concrete envelopes

**A Worker service** (`figentra-<slug>-service/<env>`, `academorix-api/<env>`) —
12 to 20 keys:

```
APP_ENV                    (production | staging | development)
APP_URL                    (public URL — from workspace.yaml TLD map)
SUPABASE_URL               (project URL — terraform-provisioned)
SUPABASE_ANON_KEY          (public anon key)
SUPABASE_SERVICE_ROLE_KEY  (server-only key — never in a client bundle)
DB_URL                     (Postgres connection string — Supabase-provisioned)
JWT_SIGNING_KEY            (workspace-authored HS256; shared across services in same env)
SENTRY_DSN                 (terraform-provisioned Sentry project DSN)
IDENTITY_BASE_URL          (self, when applicable)
COMMERCE_BASE_URL          (peer — from workspace.yaml)
NOTIFICATIONS_BASE_URL     (peer — from workspace.yaml)
OBSERVABILITY_BASE_URL     (peer — from workspace.yaml)
PLATFORM_BASE_URL          (peer — from workspace.yaml)
```

**A Vite SPA** (`figentra-landing/<env>`, `academorix-dashboard/<env>`,
`academorix-landing/<env>`) — 5 to 10 keys:

```
VITE_APP_ENV               (production | staging | development)
VITE_APP_URL               (self URL)
VITE_API_BASE_URL          (peer API URL — when the SPA has an API)
VITE_<PEER>_BASE_URL       (one line per additional peer service)
VITE_SENTRY_DSN                 (browser-scoped DSN, per project)
VITE_SENTRY_ENVIRONMENT         (same as VITE_APP_ENV)
VITE_CLOUDFLARE_ANALYTICS_TOKEN (Web Analytics beacon token)
```

**A React Native app** (`academorix-mobile/<env>`) — 5 to 8 keys:

```
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_<PEER>_BASE_URL   (one per peer)
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_SENTRY_ENVIRONMENT
```

### What Layer 2 NEVER carries

- Third-party vendor admin tokens (Cloudflare, GitLab, GitHub, Slack, PagerDuty,
  Better Stack). Live in Layer 1 for terraform to read at provision time;
  runtime code never sees them.
- Provisioning credentials (AWS state backend, Doppler service tokens).
- Cross-brand shared vendor tokens (OneUptime API key — used only by terraform +
  observability side channels, not by the deployable's app code).

### Terraform provisioning contract

Adding a new deployable = one terraform apply. Each `cloudflare-worker` +
`cloudflare-pages` module invocation does the whole cycle:

1. Read Layer 1 values via `var.*` bindings pre-loaded from Doppler.
2. Provision every Layer 2 Doppler secret via `doppler_secret` resources.
3. Bind the Worker/Pages env-var map to the Doppler config (the runtime pulls
   Layer 2 in automatically).

Zero manual "paste this DSN into the Cloud dashboard" steps.

## Rule 8c — TLD portfolio (locked)

> **ADR anchor.** Codified by ADR-0085 §D8. Amended 2026-08-08 — `figentra.app`
> deferred; portfolio narrows from 4 to 3 figentra TLDs. Adding a new TLD
> requires a further ADR amendment.

The workspace hosts three brands across a fixed TLD portfolio. Each brand owns
the TLDs its concerns need; framework code owns zero TLDs.

**Figentra** (corporate operator) — 3 TLDs, one per concern:

| TLD              | Concern               | Zone content                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `figentra.com`   | Marketing + corporate | `figentra-landing` SPA, `status.figentra.com`, corporate email boilerplate. Reserves `app.figentra.com` for a future consolidated product portal.                                                                                                                                                                   |
| `figentra.cloud` | API + infra           | Every SHARED service subdomain — `identity.figentra.cloud`, `commerce.figentra.cloud`, `notifications.figentra.cloud`, `observability.figentra.cloud`, `platform.figentra.cloud`, `docs.figentra.cloud`. Reserves `ops.figentra.cloud`, `partner.figentra.cloud`, `console.figentra.cloud` for future ops surfaces. |
| `figentra.email` | Email sending         | Transactional (`noreply.figentra.email`), newsletter (`news.figentra.email`). DKIM + SPF + DMARC records terraform-managed via the `resend-domain` module.                                                                                                                                                          |

**Deferred: `figentra.app`.** The 2026-08-04 draft named a 4-TLD figentra
portfolio; on 2026-08-08 review, zero current or near-term deployables map to
`.app`. Every original `.app` concern folds under an existing subdomain:

| Original `.app` concern      | Subdomain fallback       |
| ---------------------------- | ------------------------ |
| Consolidated product portal  | `app.figentra.com`       |
| Ops dashboard                | `ops.figentra.cloud`     |
| Partner portal               | `partner.figentra.cloud` |
| Console (staff-only surface) | `console.figentra.cloud` |

Buying `figentra.app` becomes a further ADR amendment when a deployable
genuinely justifies a fresh TLD. Reviewers reject subdomain proposals that don't
reason from this fallback map first.

**Academorix** (product) — 1 TLD; every product surface lives on subdomains:

| TLD              | Concern    | Zone content                                                                                                                                                                                |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `academorix.com` | Everything | Marketing (`academorix.com`), dashboard (`dashboard.academorix.com`), API (`api.academorix.com`), AI (`ai.academorix.com`), status (`status.academorix.com`), transactional email subdomain |

**Stackra** (framework) — zero TLDs; publishes as `@stackra/*` (npm). No
user-facing surface, no DNS.

### Cloudflare account split

Two accounts under one login (post 2026-08-04):

- **Figentra CF account** — hosts `figentra.com`, `figentra.cloud`,
  `figentra.email`. Secrets: `FIGENTRA_CLOUDFLARE_*`.
- **Academorix CF account** — hosts `academorix.com`. Secrets:
  `ACADEMORIX_CLOUDFLARE_*`.

Every terraform module targeting a zone binds to the matching account via
provider alias (`cloudflare.figentra` vs `cloudflare.academorix`).

### Cross-service URLs are `workspace.yaml`-driven

Zero hardcoded URLs in service code, terraform modules, or SPA env vars. Every
URL flows through:

1. `workspace.yaml` `cross_service_urls.<env>.<peer>` map (source of truth).
2. Terraform reads → writes to the deployable's Layer 2 Doppler config.
3. The Worker/Pages env-var binding pushes to the runtime.
4. Runtime code reads via `env.<PEER>_BASE_URL` (Worker) /
   `import.meta.env.VITE_<PEER>_BASE_URL` (Vite) /
   `process.env.EXPO_PUBLIC_<PEER>_BASE_URL` (Expo).

Adding a new subdomain = editing `workspace.yaml` + terraform apply. Zero code
changes.

## Rule 8 — `.env.example` files ship the canonical shape, no values

Every repo's `.env.example` (or `.env.docker.example`) lists the env vars the
code reads WITHOUT the values. Layer indicator in a leading comment:

```
# Layer 2 — figentra-identity-service/<env> Doppler project
# Runtime: Worker server; no runtime prefix
# Doppler-canonical: same (no brand prefix inside Layer 2)

SENTRY_DSN=
SUPABASE_SERVICE_ROLE_KEY=
DB_PASSWORD=
JWT_SIGNING_KEY=
```

`.env.example` NEVER carries a real value. Real values live in Doppler.

## Anti-patterns

| Anti-pattern                                                          | Correct                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN` in Layer 1 (bare, no brand)                    | `FIGENTRA_CLOUDFLARE_API_TOKEN` (+ `ACADEMORIX_CLOUDFLARE_API_TOKEN` per split) |
| `SHARED_AWS_ACCESS_KEY_ID` in Layer 1                                 | `WORKSPACE_AWS_ACCESS_KEY_ID` per Rule 1                                        |
| `FIGENTRA_DOOPLER_TOKEN` (typo)                                       | `FIGENTRA_DOPPLER_TOKEN`                                                        |
| `GCP_BILLING_ID`                                                      | `WORKSPACE_GOOGLE_CLOUD_BILLING_ID`                                             |
| `PLAY_SERVICE_ACCOUNT_JSON_PATH`                                      | `ACADEMORIX_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH`                              |
| `SENTRY_AUTH_TOKEN` in Layer 1 (no brand — implicit "figentra")       | `FIGENTRA_SENTRY_AUTH_TOKEN`                                                    |
| `FIGENTRA_SENTRY_DSN` inside `figentra-identity-service`              | `SENTRY_DSN` (brand implicit in Layer 2 project name)                           |
| `SENTRY_AUTH_TOKEN_PRD` (env in the key)                              | `SENTRY_AUTH_TOKEN` in `<project>/prd` config (env in Doppler)                  |
| `VITE_FIGENTRA_SENTRY_DSN` in Layer 2                                 | `VITE_SENTRY_DSN` in `figentra-landing/*` config                                |
| `NODE_JWT_SIGNING_KEY`                                                | `JWT_SIGNING_KEY` (`NODE_*` prefix collides with the runtime env contract)      |
| Any `TURBOREPO_*`, `BS_*`, `PD_*`, `GCP_*`, `PLAY_*`, etc.            | Use the canonical vendor name from §Rule 4                                      |
| Multiple `.env.docker.example` shapes across repos                    | Every `.env.example` follows Rule 8 shape                                       |
| Remap logic inline in `docker-compose.yml`                            | Remap goes through `doppler run -- ./scripts/remap-secrets.sh` per Rule 6       |
| Reintroducing `.tmp/secrets/secrets.txt` OR `secrets-from-doppler.sh` | Retired 2026-08-09. `doppler run` fetches; `remap-secrets.sh` translates.       |

## Enforcement

Three lanes, in order of frequency:

### Author-time (writers)

Every writer that touches env vars runs the audit script BEFORE staging:

```
npx node scripts/audit-env-naming.mjs
```

Reports every violation. Fixer script applies the canonical rename:

```
npx node scripts/rename-env-vars.mjs --yes
```

### Session-time (agents)

The `env-naming-steward` sub-agent walks every repo under `~/dev/*` + this
workspace and reports violations across `.env.example`, `docker-compose.yml`,
`terraform/**`, `wrangler.toml`, `.gitlab-ci.yml`, README `.env` samples, JSDoc
`@example` blocks, and JS/TS `process.env.*` / `import.meta.env.*` /
`Env.get('*')` call sites.

Invoke:

```
invoke_sub_agent(name: "env-naming-steward",
                 prompt: "Audit env-var naming across every workspace repo")
```

### CI-time (merge gate)

Every repo's `.gitlab-ci.yml` ships `.ci/env-naming-check.sh` — a grep-based
verifier that exits non-zero on any legacy shape. Rollout via
`scripts/rollout-agents-md.mjs`-shaped script (post Wave 4 of the migration).

### Grep patterns (zero-hit on a compliant repo)

Rules 1–8 boil down to these greps. Every hit is a violation:

```sh
# Layer 1 — bare vendor names (missing brand prefix). Runs against
# Doppler figentra-workspace/dev catalog + terraform/**.
doppler secrets --scope . --only-names 2>/dev/null | \
  grep -E '^(CLOUDFLARE|SENTRY|BETTER_STACK|PAGERDUTY|SLACK|GITLAB|GITHUB|EXPO|APPLE|GOOGLE_PLAY|GOOGLE_CLOUD|FIREBASE|ONEUPTIME|DOPPLER|RESEND|HEROUI|UNIWIND|TURBO|OPENAI|ANTHROPIC)_'
grep -rEn '^(CLOUDFLARE|SENTRY|BETTER_STACK|PAGERDUTY|SLACK|GITLAB|GITHUB|EXPO|APPLE|GOOGLE_PLAY|GOOGLE_CLOUD|FIREBASE|ONEUPTIME|DOPPLER|RESEND|HEROUI|UNIWIND|TURBO|OPENAI|ANTHROPIC)_' \
  terraform/ 2>/dev/null

# Layer 2 — brand prefix leak (redundant with Doppler-project name).
grep -rEn '^(FIGENTRA|ACADEMORIX|STACKRA|WORKSPACE)_' \
  services/*/.env.example apps/*/.env.example 2>/dev/null

# Rejected vendor aliases (BS_, PD_, GCP_, PLAY_, DOOPLER, GL_, PG_, CF_).
grep -rEn '\b(BS|PD|GCP|PLAY|GL|GH|CF|OU|PG|MEILI|EAS|ASC|APP_STORE_CONNECT|APPLE_ID|GPLAY|GCLOUD|TURBOREPO|VERCEL_TURBO|BETTERSTACK|HERO_UI|POSTGRESQL|OAI|DOOPLER)_' \
  terraform/ services/ apps/ 2>/dev/null

# Env in the key stem (should be Doppler config, not key suffix).
grep -rEn '_(DEV|STG|PRD|PROD|STAGING|DEVELOPMENT|PRODUCTION)$' \
  terraform/ services/*/.env.example apps/*/.env.example 2>/dev/null

# NODE_* used for app secrets.
grep -rEn '^NODE_(?!ENV|OPTIONS|PATH|NO_WARNINGS)' \
  services/ apps/ 2>/dev/null
```

## Cross-references

- [ADR-0085](../../.docs/adr/0085-workspace-env-var-naming.md) — the decision
  record + migration plan.
- [`.kiro/steering/brand-hierarchy.md`](brand-hierarchy.md) — the three-brand
  model this doc's `<BRAND>` slot operationalizes.
- [`.kiro/steering/package-naming.md`](package-naming.md) — sibling naming
  convention for npm vendor scopes.
- [`.kiro/steering/doppler.md`](doppler.md) — Doppler-per-deployable rule
  - the `figentra-workspace/dev` shared project.
- [`.kiro/agents/env-naming-steward.md`](../agents/env-naming-steward.md) —
  cross-repo read-only auditor.
- [`scripts/_lib/env-naming.mjs`](../../scripts/_lib/env-naming.mjs) — the
  machine-readable canonical map every downstream script imports.
- [`scripts/audit-env-naming.mjs`](../../scripts/audit-env-naming.mjs) — the
  cross-repo audit runner (Wave 3 of the ADR).
- [`scripts/rename-env-vars.mjs`](../../scripts/rename-env-vars.mjs) — the
  mechanical fixer (Wave 4).
- [`scripts/remap-secrets.sh`](../../scripts/remap-secrets.sh) — the Layer 1
  process-boundary remap (pure transformation; expects `doppler run` upstream to
  inject Layer 1 canonical vars).
