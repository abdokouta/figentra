# Dashboard widget contributions

Rules for how a workspace `@stackra/*` package contributes widgets to the
`@stackra/dashboard` runtime. This is the frontend counterpart to how backend
service modules contribute domain rows — one canonical contribution entry, one
canonical registration path, no drift.

Read alongside:

- `.kiro/steering/module-lifecycle.md` — inline `@Injectable()` registrar
  classes + when `OnApplicationBootstrap` fires.
- `.kiro/steering/subpath-layering.md` — why widget classes live in
  `src/react/widgets/` (React runtime is a `react` subpath concern).
- `.kiro/steering/code-standards.md` — folder-per-thing + barrel discipline.
- `.kiro/steering/discovery-vs-loader.md` — how `WidgetLoader` auto-picks up
  decorated classes from the DI graph.

## Precedence

1. This file wins over generic guidance when they differ.
2. When this file and a package-specific README disagree, this file wins.

## Rule 1 — one contribution path: the `@Widget` decorator

**Every widget is a class decorated with `@Widget({...})` that extends
`BaseWidget`.** There is no `defineWidget()` helper, no config-only
contribution, no runtime-only renderer swap for a widget that doesn't also have
a `@Widget` class. Pick one lane, stay in it.

```typescript
// frontend/packages/notifications/src/react/widgets/kpi-unread-notifications/kpi-unread-notifications.widget.tsx
import { BaseWidget, Widget } from "@stackra/dashboard";
import type { IWidgetRendererContext } from "@stackra/dashboard";
import { Inject } from "@stackra/container";
import type { ReactNode } from "react";

import { NOTIFICATION_CENTRE } from "@stackra/contracts";
import type { INotificationCentre } from "@stackra/contracts";

@Widget({
  key: "kpi-unread-notifications",
  cohort: "activity",
  title: "Unread notifications",
  description: "Count of unread notifications for the current user.",
  icon: "bell",
  span: "third",
})
export class KpiUnreadNotificationsWidget extends BaseWidget {
  public constructor(
    @Inject(NOTIFICATION_CENTRE) private readonly centre: INotificationCentre,
  ) {
    super();
  }

  public render(_context: IWidgetRendererContext): ReactNode {
    const count = this.centre.unreadCount();
    return <KpiCard label="Unread" value={count} icon="bell" />;
  }
}
```

Why decorator-only:

- The class is the single source of truth for metadata + renderer.
- The class is DI-scoped — inject services in the constructor.
- The class supports lifecycle hooks (`OnModuleInit` for cache warmup,
  `OnApplicationBootstrap` for cross-module coordination).
- `WidgetLoader` auto-discovers via
  `DISCOVERY_SERVICE.getProvidersByMetadata(WIDGET_METADATA_KEY)` — no manual
  registration, no drift.

## Rule 2 — widget classes live under `src/react/widgets/<key>/`

The React runtime is a `react` subpath concern. Each widget is a
folder-per-thing under `src/react/widgets/<kebab-key>/`:

```
frontend/packages/<pkg>/src/react/widgets/
├── kpi-unread-notifications/
│   ├── kpi-unread-notifications.widget.tsx
│   └── index.ts                          ← barrel — exports the class
├── list-recent-notifications/
│   ├── list-recent-notifications.widget.tsx
│   └── index.ts
└── index.ts                              ← barrel — re-exports every widget folder
```

Rules:

- Filename ends with `.widget.tsx` (kebab-case stem matching the key).
- Class name is `PascalCase` + `Widget` suffix (`KpiUnreadNotificationsWidget`).
- Widget key is **namespaced by domain prefix** so 17 packages don't all fight
  for `kpi-count`: `kpi-unread-notifications`, `list-active-collaborators`,
  `chart-lead-sources`.
- The `<name>.widget.tsx` file exports the class only. Rendering helper
  utilities (label maps, chart config) live in the same folder as
  `<name>.util.ts` files.

## Rule 3 — `WebXModule.forRoot()` wires widgets via `forFeature`

Each feature package's `WebXModule.forRoot(...)` includes
`DashboardModule.forFeature({ widgets: [...] })` in its `imports`. Widget
classes are added to the array as they're authored.

