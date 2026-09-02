# =============================================================================
# deploy.tf — root composition
# =============================================================================
#
# Each module receives a pre-filtered, slug-keyed map from locals.tf and runs
# its own `for_each` internally (the reference pattern). Adding a deployable =
# ship its cloud.yaml -> `pnpm run catalog` regenerates catalog.json -> it flows
# into the right map here automatically. No edits to this file per deployable.
#
# Multi-brand: the zone-bound modules (dns, worker, container) are instantiated
# PER BRAND (for_each over local.brand_tlds), so each brand's deployables bind
# to their own Cloudflare zone (figentra.com vs academorix.com) + account. The
# binding modules (d1/kv/queue/r2) stay figentra-account-scoped — no non-figentra
# deployable declares Cloudflare bindings yet; extend them per-brand when one does.
#
# Terraform/Wrangler boundary (spec 15 §4): the modules below provision durable
# infra only — bindable resources (D1/KV/Queues/R2), zones, custom-domain
# routing, Supabase, monitors, EAS projects, and Firebase/GCP projects. Worker
# SCRIPTS + Container IMAGES + mobile BINARIES are deployed by Wrangler / EAS,
# consuming the ids from outputs.tf.
# =============================================================================

# --- Zone lookup, per brand (custom domains manage their own records) --------
module "dns" {
  source    = "./modules/cloudflare/dns"
  for_each  = local.brand_tlds # brand -> tld
  zone_name = each.value
}

# --- Bindable Cloudflare resources (figentra account today) ------------------
module "d1" {
  source      = "./modules/cloudflare/d1"
  deployables = local.needs_d1
  account_id  = var.cloudflare_account_id
  env         = local.env
}

module "kv" {
  source      = "./modules/cloudflare/kv"
  deployables = local.needs_kv
  account_id  = var.cloudflare_account_id
  env         = local.env
}

module "queue" {
  source      = "./modules/cloudflare/queue"
  deployables = local.needs_queue
  account_id  = var.cloudflare_account_id
  env         = local.env
}

module "r2" {
  source      = "./modules/cloudflare/r2"
  deployables = local.needs_r2
  account_id  = var.cloudflare_account_id
  env         = local.env
}

# --- Durable routing per brand: FQDN -> Worker service (custom domains) ------
# One module instance per brand: its deployables bind to that brand's zone +
# Cloudflare account. figentra: application-registry/portal/landing;
# academorix: academorix-landing.
module "worker" {
  source      = "./modules/cloudflare/worker"
  for_each    = local.brand_tlds
  deployables = { for k, d in merge(local.workers, local.assets) : k => d if d.brand == each.key }
  account_id  = local.brand_account_ids[each.key]
  zone_id     = module.dns[each.key].zone_id
  fqdns       = local.fqdns
}

module "container" {
  source      = "./modules/cloudflare/container"
  for_each    = local.brand_tlds
  deployables = { for k, d in local.containers : k => d if d.brand == each.key }
  account_id  = local.brand_account_ids[each.key]
  zone_id     = module.dns[each.key].zone_id
  fqdns       = local.fqdns
}

# --- Per-env Supabase project (gated on organization_id) ---------------------
module "supabase" {
  source            = "./modules/supabase"
  organization_id   = var.supabase_organization_id
  database_password = var.supabase_db_password
  env               = local.env
}

# --- Uptime monitors (gated on the Better Stack token being present) ---------
module "betterstack" {
  source      = "./modules/betterstack"
  enabled     = var.better_stack_api_token != ""
  deployables = local.uptime_monitored
  fqdns       = local.fqdns
}

# --- Mobile: EAS project + EAS Update channels (expo-mobile deployables) -----
module "expo" {
  source      = "./modules/expo"
  deployables = local.mobile
}

# --- Mobile: Firebase/GCP project + FCM (needs_firebase deployables) ---------
module "firebase" {
  source              = "./modules/firebase"
  deployables         = local.needs_firebase
  env                 = local.env
  gcp_org_id          = var.gcp_org_id
  gcp_billing_account = var.gcp_billing_account
  providers = {
    google      = google
    google-beta = google-beta
  }
}

# --- Infrastructure Orchestrator durable state -------------------------------
# The Worker owns the HTTP/control-plane behavior; Terraform owns the durable
# D1 job state and Workflow definition. The actual Terraform execution occurs
# only inside the isolated runner declared by the orchestrator specification.
module "orchestrator" {
  source            = "./modules/cloudflare/orchestrator"
  account_id        = var.cloudflare_account_id
  database_name     = "figentra-infrastructure-orchestrator-${local.env}"
  workflow_name     = "figentra-infrastructure-orchestrator-${local.env}"
  workflow_class_name = "TerraformExecutionWorkflow"
  worker_script_name  = "figentra-infrastructure-orchestrator-${local.env}"
}

# --- NATS JetStream ----------------------------------------------------------
# The NATS cluster/control plane is provisioned outside this Terraform root by
# the selected NATS provider. Once an authenticated endpoint exists, this
# module owns the durable Figentra event stream and keeps it reproducible.
module "nats_jetstream" {
  source       = "./modules/nats/jetstream"
  enabled      = var.nats_servers != "" && var.nats_credentials != ""
  servers      = var.nats_servers
  credentials  = var.nats_credentials
  ca_file_data = var.nats_ca_file_data
}

# --- Cloudflare Worker Rate Limiting namespaces ------------------------------
# The namespace IDs are stable Terraform-managed integers consumed by the
# Gateway/Registry Wrangler bindings. They are separate from the public WAF
# rate-limit rules managed by the security module.
module "worker_rate_limit" {
  for_each = {
    application_registry = "application-registry"
  }

  source      = "./modules/cloudflare/worker-rate-limit"
  name        = "${each.value}-${local.env}"
  namespace_id = null
}

# --- Public Cloudflare WAF/rate limiting ------------------------------------
# This is defense-in-depth. IAM authorization remains application-owned.
module "cloudflare_security" {
  for_each = local.brand_tlds

  source   = "./modules/cloudflare/security"
  zone_id  = module.dns[each.key].zone_id
  name     = "figentra-${each.key}-api-security-${local.env}"
}
