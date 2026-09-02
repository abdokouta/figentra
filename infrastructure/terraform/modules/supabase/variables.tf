/**
 * @file variables.tf
 * @description Inputs for the `supabase` Terraform module.
 */

variable "name" {
  description = "Stable Figentra resource name for the supabase module."
  type        = string
  default     = null
}
