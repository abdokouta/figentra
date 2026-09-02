/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/d1` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/d1 module."
  type        = string
  default     = null
}
