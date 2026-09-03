# Figentra Cloudflare Security Module

This module owns the public API perimeter WAF and rate-limit rules.

Cloudflare's current Terraform documentation recommends `cloudflare_ruleset` for
rate limiting and WAF rules. The module deliberately leaves the managed WAF
ruleset ID as an input because Cloudflare plan/account configuration can change
which managed ruleset is available.

The Worker-level Rate Limiting binding is a separate capability and is rendered
into Wrangler from Terraform outputs. The perimeter rules here are defense in
depth, not a replacement for Gateway/IAM authorization.
