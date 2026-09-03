---
status: canonical
component: package
package: "@stackra/ui"
---
# UI — implementation plan

Shared accessible UI primitives and composition contracts. Product applications own screens and domain-specific UX.

## API/layout
`primitives`, `forms`, `feedback`, `overlay`, `layout`, `accessibility`, `tokens`, runtime adapters. Components consume `@stackra/theming` and `@stackra/i18n` rather than defining global policy.

## Accessibility/security
Keyboard/focus semantics, ARIA where relevant, reduced-motion/high-contrast support, safe rendering of user content and no HTML/script injection by default.

## Testing
Component behavior, accessibility checks, keyboard navigation, responsive states, localization/RTL, theme variants and runtime adapter conformance.

## Exit criteria
Shared UI foundation is accessible, typed and cross-runtime without importing business services.
