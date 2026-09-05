# Integrations Service — Security & Authorization

Identity authenticates operators/service identities; IAM authorizes connection/provider/sync/reconciliation operations. Tenant defines isolation. Integrations never owns authentication-provider adapters for Supabase/Clerk; those belong to Identity.

## Egress
Provider destinations are allow-listed by integration definition. Enforce HTTPS where supported, DNS/IP validation, private-network blocking, redirect validation, connection/response timeouts, response-size limits and SSRF protections. Never allow arbitrary URL input to become an outbound request.

## Secrets
OAuth tokens/API keys live in secret management. Database contains credential references only. Secret values never enter logs, traces, events, mapping definitions or ordinary API responses.

## Webhooks
Verify provider signatures/timestamps, reject replay, bound body size, authenticate connection/provider, persist dedup evidence and acknowledge only after durable acceptance according to provider semantics.

## Tenant isolation
Every connection, sync, mapping and reconciliation query is tenant constrained. Cross-tenant IDs are opaque.

## Threat tests
SSRF, DNS rebinding, malicious redirects, credential leakage, webhook forgery/replay, mapping injection, oversized payload, provider impersonation, tenant escape, unauthorized connection takeover and sync privilege escalation.

## Audit
Connection authorization/revocation, credential rotation, webhook security failures and reconciliation changes emit durable audit facts.