# =============================================================================
# module: cloudflare-dns — zone lookup (spec 15 §7 "cloudflare-zone")
# =============================================================================
#
# Resolves the figentra.com zone and exports its id. Per-deployable hostnames
# are attached as Workers custom domains by the cloudflare-worker /
# cloudflare-container modules (a custom domain manages its own DNS record), so
# this module intentionally creates NO cloudflare_dns_record resources — it only
# resolves the zone the other modules bind into. Adding standalone DNS records
# here would fight Wrangler/custom-domains for the same hostname (spec 15 §4).
#
# VERIFY the data-source argument shape against cloudflare ~> 5.20 before init:
# the v5 `cloudflare_zone` data source filters via a `filter` block and exposes
# `zone_id` (confirm with `terraform providers schema`, spec 15 §5).
# =============================================================================

variable "zone_name" {
  description = "Apex zone name, e.g. figentra.com."
  type        = string
}

data "cloudflare_zone" "this" {
  filter = {
    name = var.zone_name
  }
}

output "zone_id" {
  description = "Cloudflare zone id for var.zone_name — consumed by the worker/container custom-domain modules."
  value       = data.cloudflare_zone.this.zone_id
}
