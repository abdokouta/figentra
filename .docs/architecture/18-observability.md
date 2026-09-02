# 18 — Observability

**Status: FOUNDATION**

Every service supports:

- structured logging
- metrics
- traces
- health
- readiness
- request IDs
- correlation IDs

OpenTelemetry is preferred.

Security/audit records must not be treated as ordinary logs.

Never log:
- passwords
- tokens
- API secrets
- private keys
- raw session cookies
- unnecessary PII
