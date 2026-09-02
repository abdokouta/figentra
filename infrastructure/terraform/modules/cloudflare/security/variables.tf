/**
 * @file variables.tf
 * @description Inputs for the production Cloudflare WAF/rate-limit module.
 */

/** Cloudflare zone receiving public Figentra traffic. */
variable "zone_id" {
  description = "Cloudflare zone ID for the public Figentra hostname."
  type        = string
}

/** Stable ruleset name. */
variable "name" {
  description = "Cloudflare security ruleset name."
  type        = string
}

/** Cloudflare Managed Ruleset identifier. */
variable "managed_waf_ruleset_id" {
  description = "Cloudflare Managed Ruleset ID."
  type        = string
  default     = "efb7b8c949ac4650a09736fc376e9aee"
}

/** Cloudflare OWASP Core Ruleset identifier. */
variable "owasp_ruleset_id" {
  description = "Cloudflare OWASP Core Ruleset ID."
  type        = string
  default     = "4814384a9e5d4991b9815dcfc25d2f1f"
}

/** Maximum public API requests per source characteristic per minute. */
variable "api_requests_per_minute" {
  description = "Maximum public API requests per minute per source characteristic."
  type        = number
  default     = 600
  validation {
    condition     = var.api_requests_per_minute > 0
    error_message = "api_requests_per_minute must be greater than zero."
  }
}

/** Edge mitigation duration in seconds. */
variable "mitigation_timeout_seconds" {
  description = "Cloudflare rate-limit mitigation timeout in seconds."
  type        = number
  default     = 60
  validation {
    condition     = var.mitigation_timeout_seconds > 0
    error_message = "mitigation_timeout_seconds must be greater than zero."
  }
}
