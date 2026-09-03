---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/ui"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/theming", "@stackra/i18n", "@stackra/router", "@stackra/navigation"]
---
# `@stackra/ui` — implementation plan

## Purpose
Shared accessible UI primitives and composition contracts for web/native/desktop applications. Product applications own screens and domain-specific UX. UI consumes `@stackra/theming` and `@stackra/i18n` and never imports business services.

## Component families
`primitives`, `forms`, `layout`, `overlay`, `feedback`, `navigation-adapters`, `data-display`, `accessibility`.

## Public API
```ts
interface UiComponentProps { testId?:string; disabled?:boolean; ariaLabel?:string; }
interface FieldController<T> { value:T; error?:string; touched:boolean; setValue(value:T):void; setTouched(value:boolean):void; }
interface OverlayManager { open(id:string,props?:unknown):void; close(id:string):void; closeTop():void; subscribe(handler:(state:OverlayState)=>void):()=>void; }
interface FocusManager { trap(root:Element):Disposable; restore():void; }
```

Components expose typed props and controlled/uncontrolled behavior explicitly. Styling is token-driven; arbitrary global CSS mutation is prohibited.

## Source tree
```text
packages/ui/
├── src/core/{component,props,composition,refs,errors,index.ts}
├── src/primitives/{box,text,icon,button,link,image,divider,index.ts}
├── src/forms/{field,input,select,checkbox,switch,date-picker,index.ts}
├── src/layout/{stack,grid,container,scroll,index.ts}
├── src/overlay/{dialog,drawer,popover,toast,menu,index.ts}
├── src/feedback/{alert,spinner,skeleton,empty-state,error-state,index.ts}
├── src/data-display/{table,list,badge,progress,index.ts}
├── src/accessibility/{focus,aria,keyboard,live-region,index.ts}
├── src/runtime/{browser,native,desktop,index.ts}
├── src/testing/{render-fixture,a11y-fixture,user-events,index.ts}
└── __tests__/{unit,integration,accessibility,conformance}/
```

## Theming/i18n
Every visual token resolves through `@stackra/theming`; hard-coded semantic colors/spacing are prohibited where tokens exist. Text/content formatting uses `@stackra/i18n`. Direction changes and RTL layout must be supported without component-specific global hacks.

## Accessibility contract
Keyboard/focus behavior, accessible names/roles/states, reduced motion and high-contrast variants are explicit for relevant components. Interactive components must be operable without pointer input. Focus restoration after overlays is deterministic.

## Security
User-provided text/HTML is escaped/sanitized. Raw HTML rendering is an explicit restricted component with a trusted-content contract. URLs pass through `@stackra/link`. Sensitive values are not put into DOM attributes unless explicitly required.

## Runtime behavior
Browser uses DOM adapters; native/desktop use platform primitives. Components expose capability-safe fallbacks and never pretend unsupported browser/native APIs are available. Runtime differences live under adapters.

## State/lifecycle
UI components own ephemeral presentation state only. Durable state, server cache, synchronization and business commands belong to service clients/application state/`@stackra/sync`. Every subscription/listener/timer has cleanup semantics.

## Performance
Large lists require virtualization/pagination policies. Components avoid unnecessary rerenders via stable props/context. Animations respect reduced-motion preference. No uncontrolled DOM measurement loops or unbounded event buffers.

## Observability
Testing IDs are supported without exposing sensitive production data. UI telemetry is opt-in and uses aggregate component/event identifiers rather than field contents. Error boundaries use safe serialized errors.

## Testing
Component behavior; keyboard navigation; focus management; ARIA semantics; responsive/layout variants; localization/RTL; dark/high-contrast themes; controlled/uncontrolled forms; overlay stacking; runtime conformance; security sanitization.

## Implementation phases
1. Core composition/accessibility contracts.
2. primitives/forms/layout.
3. overlays/feedback/data display.
4. theming/i18n/runtime integration.
5. accessibility/security/performance testing and release.

## Exit criteria
- All shared components are typed and accessible.
- No business service dependency exists.
- Theme/i18n ownership is centralized.
- User content cannot become executable markup by default.
- Browser/native/desktop adapters pass conformance tests.
