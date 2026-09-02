# ADR-0015 — Replace Clerk With Supabase Auth for V1

**Status:** ACCEPTED

## Decision

The earlier Clerk V1 decision is superseded.

Figentra will use Supabase Auth from day one.

## Superseded decision

ADR-0001 previously selected Clerk.

It is replaced by the Supabase Auth decision.

## Architectural invariant

The authentication provider remains an implementation dependency, not the canonical Figentra identity model.

```text
Supabase Auth
    ↓
Provider Adapter
    ↓
Figentra Identity
    ↓
Principal
    ↓
IAM
```

## Database

Supabase PostgreSQL is the preferred managed PostgreSQL foundation for V1.

## Authorization

Figentra IAM remains authoritative.

Supabase Auth claims and Supabase RLS are not substitutes for Figentra IAM.

## Consequence

The repository must not introduce Clerk-specific dependencies, schemas, terminology, or contracts.
