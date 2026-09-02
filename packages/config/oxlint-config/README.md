# @stackra/oxlint-config

Shared [oxlint](https://oxc.rs) config presets. Every `.oxlintrc.json` in the
monorepo extends one of these:

| Preset   | Extends | For                                                       |
| -------- | ------- | --------------------------------------------------------- |
| `base`   | —       | Shared categories + ignores. Not consumed directly.       |
| `react`  | `base`  | Vite + React 19 apps (browser, `react` + `jsx-a11y`).     |
| `nest`   | `base`  | NestJS services (node env, decorator-friendly rules).     |
| `worker` | `base`  | Cloudflare Workers / Hono (web-standard globals).         |

## Usage

oxlint's `.oxlintrc.json` `extends` takes **file paths** (package-name imports
are only supported in `oxlint.config.ts`), so reference the installed package
through `node_modules`:

```json
// apps/portal/.oxlintrc.json
{ "extends": ["@stackra/oxlint-config/react"] }
```

```json
// services/iam/.oxlintrc.json
{ "extends": ["@stackra/oxlint-config/nest"] }
```

Install alongside `oxlint`:

```sh
pnpm add -D @stackra/oxlint-config oxlint
```

## Design

- Default plugins (`eslint` core + `typescript` + `unicorn` + `oxc`) stay on;
  role presets add `import`, `react`, `jsx-a11y` as needed. Setting `plugins`
  replaces the default set, so each preset lists the full set it wants.
- `correctness` = error, `suspicious` = warn.
- `typescript/no-floating-promises` (nest preset) only fires under
  `oxlint --type-aware`; it is inert on the default fast pass.
