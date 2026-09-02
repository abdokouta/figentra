/**
 * @file main.tf
 * @description Production Cloudflare WAF and zone-level API rate limiting.
 *
 * Cloudflare's current Terraform guidance uses `cloudflare_ruleset` for both
 * managed WAF execution and HTTP rate limiting. The Gateway remains the
 * authoritative application-level authentication/authorization boundary.
 */

/**
 * Executes Cloudflare's managed WAF ruleset and the OWASP Core Ruleset.
 *
 * The IDs are provider-managed Cloudflare ruleset identifiers documented by
 * Cloudflare. They are intentionally inputs so an operator can override them
 * if Cloudflare changes the account/plan-specific managed rulesets.
 */
resource "cloudflare_ruleset" "managed_waf" {
  zone_id     = var.zone_id
  name        = var.name
  description = "Figentra managed WAF protection."
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules = [
    {
      ref         = "figentra-managed-waf"
      description = "Execute Cloudflare managed WAF rules."
      expression  = "true"
      action      = "execute"
      action_parameters = {
        id = var.managed_waf_ruleset_id
      }
    },
    {
      ref         = "figentra-owasp-core"
      description = "Execute Cloudflare OWASP Core Ruleset."
      expression  = "true"
      action      = "execute"
      action_parameters = {
        id = var.owasp_ruleset_id
      }
    },
  ]
}

/**
 * Adds a perimeter API rate limit using the current Rulesets API model.
 */
resource "cloudflare_ruleset" "api_rate_limit" {
  zone_id     = var.zone_id
  name        = "${var.name}-rate-limit"
  description = "Figentra public API perimeter rate limit."
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [{
    ref         = "figentra-api-rate-limit"
    description = "Limit public API requests by source and Cloudflare colo."
    expression  = "http.request.uri.path matches \"^/api/.*\""
    action      = "block"
    ratelimit = {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = var.api_requests_per_minute
      mitigation_timeout  = var.mitigation_timeout_seconds
    }
  }]
}
