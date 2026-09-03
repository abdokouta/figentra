# ADR-0084 — Identity Provider: Supabase Auth

## Status

Accepted

## Decision

Supabase Auth is the authoritative human identity provider for Figentra. It owns
credential authentication, sessions/JWT issuance, MFA and external identity
provider integration. Figentra IAM remains authoritative for application
permissions; Figentra Tenant remains authoritative for tenant/business
boundaries.

The identity service must not reimplement passwords, sessions, MFA or a second
identity store. It maps authenticated Supabase subjects into Figentra
actor/context contracts and manages platform-specific actor metadata where
required.

Machine identities are separate: service accounts, system actors and integration
actors use scoped machine credentials owned by IAM/Tenant boundaries rather than
a human Supabase session token.
