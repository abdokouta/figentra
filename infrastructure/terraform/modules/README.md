# Terraform modules

Resource-type modules (spec 15 §7), each driven by a pre-filtered, slug-keyed
map from [`../locals.tf`](../locals.tf) via `for_each`. Composed in
[`../deploy.tf`](../deploy.tf).

## The Terraform / Wrangler boundary (spec 15 §4)

**Terraform owns durable infrastructure.** **Wrangler owns deploy artifacts.**
Never let both manage the same artifact.

| Concern                                    | Owner         | Where                           |
| ------------------------------------------ | ------------- | ------------------------------- |
| D1 / KV / Queues / R2 (bindable resources) | **Terraform** | `cloudflare/{d1,kv,queue,r2}`   |
| Zone lookup                                | **Terraform** | `cloudflare/dns`                |
| FQDN → Worker service (custom domain)      | **Terraform** | `cloudflare/{worker,container}` |
| Supabase project (per env)                 | **Terraform** | `supabase`                      |
| Uptime monitors                            | **Terraform** | `betterstack`                   |
| Worker **script** + its bindings           | **Wrangler**  | `infrastructure/wrangler/*`     |
| Container **image** build/push + rollout   | **Wrangler**  | `infrastructure/docker/*` + CI  |

The Wrangler side reads Terraform's `outputs.tf` (resource ids) to render each
`wrangler.jsonc` binding. Custom domains require the Worker service to exist
first — the app (Wrangler) pipeline deploys the script, then the infra
(Terraform) pipeline attaches the custom domain.

## Modules

| Module                 | Provisions                                           | for_each source                  |
| ---------------------- | ---------------------------------------------------- | -------------------------------- |
| `cloudflare/dns`       | `data cloudflare_zone` (exports `zone_id`)           | —                                |
| `cloudflare/d1`        | `cloudflare_d1_database`                             | `local.needs_d1`                 |
| `cloudflare/kv`        | `cloudflare_workers_kv_namespace`                    | `local.needs_kv`                 |
| `cloudflare/queue`     | `cloudflare_queue`                                   | `local.needs_queue`              |
| `cloudflare/r2`        | `cloudflare_r2_bucket`                               | `local.needs_r2`                 |
| `cloudflare/worker`    | `cloudflare_workers_custom_domain`                   | `local.workers` + `local.assets` |
| `cloudflare/container` | `cloudflare_workers_custom_domain` (fronting worker) | `local.containers`               |
| `supabase`             | `supabase_project` (one per env, gated on org id)    | —                                |
| `betterstack`          | `betteruptime_monitor` (gated on token)              | `local.uptime_monitored`         |

## Before `terraform init` / `plan` (spec 15 §5)

Every module carries a "VERIFY args against the pinned provider" note. Confirm
each resource's argument schema against the pinned versions
([`../versions.tf`](../versions.tf): cloudflare `~> 5.20`, supabase `~> 1.0`,
better-uptime `~> 0.20`) with `terraform providers schema -json` — the v5
Cloudflare provider and the v0.x Better Stack provider both shift argument names
between minor releases. This scaffold encodes the correct structure + resource
selection; the schema verification is the documented pre-init step.

## Not modelled here

- **Supabase Auth** (spec 15 §5) — beta; Figentra must not depend on it.
  Provider stays commented in `../versions.tf`; identity is authored at runtime.
- **AWS** — escape hatch only (spec 15 §2.3); the S3 state backend needs no
  provider block.
