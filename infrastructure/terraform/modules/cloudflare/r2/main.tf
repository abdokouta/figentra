# =============================================================================
# module: cloudflare-r2 — R2 buckets (durable infra; spec 15 §4)
# =============================================================================
#
# One R2 bucket per deployable whose cloud.yaml declares capabilities.needs_r2
# (none today — R2 is the object store for files/backups per spec 14 when a
# service opts in). Terraform OWNS the bucket; consumers bind it by name.
#
# VERIFY resource arguments against cloudflare ~> 5.20 before init (spec 15 §5).
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of deployables needing R2 (locals.needs_r2)."
  type        = any # deployable records have runtime-dependent shapes; see betterstack note
}

variable "account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "env" {
  description = "Environment — suffixes bucket names."
  type        = string
}

resource "cloudflare_r2_bucket" "this" {
  for_each   = var.deployables
  account_id = var.account_id
  name       = "${each.value.cloudflare_name}-${var.env}"
}

output "bucket_names" {
  description = "slug -> R2 bucket name (consumed by wrangler.jsonc r2_buckets binding)."
  value       = { for slug, b in cloudflare_r2_bucket.this : slug => b.name }
}