```typescript
// frontend/packages/notifications/src/react/web-notification.module.ts
import { Module, type DynamicModule } from "@stackra/container";
import { DashboardModule } from "@stackra/dashboard";
import { RoutingModule } from "@stackra/routing";

import { NotificationModule } from "@/core/notification.module";

import {
  KpiUnreadNotificationsWidget,
  ListRecentNotificationsWidget,
} from "./widgets";

@Module({})
export class WebNotificationModule {
  public static forRoot(options: IWebNotificationModuleOptions = {}): DynamicModule {
    return {
      module: WebNotificationModule,
      global: true,
      imports: [
        NotificationModule.forRoot(coreOptions),
        RoutingModule.forFeature({ name: "notifications", routes: [...] }),
        DashboardModule.forFeature({
          widgets: [
            KpiUnreadNotificationsWidget,
            ListRecentNotificationsWidget,
          ],
        }),
      ],
      exports: [NotificationModule],
    };
  }
}
```

`DashboardModule.forFeature` accepts:

- **`widgets: Type<BaseWidget>[]`** — the decorated classes. The container
  instantiates each once, the widget loader auto-discovers them at
  `OnApplicationBootstrap`.
- **`cohorts?: IWidgetCohortEntry[]`** — plain-data cohort seeds for packages
  that introduce a brand-new cohort key (rare — see Rule 5). Seeded through an
  inline `@Injectable() DashboardCohortRegistrar` class implementing
  `OnApplicationBootstrap` per ADR-0052 §Canonical shape.
- **`renderers?: Record<string, WidgetRenderer>`** — renderer-only overrides for
  consumers that want to white-label an existing widget's rendering without
  changing its catalogue entry.

## Rule 4 — `@stackra/dashboard` is an optional peer

Every package that contributes widgets declares `@stackra/dashboard` as an
**optional peer** so consumers who only want the domain runtime (non-dashboard
apps) don't pay for the widget-loading graph.

```jsonc
// frontend/packages/<pkg>/package.json
{
  "peerDependencies": {
    "@stackra/dashboard": "workspace:^",
  },
  "peerDependenciesMeta": {
    "@stackra/dashboard": { "optional": true },
  },
  "devDependencies": {
    "@stackra/dashboard": "workspace:*",
  },
}
```

The static `import { DashboardModule } from "@stackra/dashboard"` at the top of
`WebXModule` means a consumer who imports the module MUST have the peer
installed — but a consumer that only imports the core module
(`XModule.forRoot(...)` without `Web`) can skip it. Optional- peer semantics let
pnpm/npm suppress the warning for that case.

## Rule 5 — cohort key discipline

Every widget's `cohort` MUST be one of the canonical values in the
`WidgetCohort` union. The canonical set today:

- `onboarding` — get-started checklists, empty-state guides
- `kpi` / `numbers` — single-metric cards
- `charts` — time-series, distributions
- `calendar` — sessions, matches, events on a timeline
- `activity` — recent-action feeds, notifications
- `people` — athletes, coaches, family activity
- `revenue` / `money` — commercial metrics
- `operations` — capacity, alerts, system health
- `compliance` — safeguarding, credentials, consents
- `access` — RBAC / grants / delegations / invitations / access-requests
- `ai` — assistant suggestions, token usage
- `custom` — user-authored fallback

**Adding a new cohort requires editing three files** in `@stackra/dashboard`:

1. `core/types/widget-cohort.type.ts` — union member
2. `core/constants/widget-cohorts.constants.ts` — default seed entry
3. `core/constants/cohort-labels.constants.ts` — human label

Feature packages **must NOT invent cohort keys** without landing all three edits
in the same PR. Registering an unknown cohort key from `forFeature` will throw
at bootstrap time.

## Rule 6 — widget key naming

- `kpi-<name>` — single-metric cards (`kpi-unread-notifications`)
- `list-<name>` — list-style widgets (`list-recent-registrations`)
- `chart-<name>` — chart widgets (`chart-attendance-30d`)
- `board-<name>` — Kanban-style (`board-pipeline`)
- `agenda-<name>` — calendar-style (`agenda-week`)
- `people-<name>` — person-oriented lists (`people-birthdays`)
- `onboarding-<name>` — onboarding widgets
- `stat-<name>` — grouped stat tiles

Every key MUST match `WIDGET_KEY_PATTERN` (kebab-case, starts with a letter).
Violations throw `InvalidWidgetMetadataError` at class-load time.

## Rule 7 — permission gating

