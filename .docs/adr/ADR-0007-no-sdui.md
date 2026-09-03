# ADR-0007 — No Server-Driven UI

**Status:** ACCEPTED

## Decision

Do not implement SDUI in V1.

## Rationale

The applications need explicit, maintainable UI code. Previous attempts at SDUI
created unnecessary complexity.

## Consequence

Registry exposes metadata/capabilities, while React applications own rendering.
