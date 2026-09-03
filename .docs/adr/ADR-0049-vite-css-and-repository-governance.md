# ADR-0049 — Vite CSS Pipeline and Repository Governance

## Status

Accepted.

## Decisions

### Vite / Tailwind / HeroUI

Figentra Vite applications use Tailwind CSS v4 through the official
`@tailwindcss/vite` plugin and HeroUI v3 through `@heroui/styles` +
`@heroui/react`.

We do **not** use a PostCSS configuration for the standard Vite applications.

The canonical CSS entry point is:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

HeroUI v3 is CSS-first and no longer requires the v2 Tailwind plugin or
`tailwind.config.js` for standard HeroUI usage.

### Browser testing

Vite applications use Playwright for E2E/browser testing. Vitest remains the
unit/component test runner.

### Repository governance

The monorepo uses:

- Conventional Commits + commitlint.
- Husky for local Git hooks.
- lint-staged for staged formatting.
- Changesets for package release/version management.
- npm overrides for shared dependency versions.
- Turbo for task orchestration.
- Oxlint + Prettier for code quality.

### Environment naming

Only the long canonical names are valid:

- `development`
- `staging`
- `production`

No `dev`, `stg`, or `prd` aliases are accepted by repository tooling.

## Rationale

The goal is to minimize configuration variants, avoid a legacy CSS processing
layer when the Vite plugin already owns Tailwind processing, and make local, CI,
release, and deployment behavior deterministic.
