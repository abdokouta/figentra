---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/ui` — enterprise cross-platform design system

**Status:** Planned  
**Anchor ADRs:** ADR-0019, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/theming`, `@stackra/i18n`, `@stackra/state`  
**Design effort:** 24 days across 10 phases

## Purpose

Accessible, typed UI primitives and composed components for React web and React Native, using shared semantic tokens and platform-specific implementations. Components expose stable behavior rather than leaking vendor UI internals.

## Non-goals

- Routing/navigation.
- Data fetching.
- Business-specific screens.

## Manager pattern

No driver Manager. `UIProvider` composes theme, i18n and state contexts; component registries are static and typed.

## Subpath layout

```text
packages/ui/src/core/{tokens/,components/,patterns/,accessibility/,forms/,tables/,overlays/,index.ts}
packages/ui/src/react/{components/,providers/,hooks/,index.ts}
packages/ui/src/native/{components/,providers/,index.ts}
packages/ui/src/testing/{render.tsx,queries/,fixtures/,index.ts}
```

## Contracts split

`@stackra/contracts/ui` owns component props/value contracts, accessibility semantics and provider contracts. Components themselves stay in UI.

## Public API — locked

Stable primitives include `Button`, `Input`, `Select`, `Dialog`, `Drawer`, `Table`, `Form`, `Field`, `Toast`, `EmptyState`, `LoadingState`, `ErrorState`, `Card`, `Stack`, `Grid`, and `Text`, plus typed providers.

Every interactive component supports keyboard/accessibility semantics on web and semantic accessibility props on native. Controlled/uncontrolled behavior is explicit.

## Runtime / styling

Web implementation uses the repository-approved HeroUI/Tailwind stack; native uses semantic React Native primitives. Vendor components are adapters, not public contracts. No DOM imports in core/native.

## Security / accessibility

Focus management, escape behavior, labels, roles, contrast, reduced motion and touch targets are mandatory. User-generated text is rendered safely. Dangerous HTML is never accepted without an explicit sanitized API.

## Errors / observability

Error boundaries and component diagnostics use `@stackra/errors`. Production logs avoid component payloads. Test IDs are deterministic and not exposed as business identifiers.

## Testing / conformance

Vitest + Testing Library contract tests for every primitive; accessibility assertions; keyboard/focus tests; visual regression for critical components; RN render tests. Every component has loading/empty/error states where applicable.

## Versioning

UI behavior changes require changelog/Changeset and migration notes. Internal vendor upgrades cannot change public semantics without review.

## Phases

1. contracts/scaffold (2d); 2. tokens/theme integration (2d); 3. layout/typography (2d); 4. forms (3d); 5. overlays/feedback (3d); 6. data display/table (3d); 7. React implementation (3d); 8. Native implementation (3d); 9. accessibility/testing (2d); 10. docs/release (1d).

## Exit criteria

Critical primitives are accessible, typed, responsive, testable and semantically consistent across web/native without vendor leakage.

## Cross-references

`2026-09-03-theming-package.md`, `2026-09-03-i18n-package.md`, `2026-09-03-router-package.md`, ADR-0019/0091.
