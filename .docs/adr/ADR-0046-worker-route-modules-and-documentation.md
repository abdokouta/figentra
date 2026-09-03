# ADR-0046 — Worker Route Modules and Documentation

## Status

Accepted.

## Decision

Figentra Workers use explicit `.route.ts` modules grouped by cohesive HTTP
boundary. Hono itself remains the routing engine; no additional router framework
is introduced.

Cross-cutting middleware remains in the application composition root. Route
modules handle endpoint registration and HTTP translation, while services own
business/application logic.

All public classes, functions, route handlers/factories, and class properties
must have useful documentation. Non-trivial private members and contract members
are also documented.

## Consequences

Worker route ownership becomes obvious and test suites can exercise route
modules independently. The stricter documentation policy improves static
analysis and AI-agent navigation without forcing meaningless comments on trivial
implementation details.
