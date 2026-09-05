# Integrations Service — Security & Authorization

Identity authenticates operators/service identities; IAM authorizes connection/provider/sync/reconciliation operations; Tenant defines isolation. Gateway may prevalidate traffic but never replaces these authorities.

## Gateway boundary
Gateway owns public CORS/WAF/coarse edge controls. Integrations independently validates forwarded-header trust, Identity/service context, tenant scope, IAM permissions, provider signatures and SSRF/egress policy. Gateway-only webhook provenance is never trusted.

## Egress
Provider destinations are allow-listed by integration definition. Enforce HTTPS where supported, DNS/IP validation, private-network blocking, redirect validation, connection/response timeouts, response-size limits and SSRF protections. Never allow arbitrary URL input to become an outbound request.

## Secrets
OAuth tokens/API keys live in secret management; DB contains credential references only. Values never enter logs, traces, events, mappings or ordinary API responses.

## Webhooks
Verify provider signatures/timestamps, reject replay, bound body size, authenticate connection/provider, persist dedup evidence and acknowledge only after durable acceptance according to provider semantics. Gateway cannot replace this.

## Tenant isolation
Every connection/sync/mapping/reconciliation query is tenant constrained.

## Rate/transport distinction
Gateway coarse limits protect edge traffic. Integrations retains provider-specific outbound concurrency/rate limits, webhook abuse protection, payload bounds and egress controls.

## Threat tests
SSRF, DNS rebinding, malicious redirects, credential leakage, webhook forgery/replay, mapping injection, oversized payload, provider impersonation, forged Gateway headers, tenant escape and sync privilege escalation.