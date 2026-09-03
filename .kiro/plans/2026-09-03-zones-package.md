---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://zones-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/zones` — extensibility slots (Zone + FormFieldZone + TableColumnZone)

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/zones/` (`@stackra/zones` v0.1.0) **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/support` (BaseRegistry),
`react` + `react-native` (optional peers) **Design effort:** 14 days across 7
phases

## Purpose

Runtime extensibility for React + RN apps — plugin packages contribute
components / form-fields / table-columns to named "zones" declared by host apps.
Ships:

- `ZoneRegistry` — DI-owned registry of contributions per zone.
- `<Zone id="header.right">` — React + RN renderer that mounts every
  contribution.
- `<FormFieldZone form="user.create" section="admin">` — form-field zone w/
  order + conditional visibility.
- `<TableColumnZone table="users.index">` — dynamic table columns.
- Pure `resolveZoneOrder(contributions, opts)` — deterministic ordering
  algorithm w/ `weight` + `after` + `before` constraints.

This is the workspace's answer to "how do plugin packages add UI without the
host knowing about them?" Every registered contribution goes through the same
resolution pipeline; consumers never touch the registry directly.

## Non-goals

- Server-side rendering — zones resolve on the client; SSR would need a
  hydration protocol (out of scope for v1).
- Cross-app zone sharing — every app has its own registry instance; zones don't
  bleed across mounted micro-frontends.
- Route contribution — that's `@stackra/routing` (future); zones are UI
  slot-level, not route-level.

## Public API — locked

### `@Zone` decorator

```typescript
@Zone({
  target: "header.right",   // ← the named zone
  weight: 10,                // ← lower renders first
  after: "notifications",    // ← position after another contribution's id
  when: (ctx) => ctx.user?.role === "admin",  // ← conditional visibility
})
class AdminBadgeZone {
  render(props: IZoneRenderProps): ReactNode {
    return <Badge>Admin</Badge>;
  }
}
```

The registrar picks up every `@Zone`-decorated class at bootstrap.

### `<Zone />` component

```tsx
import { Zone } from "@stackra/zones/react";

function AppHeader() {
  return (
    <header>
      <Logo />
      <Zone id="header.right" context={{ user }} />
    </header>
  );
}
```

Renders every registered contribution for `header.right`, ordered per
`resolveZoneOrder(...)`. Each contribution receives `props: { context, id }`.

### `<FormFieldZone />` component

```tsx
<FormFieldZone
  form="user.create"
  section="admin"
  onFieldsResolved={(fields) => setFields(fields)}
/>
```

Plugins contribute form fields:

```typescript
@FormField({
  form: "user.create",
  section: "admin",
  name: "internalNotes",
  weight: 100,
  after: "email",
})
class InternalNotesField {
  render({ form, name }: IFormFieldRenderProps): ReactNode {
    return <TextField name={name} label="Internal Notes" />;
  }
  validate(value: unknown): string | null { ... }
}
```

### `<TableColumnZone />` component

```tsx
<TableColumnZone
  table="users.index"
  onColumnsResolved={(cols) => setColumns(cols)}
/>
```

Plugins contribute columns:

```typescript
@TableColumn({
  table: "users.index",
  key: "lastLogin",
  header: "Last Login",
  weight: 90,
  render: (row) => <RelativeTime value={row.lastLoginAt} />,
})
class LastLoginColumn {}
```

### `resolveZoneOrder(...)` pure function

The canonical ordering algorithm. Deterministic, cycle-detecting, side-effect
free. Every renderer calls it:

```typescript
resolveZoneOrder(contributions, {
  context: { user },       // for `when()` filtering
  stableSort: true,        // preserves insertion order on tie
}): ISortedContribution[];
```

Constraints resolved in order:

1. Filter by `when(ctx)` predicate.
2. Topological sort by `after` / `before` (cycle → drop the last edge + warn).
3. Break ties by `weight` (ascending — 0 first).
4. Break ties by insertion order (stable).

## Subpath layout

