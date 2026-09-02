# ADR-0043 — Platform Security Model

## Status
Accepted.

## Decision
Security follows defense in depth:

Cloudflare WAF/rate limiting → Gateway authentication → IAM authorization →
service identity → service authorization → scoped data access → audit.

Secrets are never stored in source manifests. Service-to-service calls require
authenticated machine identity. Production infrastructure mutation requires
explicit IAM permission and change/approval controls.

## Consequences
No single middleware or provider is treated as the complete security boundary.
