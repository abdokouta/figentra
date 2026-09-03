# ADR-0025 — Identity and IAM Boundary

## Status

Accepted.

## Decision

Supabase Auth is the V1 identity provider. Figentra Identity defines the
platform authentication contract around issuer, JWKS, token claims, lifecycle,
service identity, API keys, M2M OAuth, token exchange, delegation and provider
migration.

IAM is separate from authentication. IAM owns authorization: principals, roles,
permissions, policies, policy evaluation, authorization APIs, caching,
delegation rules and audit requirements.

Figentra does not duplicate Supabase's authentication UI or credential storage
without a platform requirement.

## Consequences

Authentication provider changes remain possible without rewriting service
authorization.
