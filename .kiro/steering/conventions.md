# Coding conventions

## TypeScript

- `strict` mode on; no implicit `any`. `tsc --noEmit` is a gate.
- Explicit return types on every exported function and public method.
- Prefer `readonly` on value-object fields and immutable data shapes.
- File header docblock (`@file` + `@description`) on every file.
- Document array/object shapes with real `interface` / `type` declarations —
  never leak untyped `Record<string, unknown>` into a public API.
- Prefer `??` (nullish coalescing) over `||` when the operand can be a valid
  falsy value (`0`, `''`, `false`).
- Prefer `switch (true)` / discriminated-union `switch` or a lookup map over
  long `if/else` ladders for pure value mappings.
- No `export default` — named exports only (better tree-shaking + rename
  tooling). See `code-standards.md`.

## Backend services (Workers / Go / Python)

- Handlers are thin — one invokable handler per use case. Business logic lives
  in service/use-case modules, never inside the HTTP handler.
- Domain models expose no side-effecting methods (no `send()`, `notify()`). Side
  effects belong in use-case services.
- Validate + type request/response payloads at the boundary with a schema
  library (Zod for TypeScript). One schema per boundary shape; input and output
  are distinct schemas.
- Data access goes through the Supabase client (or a typed repository wrapping
  it) — never hand-built SQL scattered through handlers.
- Every schema change ships a forward migration AND a documented rollback.

## Testing

See [`testing.md`](testing.md) for the full contract. In short:

- **Feature/integration tests** cover handler-to-service happy paths.
- **Unit tests** cover services + pure domain logic (no runtime boot).
- Reset state between tests (transaction rollback or a fresh test schema) —
  never truncate shared data.
- Prefer typed factories/builders over inline fixture literals.
- Assert on the parsed response shape + specific values, not on full
  string-equality of serialized JSON.

## Git

- Conventional Commits (see `commitlint.config.mjs`).
- Feature branches: `feat/<scope>-<short-desc>`. Never push to `main` directly.
- One logical change per commit. Split refactors from feature work.
- Every PR must reference an issue or a `.docs/adr/` entry.

Full commit rules — including the emoji table, `--no-verify` allowlist,
pre-commit verification tiers, multi-domain split rules, and protected paths —
live in [`commit-conventions.md`](commit-conventions.md).
