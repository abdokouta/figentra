/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/container` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/container module."
  type        = string
  default     = null
}
