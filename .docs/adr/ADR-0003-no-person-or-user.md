# ADR-0003 — No Person or User Core Entity

**Status:** ACCEPTED

## Decision

Do not create `Person` or `User` as core Figentra identity-domain entities.

## Rationale

Human account/profile data belongs to Identity. Authorization uses Principal.

Adding Person/User layers without a concrete requirement increases complexity
and creates ambiguous ownership.

## Consequence

```text
Supabase Auth → Identity → Human Principal → IAM
```

is sufficient for the core security model.
