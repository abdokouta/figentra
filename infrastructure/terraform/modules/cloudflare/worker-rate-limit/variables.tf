/**
 * @file variables.tf
 * @description Inputs for a stable Worker Rate Limiting namespace identifier.
 */

/** Stable logical name used in Terraform state and generated Wrangler configuration. */
variable "name" {
  description = "Stable logical name for the Worker rate-limit namespace."
  type        = string
}

/** Optional explicit integer namespace ID. */
variable "namespace_id" {
  description = "Optional operator-supplied Cloudflare Worker Rate Limiting namespace ID."
  type        = number
  default     = null
}
