# UI Component Rules

Rules for any package that ships React (or React Native) components.

## Rule — build on `@stackra/ui`, never hand-roll UI

Every visual component MUST be composed from HeroUI / HeroUI Pro primitives
re-exported by `@stackra/ui`:

- Web: `import { … } from '@stackra/ui/react'` (re-exports all `@heroui/react` +
  `@heroui-pro/react`).
- Native: `import { … } from '@stackra/ui/native'`.

Do **not**:

- Hand-roll semantic markup with bespoke class names (e.g.
  `<span className="network-indicator">`). Use the matching HeroUI component
  (`Chip`, `Alert`, `Badge`, …).
- Ship custom CSS / `.css` files / BEM class strings for component styling.
  HeroUI owns the styling layer.
- Reach past `@stackra/ui` straight into `@heroui/react` from a feature package
  — always go through `@stackra/ui` so the design system stays a single
  swappable dependency.

Allowed: standard Tailwind **layout** utilities for composition only (`flex`,
`gap-*`, `mt-*`, `w-full`, …) and passthrough `className` props. These arrange
HeroUI components; they don't restyle them. This mirrors HeroUI's own docs
examples.

`@stackra/ui` is declared as an **optional peer** on packages that ship
components (so headless consumers aren't forced to install it), and a dev
dependency so the package type-checks and builds.

## Rule — always prefer `ComboBox` over `Select`

When a component needs a single-choice dropdown, use HeroUI **`ComboBox`**, not
`Select`. `ComboBox` gives a filterable text input for free, so the control
scales as the option list grows. Reserve `Select` only for the rare case where
free-text search is explicitly undesirable — and justify it in a comment.

### API differences to remember

`ComboBox` is **not** a drop-in swap for `Select`:

| Concern          | `Select`                    | `ComboBox`                                   |
| ---------------- | --------------------------- | -------------------------------------------- |
| Controlled value | `value` / `onChange`        | `selectedKey` / `onSelectionChange`          |
| Change payload   | `Key \| Key[] \| null`      | `Key \| null` (single)                       |
| Trigger anatomy  | `Select.Trigger` + `.Value` | `ComboBox.InputGroup` → `Input` + `.Trigger` |
| Open behaviour   | click                       | `menuTrigger="focus" \| "input" \| "manual"` |

```tsx
// ✅ CORRECT — searchable single-select on ComboBox.
import { ComboBox, Input, Label, ListBox } from "@stackra/ui/react";

<ComboBox
  selectedKey={value}
  onSelectionChange={(key) => setValue(key)}
  menuTrigger="focus"
>
  <Label>Scope</Label>
  <ComboBox.InputGroup>
    <Input placeholder="Search scope..." />
    <ComboBox.Trigger />
  </ComboBox.InputGroup>
  <ComboBox.Popover>
    <ListBox>
      {options.map((o) => (
        <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
          {o.label}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  </ComboBox.Popover>
</ComboBox>;
```

## Rule — verify component APIs against the HeroUI MCP

Before shipping a component, confirm the compound API (part names, prop names,
controlled-value contract) against the HeroUI MCP (`get_component_docs`). HeroUI
v3 is compound-first and the exact part names differ per component — never guess
them.

## Rule — `PressableFeedback` root: web uses `onClick`, native uses `onPress`

> **ADR anchor.** Codified by
> [ADR-0055](../../docs/adr/0055-pressablefeedback-root-pattern.md) —
> `PressableFeedback` root pattern: web keeps `onClick`, native uses `onPress`.
> Same-day corrected 2026-07-26 after empirical `tsc --noEmit` verification
> showed TS2322 on the initial `onPress`-everywhere pass.

`PressableFeedback` (re-exported from HeroUI Pro through `@stackra/ui/react` and
`@stackra/ui/native`) uses DIFFERENT prop names on each surface because the
underlying platforms use different event models:

- **Web** — `@heroui-pro/react`'s `PressableFeedbackRoot` type extends
  `DOMRenderProps<E, undefined>` + native `<button>` DOM attributes (verified at
  `node_modules/@heroui-pro/react/dist/components/pressable-feedback/pressable-feedback.d.ts`).
  The root accepts `onClick`; it does NOT accept `onPress`. TypeScript reports
  `TS2322 Property 'onPress' does not exist` when misused.
- **Native** — `heroui-native-pro`'s `PressableFeedback` sits on top of React
  Native's `Pressable` and accepts `onPress`.

Both surfaces are correct per their respective HeroUI Pro types. The prop-name
split is a platform-API reality, not a workspace convention.

### The two documented compound usages

1. **Root as pressable (canonical).** The `<PressableFeedback>` root IS the
   interactive surface. Children can include the compound parts
   (`<PressableFeedback.Ripple />`, `<PressableFeedback.Highlight />`) AND
   arbitrary rendered content (a `Chip`, a label, an icon).

   ```tsx
   // ✅ CORRECT — web root uses onClick (native <button> event handler).
   <PressableFeedback
     aria-label="Open notifications"
     onClick={handlePress}
     className="fixed right-4 bottom-4 z-[2147483000] flex items-center gap-2"
   >
     <Chip size="sm" variant="primary">
       <Chip.Label>Notifications</Chip.Label>
     </Chip>
   </PressableFeedback>
   ```

   ```tsx
   // ✅ CORRECT — native root uses onPress (RN Pressable event handler).
   import { PressableFeedback } from "@stackra/ui/native";

   <PressableFeedback
     accessibilityLabel="Open notifications"
     onPress={handlePress}
   >
     <BellIcon />
   </PressableFeedback>;
   ```

2. **Decorations inside a `<Button>` (also documented).** A `<Button>` is the
   interactive surface; `<PressableFeedback.Ripple />` /
   `<PressableFeedback.Highlight />` render inside the button as passive
   visual-feedback layers. `<PressableFeedback>` root is absent. Web `<Button>`
   uses `onPress` because HeroUI Pro's `Button` wraps React Aria's `usePress`
   (unlike `PressableFeedback` root which is a raw `<button>`).

   ```tsx
   // ✅ CORRECT — Button owns the pressable contract via React Aria.
   <Button variant="ghost" onPress={handlePress}>
     <PressableFeedback.Ripple />
     <Chip size="sm">
       <Chip.Label>Notifications</Chip.Label>
     </Chip>
   </Button>
   ```

### The workspace rule

- **When usage (1) is chosen on WEB**, the `<PressableFeedback>` root uses
  `onClick`. TypeScript enforces this — `onPress` fails TS2322 against the type
  surface.
- **When usage (1) is chosen on NATIVE**, the `<PressableFeedback>` root uses
  `onPress`. RN's `Pressable` doesn't accept `onClick`.
- **When usage (2) is chosen (any surface)**, the enclosing `<Button>` uses
  `onPress`. This matches HeroUI Pro's Button contract (React Aria-backed) and
  is uniform across web + native.
- **Never nest `<PressableFeedback>` root inside a `<Button>`.** Two nested
  interactive surfaces produce nested `<button>` elements — invalid HTML, broken
  screen-reader semantics, ambiguous keyboard focus. Pick usage (1) OR usage
  (2); never both.

### Type-system enforcement

TypeScript is the primary enforcer. The wrong choice fails typecheck:

- Web with `onPress` → TS2322
  `Property 'onPress' does not exist on type 'PressableFeedbackRootProps<"button"> & Omit<...>'`.
- Native with `onClick` → TS2322 (RN `Pressable` doesn't declare `onClick`).

`pnpm --filter='./frontend/packages/<pkg>' typecheck` catches every drift.

### Enforcement — zero-hit greps (manual-review backstop)

```sh
# Web: PressableFeedback using onPress (would fail typecheck anyway)
rg -Un '<PressableFeedback\b[^>]*(\n[^>]*)*\bonPress=' frontend/packages/*/src/react/

# Native: PressableFeedback using onClick
rg -Un '<PressableFeedback\b[^>]*(\n[^>]*)*\bonClick=' frontend/packages/*/src/native/
```

Both zero-hit. Reviewers without ripgrep can list every candidate file with
`grep -rEln '<PressableFeedback' frontend/packages/*/src/` and open each hit to
check the prop.

### Reference-correct call sites

- **Web** — every web-side call site using the `<PressableFeedback>` root
  pattern uses `<PressableFeedback onClick={...}>` per HeroUI Pro's
  `PressableFeedbackRootProps<"button">` type.
- **Native** —
  `frontend/packages/notifications/src/native/components/notification-bell/notification-bell.component.tsx:49`
  uses `<PressableFeedback onPress={...}>` correctly per RN Pressable.

## Rule — Title-Case headings, no ALL-CAPS

Design taste rule (mirrors `.kiro/agents/heroui-ui-builder.md` "Title Case
(never ALL CAPS) headings"): every heading, section label, and micro-header
renders in Title Case. Do not apply the Tailwind `uppercase` utility to
headings, `<h1..h6>`, or nav-rail category labels.

### Exemption — command-palette aesthetic in `@stackra/kbd`

The `@stackra/kbd` package (Command Palette + Keyboard Catalog) intentionally
inherits the Raycast / Linear / Shopify command-palette visual language. Three
genre conventions are locally exempt:

- **ALL-CAPS micro-headers** with `tracking-[0.08em]` on section labels + inline
  scope labels — the "SECTION NAME" pattern every command palette uses.
- **Sub-`text-xs` typography** — `text-[10px]` on `Kbd` glyphs inside the
  palette and `text-[11px]` on section headers, footer legends, count chips, and
  inline metadata. Both sizes are calibrated design values (Raycast uses 11px /
  10px for the same slots); rounding them up to `text-xs` (12px) collapses the
  palette's information density.

The exemption is package-scoped — no other `@stackra/*` package may adopt
sub-scale typography or ALL-CAPS headings. Each `text-[Xpx]` call site in
`@stackra/kbd` gets a `// kbd command-palette aesthetic` inline comment; the
uppercase spots already carry `// uppercase — kbd command-palette aesthetic`
from the P3 drift pass.

## Note — known upstream gap: `Popover` trigger + `aria-haspopup`

HeroUI's `Popover` does not stamp `aria-haspopup="dialog"` on its trigger — it
only stamps `aria-expanded` (from mount) and `aria-controls` (once open). Screen
readers still get the disclosure signal, so this is not blocking, but axe-core
and WAI-ARIA authoring practices both list `aria-haspopup` as the canonical
attribute for "this control opens a popup".

Do **not** hand-stamp `aria-haspopup="dialog"` on individual Popover triggers as
a workaround — the noise is not worth carrying until HeroUI ships the fix. Full
report + suggested upstream fix:
[`.kiro/reports/heroui-aria-haspopup-upstream-2026-07-21.md`](../reports/heroui-aria-haspopup-upstream-2026-07-21.md).

## Enforcement

- Search component `src/**/*.tsx` for bespoke class-name literals
  (`className="some-custom-name"`). Zero hits — only passthrough `className`
  variables and Tailwind layout utilities are allowed.
- Search for `<Select` in feature packages. Each hit must carry a comment
  justifying why search is undesirable; otherwise convert to `ComboBox`.
- Search for direct `@heroui/react` / `@heroui-pro/react` imports in feature
  packages. Zero hits — import through `@stackra/ui`.
- Search for `<PressableFeedback` root with an `onPress=` attribute in
  `frontend/packages/*/src/react/**/*.tsx` (web surface). Zero hits — the web
  root type does not accept `onPress` per HeroUI Pro's
  `PressableFeedbackRootProps<"button">` (TS2322). Web root uses `onClick`;
  native root uses `onPress`. See ADR-0055.

## Note — logic-only components are exempt

Components that render no UI of their own — the base error boundary
(`ErrorBoundary` from `@stackra/error`), routing wrappers (`Link`,
`StackraRouter`), head/SEO renderers (`Meta`), DI providers — have nothing to
restyle and are **not** subject to the HeroUI rule. They render `children` /
caller-provided `fallback` and own no markup. Do not delete them and do not
force HeroUI into them.

Note: the _default fallbacks_ shipped by `@stackra/error`
(`DefaultErrorFallback`, `InlineErrorFallback`) **do** render UI and so **are**
subject to the HeroUI rule — they are built on `@stackra/ui` primitives (`Card`,
`Alert`, `Button`).

## Rule — React subpath folder structure

The `react` subpath of a package mirrors the canonical `@stackra/ui` layout.
Each concern gets its own folder:

```
src/
  core/            # platform-agnostic runtime: module, services, registries,
                   # adapters, types, tokens, utils — NO web-DOM code.
    contexts/      # ONLY cross-platform React contexts (pure createContext<T>,
                   # no DOM/RN imports). Re-exported by both react + native.
    hooks/         # ONLY cross-platform React hooks that a `native` subpath
                   # ALSO consumes (pure React + @stackra/container/react,
                   # no DOM APIs). Re-exported by both react + native.
    providers/     # ONLY cross-platform Context.Provider wrappers (pure JSX,
                   # no platform-specific rendering). Re-exported by both
                   # react + native.
  react/
    components/    # HeroUI / DOM components (*.component.tsx)
    providers/     # PLATFORM-SPECIFIC React providers (subscribe to DOM
                   # events, dispatch to `window`, etc.) — rare
    contexts/      # PLATFORM-SPECIFIC createContext calls that reference
                   # DOM types in their default value — rare
    hooks/         # React hooks that call DOM APIs (default home for
                   # hooks; use core/hooks/ when cross-platform)
    interfaces/    # component/provider prop interfaces
  native/          # React Native equivalents (when present)
```

### Where does a hook / context / provider go?

The same rule applies to every pure-React entity — hooks, contexts, providers.
"Pure React" means the entity uses only React primitives (`useState`,
`useContext`, `useMemo`, `useSyncExternalStore`, `createContext`,
`Context.Provider`) plus workspace DI (`@stackra/container/react`,
`@stackra/contracts`), with NO imports from `react-native`, NO DOM globals
(`window`, `document`, `localStorage`), and NO dynamic imports of
platform-specific packages.

- **Default: `react/hooks/`, `react/contexts/`, `react/providers/`.** An entity
  that touches a DOM API OR that only the web surface needs lives in the react
  subpath.
- **Exception: `core/hooks/`, `core/contexts/`, `core/providers/`** — when the
  package has a `native` subpath AND the entity is pure React per the definition
  above. The entity lives in `core/` and both `react/index.ts` and
  `native/index.ts` re-export from `../core`. `core/index.ts` exports them too
  (the `.` entry is cross-platform).

The move to `core/` is REQUIRED — not optional — for a cross-platform entity.
Duplicating a pure-React file into both `react/` and `native/` is a review-
blocking finding: the two copies drift, and the fix (native → react re-export)
is forbidden by `subpath-layering.md`. `core/` is the escape hatch.

**Reference implementation:** `@stackra/zones` composes every cross-platform
entity from `core/` (context, provider, `useZone`, `useZoneContext`) and
reserves `react/` + `native/` for the platform-specific `<Zone>` /
`<FormFieldZone>` / `<TableColumnZone>` components + `renderContribution`
utility. See `frontend/packages/zones/src/core/`.

Example (CSP): `NonceProvider` → `react/providers/nonce/nonce.provider.tsx`
(web-only — the provider reads a DOM meta tag); `NonceContext` →
`react/contexts/nonce.context.ts`; `useNonce` → `react/hooks/use-nonce.hook.ts`.
CSP has no `native/` subpath so the react-only home is correct.

## Enforcement

- Search `react/components/**` for files exporting a `createContext` provider
  (`*.provider.tsx` under components). Zero hits — move to `react/providers/` or
  `core/providers/` per the rule above.
- For any package with both `react/` and `native/` subpaths: same relative file
  path (`hooks/use-x/use-x.hook.ts`, `contexts/x.context.ts`,
  `providers/x/x.provider.tsx`) MUST NOT exist under both. Zero hits — either
  the entity is pure React (hoist to `core/`) or it's platform-specific (keep
  only one copy in the subpath that needs it).
- A `core/hooks/`, `core/contexts/`, `core/providers/` folder is allowed ONLY
  when a `native/` subpath exists and re-exports the folder's contents (or ships
  identical shapes that consume the folder's types). Otherwise the entities
  belong in `react/`.
