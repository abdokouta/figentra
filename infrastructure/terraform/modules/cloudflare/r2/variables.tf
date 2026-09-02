/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/r2` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/r2 module."
  type        = string
  default     = null
}
