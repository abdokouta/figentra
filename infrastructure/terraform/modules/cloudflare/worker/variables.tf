/**
 * @file variables.tf
 * @description Inputs for the `cloudflare/worker` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the cloudflare/worker module."
  type        = string
  default     = null
}
