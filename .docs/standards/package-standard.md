# Stackra Package Standard

A publishable `@stackra/*` package is the reusable-library boundary of the
monorepo. `catalog.json` is package metadata for agents/tooling and is not a
deployable manifest.

## Required structure

```text
packages/<area>/<package>/
├── catalog.json
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── __tests__/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── vitest.setup.ts
└── src/
```

## Configuration

- Extend `@stackra/typescript-config`.
- Use `@stackra/tsup-config` for library bundling.
- Use `@stackra/testing/preset` for Vitest.
- Use Oxlint and Prettier.
- Do not introduce ESLint/Jest unless an ADR explicitly approves an exception.

## Package manifest

`package.json` must deliberately classify runtime dependencies, peer
dependencies, optional peer dependencies, and development-only dependencies.
`exports` must expose only supported public entry points and their generated
types.

`catalog.json` must describe package identity, purpose, capabilities,
peer-dependency expectations, maturity, owning agent, and documentation. The
catalog's dependency declarations must be consistent with `package.json`.

## Tests

Use `__tests__/unit` and `__tests__/integration`. Add browser/e2e tests only
when the package owns such a boundary.

## Public source organization

Prefer one exported interface/type/enum/constant per file:

- `*.interface.ts`
- `*.type.ts`
- `*.enum.ts`
- `*.constant.ts`
- `*.schema.ts`
- `*.event.ts`
- `*.command.ts`
- `*.query.ts`

Exceptions require the declarations to be intrinsically coupled.
