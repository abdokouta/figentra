# =============================================================================
# module: cloudflare-queue — Cloudflare Queues (durable infra; spec 15 §4)
# =============================================================================
#
# One Queue per deployable whose cloud.yaml declares capabilities.needs_queue
# (today: iam, tenant, monetization — async lifecycle/usage/audit events,
# spec 01 §5). Terraform OWNS the queue; producers/consumers bind it via
# wrangler.jsonc (Workers) or the queue name in service config (Containers).
#
# Arg `queue_name` confirmed against cloudflare ~> 5.20 via `terraform validate`.
# =============================================================================

variable "deployables" {
  description = "Slug-keyed map of deployables needing a Queue (locals.needs_queue)."
  type        = any # deployable records have runtime-dependent shapes; see betterstack note
}

variable "account_id" {
  description = "Cloudflare account id."
  type        = string
}

variable "env" {
  description = "Environment — suffixes queue names."
  type        = string
}

resource "cloudflare_queue" "this" {
  for_each   = var.deployables
  account_id = var.account_id
  queue_name = "${each.value.cloudflare_name}-${var.env}"
}

output "queue_ids" {
  description = "slug -> Queue id."
  value       = { for slug, q in cloudflare_queue.this : slug => q.id }
}

output "queue_names" {
  description = "slug -> Queue name (consumed by wrangler.jsonc queue producer/consumer bindings)."
  value       = { for slug, q in cloudflare_queue.this : slug => q.queue_name }
}
