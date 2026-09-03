# ADR-0008 — Do Not Use Refine

**Status:** ACCEPTED

## Decision

Do not use Refine as the application data/UI framework.

## Rationale

The internal Query/State/HTTP packages already provide the required optimistic
querying/mutation abstractions.

## Consequence

Avoid duplicated caching, routing and data-layer abstractions.
