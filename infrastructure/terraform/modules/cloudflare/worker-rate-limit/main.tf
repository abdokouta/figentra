/**
 * @file main.tf
 * @description Produces a stable integer namespace identifier for Cloudflare's
 * Worker Rate Limiting binding.
 *
 * Cloudflare defines the namespace ID as an account-unique integer. Terraform
 * persists the generated value, so the same environment keeps the same binding
 * namespace across deployments. An explicit ID can be supplied when the
 * organization already owns a centrally allocated namespace registry.
 */

resource "random_integer" "namespace" {
  count = var.namespace_id == null ? 1 : 0

  min = 1_000_000
  max = 2_147_483_647
  keepers = {
    name = var.name
  }
}

locals {
  namespace_id = var.namespace_id != null ? var.namespace_id : random_integer.namespace[0].result
}

output "namespace_id" {
  description = "Stable Cloudflare Worker Rate Limiting namespace ID."
  value       = local.namespace_id
}
