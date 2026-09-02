# ADR-0004 — Identity and Principal Share an Initial Bounded Context

**Status:** ACCEPTED

## Decision

Identity and Principal are implemented initially as one Identity Platform bounded context.

## Rationale

They have strong lifecycle and lookup coupling and do not need separate deployment boundaries initially.

## Consequence

Deployment may be:

```text
identity.figentra.com
```

while the code remains modular internally.
