# =============================================================================
# module: cloudflare-worker — Workers custom domains (durable routing; spec 15 §7)
# =============================================================================
#
# Binds each worker/asset deployable's FQDN to its Worker service via a
# Cloudflare Workers custom domain (which manages its own DNS record). Covers
# runtime `cloudflare-worker` (gateway, application-registry) + the
# `cloudflare-assets` portal (a Worker serving static assets).
#
# BOUNDARY (spec 15 §4): Terraform OWNS the durable hostname->service binding;
# Wrangler OWNS the worker SCRIPT + its resource bindings. wrangler.jsonc must
# therefore NOT also declare these routes/custom-domains (no fighting over one
# artifact). ORDERING: the Worker service must exist first — Wrangler deploys
# the script (app pipeline) before Terraform attaches the custom domain (infra
# pipeline). On a brand-new service, run the app pipeline once, then apply.
#
# Args account_id/zone_id/hostname/service confirmed against cloudflare ~> 5.20
# via `terraform validate` (the `environment` attribute is deprecated in v5 and
# is intentionally omitted).
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of worker + asset deployables (merge of locals.workers + locals.assets)."
  type        = any # merged worker+asset records have divergent shapes; see betterstack note
}

variable "account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone id (from the cloudflare-dns module)."
  type        = string
}

variable "fqdns" {
  description = "slug -> fully-qualified hostname (from locals.fqdns)."
  type        = map(string)
}

resource "cloudflare_workers_custom_domain" "this" {
  for_each = var.deployables

  account_id = var.account_id
  zone_id    = var.zone_id
  hostname   = var.fqdns[each.key]
  service    = each.value.cloudflare_name # Wrangler-deployed worker service name
}

output "custom_domains" {
  description = "slug -> bound hostname."
  value       = { for slug, cd in cloudflare_workers_custom_domain.this : slug => cd.hostname }
}