Widgets that read protected data set the `permission` field on the `@Widget()`
decorator. The catalogue drawer hides gated widgets from users who don't hold
the permission; `DashboardService.hasPermission()` runs the check.

```typescript
@Widget({
  key: "kpi-revenue-mtd",
  cohort: "revenue",
  title: "Revenue MTD",
  description: "Month-to-date revenue in the active currency.",
  icon: "circle-dollar",
  span: "third",
  permission: "revenue.view",  // ← gated
})
export class KpiRevenueMtdWidget extends BaseWidget { … }
```

## Rule 8 — no `defaultEnabled: true` outside built-in dashboards

Feature packages that ship `@Widget()` classes SHOULD NOT set
`defaultEnabled: true`. Only the canonical Overview + Analytics dashboards ship
with widgets pre-selected. Every other contribution lives in the catalogue
drawer until a user explicitly adds it.

Exception: an onboarding widget for a first-run experience MAY set
`defaultEnabled: true` when the whole package is behind an explicit opt-in
tenant flag.

## Enforcement

Zero-hit greps a reviewer runs before merging a widget contribution:

- **Widget files outside `src/react/widgets/`** — every widget class ships under
  this folder.
- **Non-`.widget.tsx` extension on a `@Widget`-decorated class** — every widget
  file uses the canonical suffix.
- **Unnamespaced widget key** — every key MUST include the package domain prefix
  (`kpi-unread-notifications`, never `kpi-unread`).
- **Class name missing `Widget` suffix** — every class ends in `Widget`.
- **`defineWidget` / `registerWidget` call sites in feature packages** — we're
  decorator-only; a call site is a violation.

## Anti-patterns

| Anti-pattern                                                                | Correct                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------- |
| `defineWidget({...})` in a feature package                                  | `@Widget({...})` class extending `BaseWidget`       |
| Widget class under `src/react/components/`                                  | Under `src/react/widgets/<key>/`                    |
| Widget key `kpi-count` (no namespace)                                       | `kpi-active-users` / `kpi-open-tickets`             |
| Cohort key `analytics` (not in union)                                       | `charts` or land the cohort in dashboard first      |
| Renderer registered via `WidgetRendererRegistry.register()` in feature code | Class-based registration via `@Widget`              |
| `defaultEnabled: true` on a non-onboarding widget                           | `false` (default) — user opts in from the catalogue |

## Retrofit note

Every `@stackra/*` package that could contribute widgets already scaffolds an
empty `DashboardModule.forFeature({ widgets: [] })` in its `WebXModule.forRoot`.
Populating that array with concrete `@Widget` classes is the next step per
package.

Empirical count as of 2026-07-26: **15 packages** carry the empty scaffold —
`access-requests`, `actions`, `ai`, `analytics`, `collaboration`, `consent`,
`delegation`, `grants`, `invitations`, `monitoring`, `network`, `queue`, `rbac`,
`scheduler`, `sync` (verified via
`grep -rE 'DashboardModule\.forFeature\(\{ widgets: \[\] \}\)' frontend/packages/*/src/react/*.module.ts`).
The audit's original CROSS-014 finding named 7 packages; the pattern propagated
wider through subsequent Wave-3 sweeps.

The empty scaffold is NOT a pass-through violation of
`.kiro/steering/subpath-layering.md` §"Forbidden — pass-through module". A
dedicated exception under
[§"Accepted exception — empty widget-scaffold `forFeature`"](./subpath-layering.md#accepted-exception--empty-widget-scaffold-forfeature)
in that steering file names the pattern as codified. Read the exception
alongside this rule so both invariants stay in the reader's face:

- The `Web<Pkg>Module` composes `XModule.forRoot(options)` PLUS
  `DashboardModule.forFeature({ widgets: [] })` — the composition is the future
  extension point.
- The empty-widgets branch is a no-op — the seed loader special-cases
  `widgets.length === 0` and returns early.
- `@stackra/dashboard` is an optional peer; consumers who never mount a
  dashboard shell tree-shake the empty scaffold out of their bundle.
- The exception applies ONLY to `DashboardModule.forFeature({ widgets: [] })`.
  Empty `RoutingModule.forFeature({ routes: [] })` scaffolds are still
  pass-through violations and must be deleted until real routes land.
- A `Web<Pkg>Module` whose ONLY contribution is the empty widget scaffold is
  still a pass-through — add a real Shape-1 binding or delete the module.