```
packages/zones/
├── package.json                          # 4 subpath exports
├── src/
│   ├── core/                             # ".": platform-agnostic
│   │   ├── zones.module.ts
│   │   ├── registries/
│   │   │   ├── zone.registry.ts
│   │   │   ├── form-field.registry.ts
│   │   │   └── table-column.registry.ts
│   │   ├── services/
│   │   │   ├── zone-loader.service.ts    # OnApplicationBootstrap discovery
│   │   │   └── contribution-resolver.service.ts
│   │   ├── decorators/
│   │   │   ├── zone.decorator.ts
│   │   │   ├── form-field.decorator.ts
│   │   │   └── table-column.decorator.ts
│   │   ├── constants/
│   │   │   ├── zone-metadata-key.const.ts
│   │   │   └── default-weight.const.ts
│   │   ├── errors/
│   │   │   ├── unknown-zone.error.ts
│   │   │   ├── cyclic-order.error.ts
│   │   │   └── duplicate-contribution.error.ts
│   │   ├── interfaces/
│   │   │   ├── zone-contribution.interface.ts
│   │   │   ├── form-field-contribution.interface.ts
│   │   │   ├── table-column-contribution.interface.ts
│   │   │   └── zone-context.interface.ts
│   │   ├── utils/
│   │   │   ├── resolve-zone-order.util.ts
│   │   │   ├── topological-sort.util.ts
│   │   │   └── stable-sort.util.ts
│   │   └── index.ts
│   ├── react/                            # "./react"
│   │   ├── components/
│   │   │   ├── zone.component.tsx
│   │   │   ├── form-field-zone.component.tsx
│   │   │   └── table-column-zone.component.tsx
│   │   ├── contexts/
│   │   │   └── zones.context.ts
│   │   ├── hooks/
│   │   │   ├── use-zone.hook.ts
│   │   │   ├── use-form-fields.hook.ts
│   │   │   └── use-table-columns.hook.ts
│   │   ├── providers/
│   │   │   └── zones.provider.tsx
│   │   └── index.ts
│   ├── native/                           # "./native"
│   │   ├── components/                   # RN equivalents
│   │   │   ├── zone.component.tsx
│   │   │   └── form-field-zone.component.tsx
│   │   ├── hooks/                        # same shapes as ./react
│   │   └── index.ts
│   └── testing/
│       ├── mock-zone-registry.ts
│       ├── assert-zone-order.ts
│       └── index.ts
└── __tests__/
    └── unit/                             # 20+ files
```

## Contribution constraints

```typescript
interface IZoneContribution {
  id: string; // unique per zone
  weight?: number; // default 100
  after?: string; // must render after this id
  before?: string; // must render before this id
  when?: (ctx: IZoneContext) => boolean; // conditional visibility
  hidden?: boolean; // programmatic hide
  render(props: IZoneRenderProps): ReactNode | RN.ReactNode;
}
```

Cycle detection: if `after` / `before` produces a cycle, `resolveZoneOrder`
drops the last edge participating in the cycle + emits a dev-mode warning via
`@stackra/logger` (fail-soft rather than throwing — one bad plugin shouldn't
break the app).

## Runtime discovery

`ZoneLoader implements OnApplicationBootstrap` — scans every provider carrying
the zone metadata symbols (`@Zone` / `@FormField` / `@TableColumn`) + registers
each in the appropriate registry. Follows ADR-0092 auto-registration.

## Phases

### Phase 1 — Scaffold + resolveZoneOrder (2 days)

- [ ] Package skeleton.
- [ ] `resolveZoneOrder(...)` — pure fn w/ topological sort + cycle detection.
- [ ] Unit tests for every ordering permutation.

### Phase 2 — Registries (2 days)

- [ ] `ZoneRegistry`, `FormFieldRegistry`, `TableColumnRegistry`.
- [ ] Duplicate-id detection.
- [ ] `.subscribe(handler)` for HMR + dynamic re-registration.

### Phase 3 — Decorators + loader (2 days)

- [ ] `@Zone`, `@FormField`, `@TableColumn` decorators.
- [ ] `ZoneLoader` at bootstrap.

### Phase 4 — React bindings (3 days)

- [ ] `<Zone />` component.
- [ ] `<FormFieldZone />` w/ `onFieldsResolved` callback.
- [ ] `<TableColumnZone />` w/ same shape.
- [ ] `useZone(id)`, `useFormFields(form, section)`, `useTableColumns(table)`
      hooks.

### Phase 5 — RN bindings (2 days)

- [ ] Same shape as React w/ RN components.
- [ ] Verify Expo Router compat (deep-linked screens).

### Phase 6 — Testing (2 days)

- [ ] Unit tests for every registry + decorator + hook.
- [ ] Integration test — plugin contributes a zone; host renders it; hidden by
      `when()` predicate; visible after context change.
- [ ] `MockZoneRegistry` + `assertZoneOrder(zoneId, expected)` matcher.

### Phase 7 — Verification + docs (1 day)

- [ ] Reference example — a demo plugin contributes to `header.right`, renders
      correctly.
- [ ] README documents every decorator + a "your first zone contribution"
      walkthrough.
- [ ] Cross-refs to consumer patterns (multi-package Nx-workspace, plugin
      catalog).

## Exit criteria

- [ ] `resolveZoneOrder` handles every ordering permutation (11+ permutations
      tested).
- [ ] Cyclic constraints don't crash — warned + one edge dropped.
- [ ] `@Zone` / `@FormField` / `@TableColumn` auto-discover on Nest bootstrap.
- [ ] `<Zone>` renders every contribution in the right order.
- [ ] `when()` filters correctly when context changes (verified in React test).
- [ ] RN parity verified on Expo Router.
- [ ] 95% branch coverage.

## Cross-refs

- `.ref/packages/zones/` — reference implementation.
- `@stackra/container` — DI foundation.
- `@stackra/settings` — extension point for admin UI (settings-tab plugin).
- Plugin architecture — every workspace plugin that contributes UI uses this.
