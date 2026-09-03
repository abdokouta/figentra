---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/theming` — cross-runtime design-token and theme system

**Status:** Planned  
**Anchor ADRs:** ADR-0019, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/storage`, `@stackra/state`, `@stackra/i18n`  
**Design effort:** 12 days across 7 phases

## Purpose

Typed design tokens, named themes, dark/light/system resolution, persistence, hydration-safe startup and web/RN platform mapping. UI components consume tokens; the theme package does not own components.

## Non-goals

- Component library implementation.
- Business branding CMS.
- Runtime DOM manipulation from core.

## Manager pattern

`ThemeManager` owns immutable theme definitions and current-theme state through an injected state store.

## Subpath layout

```text
packages/theming/src/core/{theming.module.ts,tokens/,themes/,resolver/,persistence/,index.ts}
packages/theming/src/react/{provider/,hooks/,css-vars/,index.ts}
packages/theming/src/native/{provider/,hooks/,index.ts}
packages/theming/src/testing/{theme-fixture.ts,index.ts}
```

## Contracts split

`@stackra/contracts/theming` owns `ITheme`, `IThemeTokens`, `IThemeManager`, `ThemeMode`, persistence contract and `THEME_MANAGER`.

## Public API — locked

```ts
interface IThemeManager { current(): ITheme; set(name:string): void; setMode(mode:ThemeMode): void; subscribe(fn:()=>void):()=>void; resolve(mode:ThemeMode):ITheme; }
```

Themes are validated for token completeness and contrast metadata. System preference is an input, not an authority over explicit user choice.

## Security / persistence / runtime

Theme data is non-secret. Persisted settings are versioned and bounded. Core is DOM/RN neutral; React maps tokens to CSS variables, RN maps to style objects. Hydration must render a deterministic initial theme to avoid mismatch/flicker.

## Errors / observability / testing

Invalid themes fail validation at build/test time. Metrics cover theme resolution and hydration fallback. Test token completeness, mode precedence, persistence migration and SSR hydration.

## Phases

1. Contracts/scaffold (2d); 2. token/theme model (2d); 3. manager/resolution (2d); 4. React/RN adapters (2d); 5. persistence/hydration (1d); 6. tests/accessibility checks (2d); 7. docs/release (1d).

## Exit criteria

Themes are type-safe, hydration-safe, accessible and identical in semantic meaning across web and native runtimes.

## Cross-references

`2026-09-03-ui-package.md`, `2026-09-03-i18n-package.md`, ADR-0019/0091.
