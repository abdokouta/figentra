---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/kbd'
---
# `@stackra/kbd` — Keyboard and Command Surface Capability

## Boundary
Cross-platform keyboard shortcut registry for React/desktop web applications. It normalizes key chords, scopes commands to UI surfaces, resolves conflicts and exposes accessible help UI. It does not own business commands; handlers invoke typed application commands.

## Subpaths
```text
@stackra/kbd
@stackra/kbd/react
@stackra/kbd/desktop
@stackra/kbd/testing
```

## Public API
```ts
interface Shortcut { id:string; keys:string; command:string; scope:string; when?:Condition; priority?:number; }
interface KeyboardManager { register(shortcut:Shortcut):Disposable; enableScope(scope:string):void; dispatch(event:KeyboardEventLike):boolean; list(scope?:string):readonly Shortcut[]; }
```

## Behavior
Normalize platform differences (`Meta`/`Ctrl`), compose scopes, avoid hijacking editable fields unless explicit, support chord sequences, conflict detection and user-configurable shortcuts. Commands must be typed IDs, not arbitrary code strings.

## Accessibility/testing
Every registered command can expose label/category for shortcut help. Test browser/native/desktop modifier behavior, IME/editable-field handling, conflicts, scope activation, key repeat and accessibility.
