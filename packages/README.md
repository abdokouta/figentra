# Figentra workspace packages

Every package under this folder is a `@stackra/*`-scoped npm package. Each
follows the canonical shape from `.kiro/steering/package-conventions.md`.

## Package catalog

| Package             | npm name                     | Kind                   | Shape                                                  |
| ------------------- | ---------------------------- | ---------------------- | ------------------------------------------------------ |
| `contracts`         | `@stackra/contracts`         | Framework vocabulary   | **TS library** — `src/` → tsup → `dist/`               |
| `testing`           | `@stackra/testing`           | Test toolkit + presets | **TS library** — `src/` → tsup → `dist/`               |
| `pipeline`          | `@stackra/pipeline`          | Middleware pipeline    | **TS library** — `src/` → tsup → `dist/`               |
| `tsup-config`       | `@stackra/tsup-config`       | Build preset           | **TS library** — exports `defineBaseConfig()` function |
| `typescript-config` | `@stackra/typescript-config` | TS preset              | **JSON preset** — ships `.json` files as-is            |
| `prettier-config`   | `@stackra/prettier-config`   | Formatter preset       | **JSON preset** — ships `.json` files as-is            |
| `oxlint-config`     | `@stackra/oxlint-config`     | Lint preset            | **JSON preset** — ships `.json` files as-is            |
| `mapped-types`      | `@pixielity/mapped-types`    | Type utilities         | **TS library** — vendored                              |
| `metadata`          | `@vivel/metadata`            | Reflection metadata    | **TS library** — vendored                              |

## Two shapes of config packages

Config packages come in two forms:

### JSON preset (no compilation)

`typescript-config`, `prettier-config`, `oxlint-config` — each exports JSON
files (or `.mjs` presets) directly. No build step, no `dist/`, no
`tsconfig.json`. `package.json.files` includes the preset files by name.

### TS library (compiled)

`tsup-config` — exports a TypeScript function (`defineBaseConfig`). Its output
must be compiled to CJS + ESM. Has a `tsconfig.json`, runs `tsup`, ships
`dist/`.

### How to tell which

- Does the package export a `.ts` function or class? → **TS library**.
- Does the package export `.json` files that consumers `extends`? → **JSON
  preset**.

## Adding a new package

1. Copy the closest existing package shape.
2. Follow `.kiro/steering/package-conventions.md` for the scaffold checklist.
3. Author `catalog.json` per `.kiro/steering/catalog-manifest.md`.
4. Register in `pnpm-workspace.yaml` if not auto-discovered.
5. Run `pnpm run modules:check && pnpm run standards:check` to verify.

## Cross-references

- `.kiro/steering/package-conventions.md` — canonical package shape.
- `.kiro/steering/package-json-conventions.md` — per-tier `package.json` rules.
- `.kiro/steering/catalog-manifest.md` — `catalog.json` schema + rules.
- `.kiro/steering/code-standards.md` — folder taxonomy + naming.
