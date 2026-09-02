# ADR-0019 — HeroUI V3

**Status:** ACCEPTED

## Decision

Figentra frontend applications use HeroUI V3.

The current HeroUI package is 3.2.4 and the official documentation describes
V3 as React 19 + Tailwind CSS v4, with no `HeroUIProvider`, standalone
`@heroui/styles`, compound components, and CSS-based animation. citeturn1search1turn0search1turn0search13

## Consequences

- React 19+ is required.
- Tailwind CSS v4 is required.
- `HeroUIProvider` is removed.
- `@heroui/styles` is imported after `tailwindcss`.
- Framer Motion is not a HeroUI dependency.
- V2 hooks and V2 component APIs must not be introduced.
- Collection items use `id`/`textValue` where required by V3.

## Migration rule

Do not mix V2 and V3 in a production application. HeroUI's official migration
documentation says the full migration path should migrate component code before
switching the dependency set. citeturn0search1

Because the current Figentra portal was generated from a V2 historical template,
the bootstrap process must finish its migration before marking the frontend
baseline production-ready.
