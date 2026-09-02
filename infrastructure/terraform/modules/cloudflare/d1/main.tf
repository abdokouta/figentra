# =============================================================================
# module: cloudflare-d1 — D1 databases (durable infra; spec 15 §4)
# =============================================================================
#
# One D1 database per deployable whose cloud.yaml declares capabilities.needs_d1
# (today: application-registry). Terraform OWNS the database; the worker SCRIPT
# that binds it is deployed by Wrangler, which reads the database id emitted by
# `output.database_ids` into its wrangler.jsonc `d1_databases` binding.
#
# VERIFY resource arguments against the pinned cloudflare provider (~> 5.20)
# with `terraform providers schema` before `terraform init` (spec 15 §5).
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of deployables needing D1 (locals.needs_d1)."
  type        = any # deployable records have runtime-dependent shapes; see betterstack note
}

variable "account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "env" {
  description = "Environment (development | staging | production) — suffixes resource names."
  type        = string
}

resource "cloudflare_d1_database" "this" {
  for_each   = var.deployables
  account_id = var.account_id
  name       = "${each.value.cloudflare_name}-${var.env}"
}

output "database_ids" {
  description = "slug -> D1 database id (consumed by the worker's wrangler.jsonc d1_databases binding)."
  value       = { for slug, db in cloudflare_d1_database.this : slug => db.id }
}
