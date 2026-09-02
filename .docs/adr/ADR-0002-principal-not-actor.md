# ADR-0002 — Principal Is the Single Authorization Subject

**Status:** ACCEPTED

## Decision

Use `Principal` as the only core authorization-subject abstraction.

Do not maintain both Actor and Principal as foundational concepts.

## Rationale

Principal maps directly to mature IAM terminology and cleanly represents any entity that can be authorized.

## Types

Human, service, integration, system and agent can be represented as principal types.

## Consequence

Audit may use `effective_principal` and `actual_principal` for delegation/impersonation without introducing Actor as another identity domain.
