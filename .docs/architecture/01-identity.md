# 01 — Identity Platform

**Status: APPROVED FOUNDATION**

## Definition

Identity is the authentication contract.

It answers:

> Which authenticated identity has been established?

## Provider

V1 provider: **Supabase Auth**.

Figentra does not implement password authentication, MFA cryptography, SAML
engines, OIDC engines, password recovery, passkeys, etc. from scratch.

## Responsibilities

Identity Platform owns:

- canonical identity ID
- authentication provider mapping
- provider subject mapping
- identifiers
- profile
- identity status
- provider linking
- provider migration
- security metadata
- provider webhook ingestion
- identity lifecycle
- normalized identity events

## No Person / User

There is no core Person entity.

There is no core User entity.

Human information is owned by Identity.

Authorization uses Principal.

```text
Supabase Auth
  ↓
Identity
  ↓
Principal
  ↓
IAM
```

## Supabase Auth boundary

Supabase Auth is the authentication provider.

Figentra is the platform security authority.

Supabase Auth's internal IDs, organization roles and permissions must not become
the universal Figentra model.

## Identity provider adapter

```text
Identity Provider Contract
        │
   ┌────┴────┐
 Supabase Auth    Future Provider
```

The adapter isolates provider-specific semantics.

## Identity synchronization

```text
Provider
  ↓
Webhook
  ↓
Signature verification
  ↓
Idempotency
  ↓
Identity Platform
  ↓
Canonical state
  ↓
Outbox
  ↓
Figentra event
```

## Account linking

Multiple provider subjects may map to one canonical Identity.

Never merge accounts solely because email addresses match.

Require authenticated proof and explicit linking.

## SSO / SCIM

Supabase Auth handles protocol-level enterprise SSO and SCIM capabilities in V1.

Figentra consumes normalized lifecycle events.

SCIM changes identity/principal lifecycle; it does not directly bypass IAM.

## Lifecycle

Identity status is independent from:

- Principal status
- tenant membership
- scope membership
- entitlement
- application status

Example:

```text
Identity ACTIVE
Principal ACTIVE
Tenant membership SUSPENDED
```

## Deletion

Deletion is a lifecycle operation.

Required behavior is subject to retention policy but can include:

- session revocation
- credential revocation
- provider unlinking
- principal deactivation
- anonymization
- retained audit references

## Events

```text
identity.created
identity.updated
identity.disabled
identity.deleted
identity.provider.linked
identity.provider.unlinked
```

## Conceptual schema

```text
identities
identity_identifiers
identity_profiles
identity_provider_links
identity_security
sessions
```

Credential and Principal storage are defined separately.

## Security invariants

- Provider subjects are never Figentra identity primary keys.
- Client identity claims are never trusted without server validation.
- Webhooks are signed and idempotent.
- Provider secrets never enter application code.
- Authentication is not authorization.

## Supabase V1 implementation boundary

Supabase Auth is used for the authentication lifecycle, while Figentra
normalizes the result into its canonical Identity model.

Supabase Auth user IDs must not be used as Figentra Principal IDs.

Recommended mapping:

```text
supabase.auth.users.id
        ↓
identity_provider_links.provider_subject
        ↓
figentra identity.id
        ↓
principal.id
```

Do not expose the Supabase user UUID as the platform's public identity contract.
