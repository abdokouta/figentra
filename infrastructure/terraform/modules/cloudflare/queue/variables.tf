/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/queue` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/queue module."
  type        = string
  default     = null
}
