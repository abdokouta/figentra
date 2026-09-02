/**
 * @file variables.tf
 * @description Inputs for the `firebase` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the firebase module."
  type        = string
  default     = null
}
