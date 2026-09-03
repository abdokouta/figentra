# ADR-0041 — Testing and Quality Gates

## Status

Accepted.

## Decision

Vitest is the standard JavaScript/TypeScript test runner. Test code lives
outside production source under `__tests__`.

Test classes:

- unit
- integration
- e2e

All artifacts use shared Stackra testing configuration where applicable. Oxlint
is the standard linter and Prettier is the formatter. ESLint and Jest are not
platform defaults.

## Consequences

The monorepo has a consistent quality pipeline and avoids tool duplication.
