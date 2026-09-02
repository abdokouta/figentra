# ADR-0001 — Use Supabase Auth for V1 Authentication

**Status:** ACCEPTED

## Decision

Use Supabase Auth as the V1 authentication provider from day one.

Supabase PostgreSQL is also the preferred managed PostgreSQL foundation where appropriate.

## Rationale

Supabase provides authentication and a managed PostgreSQL platform that can be used as a cohesive V1 foundation while keeping the Figentra security contracts provider-independent.

## Boundary

Supabase Auth authenticates.

Figentra owns canonical Identity and authorization.

Supabase PostgreSQL stores platform data where selected.

## Important separation

Supabase Auth roles/claims are not the Figentra IAM source of truth.

Supabase RLS is defense-in-depth and does not replace IAM.

## Consequences

Positive:
- one managed platform foundation
- PostgreSQL-native architecture
- Auth + database integration
- fast V1 development
- strong local development story

Negative:
- increased Supabase dependency
- provider-specific migration considerations

Mitigation:
- provider adapter
- canonical Figentra IDs
- service-owned schemas/data boundaries
- no provider-specific authorization semantics in application contracts
