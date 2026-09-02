# Testing

## Framework

**Vitest.** Tests live next to the code under test (`*.test.ts` / `*.spec.ts`)
or under a package/app `tests/` directory. The workspace ships a shared Vitest
preset via `@figentra/testing` (or the equivalent config package) — merge it,
don't hand-roll.

## Layout

```
src/
  <feature>/
    <feature>.ts
    <feature>.test.ts        — unit test beside the unit
tests/
  integration/               — HTTP + full-stack scenarios (Worker fetch, DB)
  setup.ts                   — global test setup (Supabase test client, env)
```

## Creating tests

- One test file per module under test. Name it after the module
  (`create-user.ts` → `create-user.test.ts`).
- UI packages that render components use jsdom (`environment: "jsdom"` in the
  package's `vitest.config.ts`); pure logic packages use the default node
  environment.

## Running tests

```bash
pnpm test                       # everything, via Turborepo (cache-aware)
pnpm test:coverage              # with coverage
pnpm -F <package> test          # a single package
pnpm -F <package> vitest run --coverage
doppler run -- pnpm test        # when a test needs real secrets/bindings
```

## Rules

- Every Worker route/handler gets at least one happy-path integration test.
- Every service/use-case function gets at least one unit test.
- Integration tests reset state per test (transaction rollback or a fresh test
  schema against Supabase) — never truncate shared data.
- Prefer typed factories with named variants over inline fixture objects.
- Assert on the parsed response shape + specific values — not on full JSON
  string equality (fragile).
- Do NOT delete tests without user approval — see AGENTS.md.
