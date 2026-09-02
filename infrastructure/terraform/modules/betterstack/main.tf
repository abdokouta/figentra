# =============================================================================
# module: betterstack — uptime monitors (observability; spec 15 §4 / 16)
# =============================================================================
#
# One Better Stack uptime monitor per deployable whose cloud.yaml declares
# observability.betterstack.enable_uptime, probing its /health endpoint.
#
# GATED on var.enabled (set from `var.better_stack_api_token != ""` in
# deploy.tf) so `terraform plan` stays clean before Better Stack is configured.
#
# VERIFY resource args against BetterStackHQ/better-uptime ~> 0.20 before init
# (spec 15 §5): the v0.x provider's betteruptime_monitor fields (monitor_type
# enum, required attributes) shift between minor releases.
# =============================================================================

variable "enabled" {
  description = "Whether Better Stack is configured (token present)."
  type        = bool
  default     = false
}

variable "deployables" {
  description = "Slug-keyed map of deployables to monitor (locals.uptime_monitored)."
  # `any`, not `map(any)`: the monitored set mixes runtimes (services carry a
  # `container` block, assets carry `build`), so the per-slug records have
  # divergent object types that cannot unify into a single map element type.
  type = any
}

variable "fqdns" {
  description = "slug -> fully-qualified hostname (from locals.fqdns)."
  type        = map(string)
}

resource "betteruptime_monitor" "this" {
  for_each = var.enabled ? var.deployables : {}

  # Probe path is deployable-aware: container services expose
  # container.health_path (/health), while Workers + static-asset SPAs (portal,
  # figentra-landing, academorix-landing) have no /health route and fall back to
  # "/". A hardcoded /health 404s on the SPAs.
  url          = "https://${var.fqdns[each.key]}${try(each.value.container.health_path, "/")}"
  monitor_type = "status" # expect a 2xx from the probe path
}

output "monitor_ids" {
  description = "slug -> Better Stack monitor id."
  value       = { for slug, m in betteruptime_monitor.this : slug => m.id }
}
