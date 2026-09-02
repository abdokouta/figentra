# TypeScript Service Standards

## Structure

Prefer:

```text
src/
  modules/
  contracts/
  infrastructure/
  application/
  domain/
```

Keep framework code at the boundary.

## Principles

- dependency inversion
- explicit contracts
- typed errors
- validation at boundaries
- no hidden global state
- idempotent handlers
- structured logging

## Hono

Use Hono for HTTP/edge concerns.

Do not create elaborate framework abstractions over Hono unless repeated requirements justify them.

## Node

Use Node.js for services requiring persistent execution/heavy libraries.

## Decorators

Decorators are allowed for registry metadata if they provide measurable value.

Avoid decorators for ordinary business logic when plain functions/types are clearer.
