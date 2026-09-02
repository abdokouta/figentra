# =============================================================================
# module: cloudflare-kv — Workers KV namespaces (durable infra; spec 15 §4)
# =============================================================================
#
# One KV namespace per deployable whose cloud.yaml declares capabilities.needs_kv
# (today: gateway rate-limit/request-id cache, application-registry read
# cache). Terraform OWNS the namespace; Wrangler binds it in wrangler.jsonc via
# the id emitted by `output.namespace_ids`.
#
# VERIFY resource arguments against cloudflare ~> 5.20 before init (spec 15 §5).
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of deployables needing KV (locals.needs_kv)."
  type        = any # deployable records have runtime-dependent shapes; see betterstack note
}

variable "account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "env" {
  description = "Environment — suffixes namespace titles."
  type        = string
}

resource "cloudflare_workers_kv_namespace" "this" {
  for_each   = var.deployables
  account_id = var.account_id
  title      = "${each.value.cloudflare_name}-${var.env}"
}

output "namespace_ids" {
  description = "slug -> KV namespace id (consumed by wrangler.jsonc kv_namespaces binding)."
  value       = { for slug, ns in cloudflare_workers_kv_namespace.this : slug => ns.id }
}
