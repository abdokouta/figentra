# @stackra/typescript-config

Shared TypeScript configuration presets. Every `tsconfig.json` in the monorepo
extends one of these files so upgrading TS rules happens in exactly one place.

## Presets

Consumers always `extends` the **subpath**, never the file path — the source
layout under `src/` is an implementation detail resolved through the package's
`exports` map.

| Subpath          | Source                   | Extends              | For                                                                                                        |
| ---------------- | ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/base`          | `src/base.json`          | —                    | Every TS project. Strictness dial, decorators on, source maps, no unused.                                  |
| `/react-library` | `src/react-library.json` | `base.json`          | Library packages that ship React components (`packages/ui`, etc.)                                          |
| `/vite`          | `src/vite.json`          | `react-library.json` | Vite React apps (`apps/dashboard`, `apps/landing-page`) — `noEmit`, DOM types, JSX react-jsx               |
| `/vite-node`     | `src/vite-node.json`     | `base.json`          | Vite/Vitest/Playwright config files themselves (node context)                                              |
| `/worker`        | `src/worker.json`        | `base.json`          | Cloudflare Workers — `WebWorker` lib, `@cloudflare/workers-types`                                          |
| `/nest`          | `src/nest.json`          | `base.json`          | NestJS services — Node types, decorators + DI, `noEmit` off so `nest build` emits to dist                  |
| `/native`        | `src/native.json`        | — (standalone)       | React Native apps (`apps/academorix-parent`, `templates/react-native`) — workspace strictness + decorators |

`native.json` deliberately does **not** extend `base.json`: React Native needs a
different `lib` set, `jsx: react-native`, and `customConditions`, so it declares
its own full compiler surface.

## Usage

```jsonc
// apps/dashboard/tsconfig.json
{
  "extends": "@stackra/typescript-config/vite",
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
  },
}
```

```jsonc
// services/iam/tsconfig.json
{
  "extends": "@stackra/typescript-config/nest",
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
  },
}
```

```jsonc
// apps/academorix-parent/tsconfig.json
{
  "extends": "@stackra/typescript-config/native",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
  },
}
```

Each app / package MAY add project-local overrides in `compilerOptions`, but
should not disable a rule set by the preset without a written justification
(leave a comment referencing the ADR).
