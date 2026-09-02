/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/dns` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/dns module."
  type        = string
  default     = null
}
