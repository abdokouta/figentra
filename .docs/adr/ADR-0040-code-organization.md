# ADR-0040 — Source Declaration Organization

## Status

Accepted.

## Decision

Public interfaces, types, enums and constants use dedicated files:

- `*.interface.ts`
- `*.type.ts`
- `*.enum.ts`
- `*.constant.ts`
- `*.schema.ts`
- `*.event.ts`
- `*.command.ts`
- `*.query.ts`

Prefer one primary exported declaration per file. Exceptions are permitted when
declarations are intrinsically coupled.

## Consequences

AI agents, static scanners and developers can discover declarations reliably.
