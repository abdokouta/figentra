# ADR-0005 — Figentra Owns IAM

**Status:** ACCEPTED

## Decision

Figentra IAM is the source of truth for authorization.

Supabase Auth roles/permissions are not the universal Figentra authorization
model.

## Rationale

Figentra must support dynamic scopes, application-specific resources, service
principals, policies, delegation and cross-application authorization.

## Consequence

Supabase Auth organization roles can be used for Supabase Auth UX where useful,
but application authorization goes through Figentra IAM.
