# 20 — Testing and Quality

**Status: FOUNDATION**

## Test layers

- unit
- integration
- contract
- authorization
- event
- end-to-end
- infrastructure
- architecture/dependency

## Security tests

Identity:
- webhook signatures
- provider mapping
- lifecycle
- linking

Credentials:
- rotation
- revocation
- expiration
- leakage

IAM:
- allow
- deny
- scope isolation
- privilege escalation
- policy
- delegation
- impersonation
- cache invalidation

Communication:
- invalid audience
- expired token
- replay
- unauthorized service
- token forwarding

## Architecture tests

Prevent:
- direct cross-service DB access
- direct Supabase Auth dependency outside Identity adapter
- application bypass of IAM
- IAM importing business domain models
- secrets in source
