# =============================================================================
# Terraform locals — decode the deployment catalog into per-runtime maps
# =============================================================================
#
# The consume half of the pipeline documented in the root cloud.yaml:
#
#     cloud.yaml + {apps,workers,services}/*/cloud.yaml + repos:
#         --(scripts/collect-cloud-yaml.mjs)--> catalog.json
#         --(this file)--> per-runtime for_each maps --> modules (deploy.tf)
#
# `products` come straight from the workspace cloud.yaml; `deployables` come
# from the generated infrastructure/catalog.json. Each module in deploy.tf (task 5) consumes
# one pre-filtered, slug-keyed map from here.
# =============================================================================

# --- Environment (derived from the selected workspace, spec 15 §6) -----------
check "valid_workspace" {
  assert {
    condition     = contains(["development", "staging", "production"], terraform.workspace)
    error_message = "Select an environment first: terraform workspace select development|staging|production."
  }
}

# --- Catalog present? (the collector must run before plan) -------------------
check "catalog_present" {
  assert {
    condition     = fileexists("${path.module}/../catalog.json")
    error_message = "catalog.json missing — run `pnpm run catalog` (infrastructure/scripts/collect-cloud-yaml.mjs) before terraform plan."
  }
}

locals {
  # `terraform.workspace` is the only environment selector. No fallback is
  # permitted because silently targeting another state is unsafe.
  env = terraform.workspace

  # Workspace catalog: brands/products (source of truth = repo-root cloud.yaml).
  cloud            = yamldecode(file("${path.module}/../../cloud.yaml"))
  products_by_slug = { for p in local.cloud.products : p.slug => p }

  # Merged deployable set (source of truth = generated infrastructure/catalog.json). Fall back
  # to an empty set so `terraform validate` works before the collector runs.
  # NOTE: the ? : operates on STRINGS (raw file content vs an empty-catalog JSON
  # literal), then jsondecode runs once on the result. Doing the conditional on
  # the DECODED objects instead trips Terraform's "Inconsistent conditional
  # result types" — the decoded catalog is a 9-element tuple while an empty
  # fallback is a 0-element tuple, and both arms of ? : must share a type.
  catalog     = jsondecode(fileexists("${path.module}/../catalog.json") ? file("${path.module}/../catalog.json") : "{\"products\":[],\"deployables\":[]}")
  deployables = try(local.catalog.deployables, [])

  # --- Brands in use -> per-brand zone + Cloudflare account -------------------
  # Each routable deployable's `brand` selects a product (-> tld) + a Cloudflare
  # account. The dns/worker/container modules are instantiated per brand in
  # deploy.tf. `brand_account_ids` is the explicit brand -> account-id var map.
  routable_brands = toset([for d in local.deployables : d.brand if contains(local.routable_runtimes, d.runtime)])
  brand_tlds      = { for b in local.routable_brands : b => local.products_by_slug[b].tld }
  brand_account_ids = {
    figentra   = var.cloudflare_account_id
    academorix = var.academorix_cloudflare_account_id
  }

  # --- Per-runtime maps (keyed by slug) — each module's for_each source -------
  workers    = { for d in local.deployables : d.slug => d if d.runtime == "cloudflare-worker" }
  containers = { for d in local.deployables : d.slug => d if d.runtime == "cloudflare-container" }
  assets     = { for d in local.deployables : d.slug => d if d.runtime == "cloudflare-assets" }

  # --- Cloudflare-binding filters (drive the d1/kv/queue modules) -------------
  needs_d1    = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_d1, false) }
  needs_kv    = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_kv, false) }
  needs_queue = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_queue, false) }
  needs_r2    = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_r2, false) }

  # Container-plane + observability filters.
  needs_supabase   = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_supabase, false) }
  uptime_monitored = { for d in local.deployables : d.slug => d if try(d.observability.betterstack.enable_uptime, false) }

  # --- Mobile (Expo/EAS) + Firebase filters -----------------------------------
  # Mobile deployables build via EAS and have NO Cloudflare host, so they are
  # absent from the workers/containers/assets/fqdns maps above. `modules/expo`
  # provisions the EAS app; `modules/firebase` provisions the GCP project + FCM
  # for every deployable that opts in via capabilities.needs_firebase.
  mobile         = { for d in local.deployables : d.slug => d if d.runtime == "expo-mobile" }
  needs_firebase = { for d in local.deployables : d.slug => d if try(d.capabilities.needs_firebase, false) }

  # --- FQDN per deployable ----------------------------------------------------
  # production: <subdomain>.<tld>
  # pre-production: <subdomain>.<env-prefix>.<tld>
  env_host_prefix = { development = "dev", staging = "staging", production = "" }

  # FQDNs apply only to Cloudflare-routable runtimes. Mobile (expo-mobile) has
  # no web host and declares no `subdomain`, so it is excluded here (referencing
  # a missing `subdomain` key would fault the whole map).
  routable_runtimes = ["cloudflare-worker", "cloudflare-container", "cloudflare-assets"]
  # Each deployable's `brand` selects its product -> tld (figentra.com vs
  # academorix.com), so a multi-brand catalog routes each app to its own zone.
  fqdns = {
    for d in local.deployables : d.slug => (
      local.env == "production"
      ? "${d.subdomain}.${local.products_by_slug[d.brand].tld}"
      : "${d.subdomain}.${local.env_host_prefix[local.env]}.${local.products_by_slug[d.brand].tld}"
    ) if contains(local.routable_runtimes, d.runtime)
  }

  # --- Cross-service base URLs (injected as each backend's peer env vars) ------
  # Every service can reach every other service by <PEER>_SERVICE_URL.
  service_urls = { for slug, fqdn in local.fqdns : slug => "https://${fqdn}" }
}
