# =============================================================================
# module: cloudflare-container — Container fronting-worker routing (spec 15 §7)
# =============================================================================
#
# Each container service (iam, tenant, monetization) is fronted by a Cloudflare
# Worker (spec 09 §5). This module binds the container's FQDN to that fronting
# Worker service via a custom domain — the same durable-routing mechanism as
# cloudflare-worker, kept as a separate module per spec 15 §7's logical
# boundary.
#
# BOUNDARY (spec 15 §4): Terraform OWNS the hostname->service binding + the
# durable resources the container needs (Supabase DB via the supabase module,
# Queues via cloudflare-queue). Wrangler OWNS the Container IMAGE build/push +
# rollout + the fronting Worker script. This module does NOT build or roll out
# the image. ORDERING: Wrangler deploys the fronting Worker first, then apply.
#
# NOTE: Cloudflare Containers are newer than Workers; if the pinned provider
# (~> 5.20) exposes first-class container resources (image/rollout), they still
# belong to Wrangler per §4 — do not add them here. The custom-domain args are
# confirmed against ~> 5.20 (`environment` deprecated, omitted).
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of container deployables (locals.containers)."
  type        = any # deployable records have runtime-dependent shapes; see betterstack note
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
  service    = each.value.cloudflare_name # fronting Worker service (Wrangler-deployed)
}

output "custom_domains" {
  description = "slug -> bound hostname."
  value       = { for slug, cd in cloudflare_workers_custom_domain.this : slug => cd.hostname }
}
