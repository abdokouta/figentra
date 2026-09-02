/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/kv` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/kv module."
  type        = string
  default     = null
}
