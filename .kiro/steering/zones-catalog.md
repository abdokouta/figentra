# Zones — workspace catalog convention

Rules for how every `@stackra/*` package that ships pages / composite components
declares zone slots, and how packages that want to inject into another package's
zone reference them.

Read alongside:

- [`events-authoring.md`](events-authoring.md) — parallel pattern for event
  catalogues; zones follow the same ownership + docblock discipline.
- [`module-lifecycle.md`](module-lifecycle.md) — the inline `@Injectable()`
  registrar-class pattern (ADR-0052) that every zone contribution routes
  through.
- [`subpath-layering.md`](subpath-layering.md) §"Where does a hook / context /
  provider go?" — zone constants + the `<Zone>` runtime entities live
  cross-platform under `core/` when both `react/` and `native/` consume them.
- [`contract-reexports.md`](contract-reexports.md) — zone constants live in
  their OWNING package, never in `@stackra/contracts`.
- [`ui-components.md`](ui-components.md) — the HeroUI composition rules zone
  components + injected contributions still follow.
- [`dashboard-widgets.md`](dashboard-widgets.md) — the specialised zone shape
  for dashboard widgets already in production; the general zone system codified
  here follows the same discipline.

## Precedence

1. This file wins over generic zone / slot guidance.
2. When this file and package-level READMEs disagree, this file wins.
3. Cross-references above take precedence for their specific concerns (event
   catalogues → `events-authoring.md`; registrar classes →
   `module-lifecycle.md`).

## The three concerns

Every zone has three moving parts:

1. **The DECLARATION** — a constant in the owning package that names the zone.
2. **The EXPOSURE** — the owning package wraps a JSX region in
   `<Zone id={PKG_ZONES.X} intrinsic={[...]}>`.
3. **The CONTRIBUTION** — another package registers an `IZoneContribution`
   targeting the zone through its own `WebXModule.forFeature({ zones })` per
   ADR-0052.

The rules below govern all three.

## Rule 1 — zone identifiers are constants, never inline strings

Every zone identifier lives as a `const` value inside its owning package.
`<Zone>` renderers + `IZoneContribution.zone` registrations import the constant.
Raw string literals at call sites are a review-blocking finding.

```typescript
// ❌ WRONG — inline string, no compile-time check, drift-prone.
<Zone id="rbac.role.detail.sidebar">
  <AuditTrailPanel id="audit" />
</Zone>

// ❌ WRONG — inline string in a contribution.
registry.register({
  id: "grants.role-detail.grants-carrying",
  zone: "rbac.role.detail.sidebar",
  kind: "react",
  component: GrantsCarryingRolePanel,
});

// ✅ RIGHT — import the constant from @stackra/contracts.
import { RBAC_ZONES } from "@stackra/contracts";

<Zone id={RBAC_ZONES.ROLE_DETAIL_SIDEBAR}>
  <AuditTrailPanel id="audit" />
</Zone>

registry.register({
  id: "grants.role-detail.grants-carrying",
  zone: RBAC_ZONES.ROLE_DETAIL_SIDEBAR,
  kind: "react",
  component: GrantsCarryingRolePanel,
});
```

## Rule 2 — every zone constant lives in `@stackra/contracts`

Zone identifiers live in `frontend/packages/contracts/src/zones/<pkg>.zones.ts`,
NOT in the owning package's own `core/`. Every consumer — the owning package
that renders `<Zone>` AND every injecting package — imports from
`@stackra/contracts`.

Rationale — this deliberately flattens the peer-dep graph:

- **Every workspace package already declares `@stackra/contracts` as a required
  peer.** No new peer-deps needed for cross-package injection. A package
  injecting into another's zone does NOT need to peer-depend on the owning
  package just to import a string constant.
- **The zone catalog mirrors the events catalog.** `contracts/src/events/`
  already ships one `<pkg>.events.ts` per package; zones follow the exact same
  layout under `contracts/src/zones/`.
- **Contracts is where the cross-package vocabulary lives.** `IZoneRegistry`,
  `IZoneContribution`, `IZoneContext`, `ZonePosition`, `ZONE_REGISTRY` are
  already there. The zone identifiers complete the vocabulary. Every side of a
  zone injection reads the same file.
- **Cross-package injection graph** is documented in
  `.kiro/plans/zones-workspace-inventory.md`.

## Rule 3 — the constant file lives under `contracts/src/zones/`

```
frontend/packages/contracts/src/
  zones/
    access-requests.zones.ts    ← ACCESS_REQUESTS_ZONES + AccessRequestsZoneId
    auth-ui.zones.ts            ← AUTH_UI_ZONES + AuthUiZoneId
    dashboard.zones.ts          ← DASHBOARD_ZONES + DashboardZoneId
    delegation.zones.ts         ← DELEGATION_ZONES + DelegationZoneId
    grants.zones.ts             ← GRANTS_ZONES + GrantsZoneId
    invitations.zones.ts        ← INVITATIONS_ZONES + InvitationsZoneId
    notifications.zones.ts      ← NOTIFICATIONS_ZONES + NotificationsZoneId
    rbac.zones.ts               ← RBAC_ZONES + RbacZoneId
    settings.zones.ts           ← SETTINGS_ZONES + SettingsZoneId
    index.ts                    ← barrel — re-exports every constant + type
```

One `<pkg>.zones.ts` per UI-shipping package. `contracts/src/index.ts`
re-exports the `zones/` barrel so
`import { RBAC_ZONES } from "@stackra/contracts"` works flat.

Location rationale:

- Zone identifiers are semantic strings — no DOM, no react-native, no React.
  They belong in the runtime-neutral contracts package.
- Contracts already ships to every consumer via the required peer contract —
  this is the only import path that doesn't force new peer-deps.
- Both web (`react/`) and native (`native/`) surfaces of the owning package
  resolve the same constant from contracts — zero cross-subpath re-export
  needed.

## Rule 4 — naming schema — `<domain>.<surface>.<slot>`

Zone identifiers are dotted lowercase strings following the pattern
`<domain>.<surface>.<slot>[.<sub>]`:

| Segment     | Meaning                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `<domain>`  | The owning package's domain slug — matches the package name (`rbac`).      |
| `<surface>` | The page / view / composite the zone lives in (`role.detail`, `list`).     |
| `<slot>`    | The extension point on that surface (`sidebar`, `toolbar`, `row.actions`). |
| `<sub>`     | Optional sub-position when the slot has recognizable regions.              |

Examples of good identifiers:

- `rbac.role.detail.sidebar`
- `rbac.role.detail.header.actions`
- `rbac.roles.list.toolbar`
- `rbac.roles.list.row.actions`
- `settings.hub.sections`
- `settings.group.field.before-name` — sub-position within a form
- `invitations.accept.after-form`
- `dashboard.home.widgets` — the widget slot (see
  [`dashboard-widgets.md`](dashboard-widgets.md))
- `notifications.preferences.groups`

Bad identifiers:

- `RbacRoleDetailSidebar` — PascalCase (use dotted lowercase).
- `roleDetailSidebar` — camelCase (same).
- `role-detail-sidebar` — kebab-case without dotted domain (same).
- `rbac.role_detail_sidebar` — snake_case within segments (use kebab when a
  segment is multi-word: `row.actions`, not `rowActions` or `row_actions`).
- `rbac.settings.role.detail.sidebar` — leading package chain duplicates the
  domain root (the domain segment IS the package).

Multi-word segments use kebab-case: `dashboard.home.top-row`, not
`dashboard.home.topRow` or `dashboard.home.top_row`.

## Rule 5 — one constants file per package, under contracts

Every package that owns at least one zone ships EXACTLY ONE `<pkg>.zones.ts`
file at `frontend/packages/contracts/src/zones/<pkg>.zones.ts`. The file exports
a single frozen constant object + its literal-union type:

```typescript
// frontend/packages/contracts/src/zones/rbac.zones.ts

/**
 * @file rbac.zones.ts
 * @module @stackra/contracts/zones
 * @description Canonical zone identifiers owned by `@stackra/rbac`.
 *
 *   Every `<Zone id="rbac.*">` rendered by the package + every
 *   `IZoneContribution.zoneId` that targets an rbac zone MUST
 *   import from this file. Raw string literals are a review-
 *   blocking finding per `.kiro/steering/zones-catalog.md` §Rule 1.
 *
 *   Discovery docblocks below name every emitter + every current
 *   contribution per Rule 6.
 */

export const RBAC_ZONES = {
  /**
   * Right-hand sidebar on the role detail page.
   *
   * ## Emitters
   * - `<RoleDetailPage>` in
   *   `frontend/packages/rbac/src/react/pages/role-detail-page/`.
   *
   * ## Current contributions
   * - `@stackra/grants` — "Grants carrying this role" panel
   *   (id: `grants.role-detail.grants-carrying`, position:
   *   `"start"`).
   * - `@stackra/delegation` — "Delegations of this role"
   *   (id: `delegation.role-detail.delegations`, position:
   *   `"after"`, anchor: `grants.role-detail.grants-carrying`).
   * - `@stackra/access-requests` — "Pending requests targeting
   *   this role" (id: `access-requests.role-detail.pending`,
   *   position: `"end"`).
   *
   * ## Intrinsic children (host-rendered defaults)
   * - `audit-trail` — audit-log panel for the role.
   * - `usage-stats` — count of users + tokens carrying the role.
   *
   * ## Context predicates
   * Contributions receive `IZoneContext` with
   * `params: { roleId, applicationId }`.
   */
  ROLE_DETAIL_SIDEBAR: "rbac.role.detail.sidebar",

  /**
   * Header action bar on the role detail page.
   *
   * ## Emitters
   * - `<RoleDetailPage>`.
   *
   * ## Current contributions
   * - (none)
   *
   * ## Intrinsic children
   * - `edit` (order: 0)
   * - `duplicate` (order: 10)
   * - `delete` (order: 20)
   */
  ROLE_DETAIL_HEADER_ACTIONS: "rbac.role.detail.header.actions",

  /**
   * Toolbar above the roles list.
   *
   * ## Emitters
   * - `<RolesListPage>`.
   *
   * ## Current contributions
   * - (none)
   */
  ROLES_LIST_TOOLBAR: "rbac.roles.list.toolbar",
} as const;

/** Union of every zone identifier owned by `@stackra/rbac`. */
export type RbacZoneId = (typeof RBAC_ZONES)[keyof typeof RBAC_ZONES];
```

Constant name: `<PKG>_ZONES` — SCREAMING_SNAKE_CASE. Never `RBAC_ZONE`,
`RbacZones`, or `Zones`.

Field name: SCREAMING_SNAKE_CASE key matching the semantic identifier value:
`ROLE_DETAIL_SIDEBAR: "rbac.role.detail.sidebar"`.

Type export: `<Pkg>ZoneId` — literal union derived from the constant. Used by
injection registrars to type `IZoneContribution.zone`.

## Rule 6 — every zone carries a discovery docblock

The docblock on each zone field answers three questions:

1. **Who emits the zone** — which page / composite / component renders
   `<Zone id={...}>`.
2. **Who contributes to it today** — every current `IZoneContribution`, path +
   one-line intent + position.
3. **What context predicates fire** — which `IZoneContext.params` fields
   contributions can read; any `when(ctx)` predicates typically applied.

**Docblock is mandatory.** Same discipline as event catalogues
(`events-authoring.md`). Without the docblock, "which packages inject into this
zone?" becomes a workspace-wide grep. With it, one file answers the question.

**Keeping the docblock accurate**: when you add a contribution targeting a zone,
you also update the constant's docblock (one line under "Current contributions")
in the SAME commit. When you remove a contribution, you remove its line. This is
the discovery contract — not a hint.

## Rule 7 — how a package EXPOSES a zone

The page (or composite) that owns the zone wraps the extension point in
`<Zone id={PKG_ZONES.X} params={...}>...</Zone>`. Intrinsic children go INSIDE
the JSX — each carries a stable `id` prop (or React `key`) that contribution
`anchor` values reference. `params` is the runtime data every contribution's
`when(ctx)` predicate reads via `IZoneContext.params`.

```tsx
// frontend/packages/rbac/src/react/pages/role-detail-page/
//   role-detail-page.component.tsx

import { RBAC_ZONES } from "@stackra/contracts";
import { Zone } from "@stackra/zones/react";

export function RoleDetailPage(): ReactElement {
  const { role } = useLoaderData();

  return (
    <div className="grid grid-cols-3 gap-6">
      <main className="col-span-2">
        <RoleForm role={role} />
      </main>

      <aside className="col-span-1">
        <Zone
          id={RBAC_ZONES.ROLE_DETAIL_SIDEBAR}
          params={{ roleId: role.id, applicationId: role.applicationId }}
        >
          {/* Intrinsic children — each MUST carry a stable id */}
          <AuditTrailPanel id="audit-trail" roleId={role.id} />
          <UsageStatsPanel id="usage-stats" roleId={role.id} />
        </Zone>
      </aside>
    </div>
  );
}
```

Rules for the exposure:

- **`id={PKG_ZONES.X}`** — never an inline string.
- **Intrinsic children as JSX** — the host's default content lives as direct
  children inside the `<Zone>...</Zone>`. Each child MUST carry a stable `id`
  prop (preferred) OR a React `key`. `flattenIntrinsicChildren` extracts the id
  via `props.id` first, then falls back to `key`. Missing ids get an
  auto-synthesised fallback + a dev-time warning; anchor lookups against
  synthesised ids DO NOT survive re-renders.
- **`params={{ ... }}`** — parameters contributions can read through
  `IZoneContext.params`. Include everything a contribution could reasonably need
  — the ordering algorithm passes the whole context to each contribution's
  `when(ctx)` predicate + to each React component's `context` prop.
- **NO `intrinsic={...}` prop** and **NO `context={{ params: ... }}` prop** —
  earlier drafts of this doc mentioned those shapes but the actual `<Zone>` API
  uses JSX children + a flat `params` prop. Use those.

## Rule 8 — how a package CONTRIBUTES to a zone

The injecting package registers contributions via its own
`WebXModule.forFeature({ zones: [...] })`. Registration follows the ADR-0052
registrar-class pattern from [`module-lifecycle.md`](module-lifecycle.md):

```typescript
// frontend/packages/grants/src/react/web-grants.module.ts

import {
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
} from "@stackra/container";
import {
  RBAC_ZONES,
  ZONE_REGISTRY,
  type IZoneRegistry,
} from "@stackra/contracts";

import { GrantsCarryingRolePanel } from "./components/grants-carrying-role-panel";

@Module({})
export class WebGrantsModule {
  public static forRoot(options?: IWebGrantsModuleOptions): DynamicModule {
    @Injectable()
    class GrantsZonesRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(ZONE_REGISTRY) private readonly zones: IZoneRegistry,
      ) {}

      public onApplicationBootstrap(): void {
        this.zones.register({
          id: "grants.role-detail.grants-carrying",
          zone: RBAC_ZONES.ROLE_DETAIL_SIDEBAR,
          kind: "react",
          position: "start",
          component: GrantsCarryingRolePanel,
          when: (ctx) => Boolean(ctx.params?.roleId),
        });
      }
    }

    return {
      module: WebGrantsModule,
      imports: [GrantsModule.forRoot(options)],
      providers: [GrantsCarryingRolePanel, GrantsZonesRegistrar],
    };
  }
}
```

The `IZoneContribution` shape (from `@stackra/contracts`):

- **`id: string`** — globally unique across the whole registry. Namespaced to
  the INJECTING package, dotted, kebab-case within segments:
  `grants.role-detail.grants-carrying`. NEVER collides with the owning page's
  intrinsic-child ids.
- **`zone: string`** — the zone identifier this contribution targets. The
  contract field is `zone`, NOT `zoneId`. Always the imported constant, never an
  inline string.
- **`kind`** — one of `"react"` (renders a React component), `"sdui"` (renders
  an `ISduiNode` via the SDUI runtime), `"field"` (form-field contribution —
  only meaningful in `<FormFieldZone>`), `"column"` (table-column contribution —
  only meaningful in `<TableColumnZone>`).
- **`component`** (for `kind: "react"`) — the React component the renderer
  mounts. Receives `{ context: IZoneContext }` as its sole prop (the whole
  context object under a `context` key, not the context fields destructured).
- **`position`** — one of `"start"` / `"end"` / `"before"` / `"after"` /
  `"replace"`. Defaults to `"end"` when omitted.
- **`anchor`** (only when `position` is `"before"` / `"after"` / `"replace"`) —
  the intrinsic-child id OR sibling-contribution id to anchor against. Position
  and anchor are SEPARATE fields — never `"before:foo"` in one string.
- **`order`** — numeric tiebreaker inside a (`position`, `anchor`) bucket. Lower
  renders first. Default `100`. Stable when equal.
- **`when(ctx)`** — optional client-side visibility predicate. Sync only. Reads
  `ctx.permissions`, `ctx.features`, `ctx.params`, `ctx.tenant`. Returns `false`
  to hide the contribution. Common gates: permission checks
  (`ctx.permissions.includes("rbac.roles.grants.view")`), feature flags
  (`ctx.features.includes("grants")`), param presence
  (`Boolean(ctx.params?.roleId)`).

**Update the OWNING package's zone docblock in the same commit** — add a line
under "Current contributions" naming the injecting package + the contribution
id + the (`position`, `anchor`) shape. This is the discovery contract (Rule 6).

## Rule 8.5 — one `.zone.tsx` file per contribution, authored via `defineZone`

Every zone contribution is authored in its own dedicated `.zone.tsx` (or
`.zone.ts` for `sdui` / `field` / `column` kinds) file whose sole export is a
`defineZone({...})` result. Same pattern as `defineRoute` (routing) +
`defineMenu` (navigation) — symmetry across the three extension-point systems.

### Folder placement

- **Framework tier** — `frontend/packages/<pkg>/src/react/zones/<name>.zone.tsx`
  (or `src/core/zones/` when the contribution is cross-platform and the emitter
  zone is cross-platform too).
- **App tier** — `apps/<app>/src/zones/<name>.zone.tsx`.

One contribution per file. The filename kebab-stem names the contribution's
intent (`landing-auth-ctas.zone.tsx`, `language-toggle-header.zone.tsx`,
`theme-switcher-header.zone.tsx`).

### Canonical shape

```tsx
// apps/academorix-landing/src/zones/landing-auth-ctas.zone.tsx
import { NAVIGATION_ZONES } from "@stackra/contracts";
import { defineZone } from "@stackra/zones";

import { HeaderEndActions } from "@/components/marketing";

/**
 * Auth CTAs contribution — pins `Log in` + `Get started` to the
 * navbar's `HEADER_END` zone.
 */
export const landingAuthCtasZone = defineZone({
  id: "landing.header-end.auth-ctas",
  zone: NAVIGATION_ZONES.HEADER_END,
  kind: "react",
  position: "end",
  order: 200,
  component: HeaderEndActions,
});
```

Rules for the shape:

- **Constant name is camelCase + `Zone` suffix** — `landingAuthCtasZone`,
  `themeSwitcherHeaderZone`, `languageToggleFooterZone`. Never the file's
  bare-name (which is kebab-case).
- **`id` is namespaced to the CONTRIBUTING package** in dotted lowercase with
  kebab-case segments — `landing.header-end.auth-ctas`,
  `i18n.footer-bottom.language-toggle`. Never collides with the emitter's
  intrinsic-child ids.
- **`zone` uses the emitter's constant** from `@stackra/contracts/zones/` —
  never an inline string.
- **`component` accepts any React component shape** — `defineZone` wraps it in
  the strict `ComponentType<{ context: IZoneContext }>` adapter automatically
  (see `frontend/packages/zones/src/core/utils/define-zone/`). You don't
  hand-roll the `{ context: IZoneContext }` bridge.

### Registration

The `.zone.tsx` file's default export is consumed by a single
`ZonesModule.forFeature({ zones: [...] })` in the package's `Web<Pkg>Module`:

```typescript
// apps/academorix-landing/src/app.module.ts
import { ZonesModule } from "@stackra/zones";
import { landingAuthCtasZone } from "@/zones";

@Module({
  imports: [
    ZonesModule.forRoot(),
    ZonesModule.forFeature({
      source: "@academorix/landing",
      zones: [landingAuthCtasZone],
    }),
  ],
})
export class AppModule {}
```

Each `.zone.tsx` file re-exports its constant through the package's
`src/zones/index.ts` barrel. One `forFeature` call per package that contributes
zones — never multiple `forFeature({ zones })` calls in the same module (per
navigation-catalog + module-lifecycle rules).

### Why `defineZone`, not raw `IZoneContribution`

Three benefits:

1. **Widens the component input** — the strict
   `ComponentType<{ context: IZoneContext }>` shape rejects components that
   accept their own props (e.g. `<ThemeSwitcher>` accepting
   `IThemeSwitcherProps`). `defineZone` wraps every `kind: "react"` component in
   a stable module-scope adapter that satisfies the strict shape without forcing
   every consumer to hand-roll the bridge.
2. **Preserves React DevTools identity** — the adapter carries
   `displayName = "ZoneAdapter(ThemeSwitcher)"` so DevTools shows the real
   component name at the mount site.
3. **Autocomplete + compile-time validation** — every field on the four
   `IZoneContribution` arms (`react` / `sdui` / `field` / `column`)
   auto-completes + type-checks. Discovery via TS goes-to-definition from any
   `.zone.tsx` file straight to the emitter's constant.

## Rule 9 — the injection graph is DOCUMENTED

Every zone-owning package's README §"Extension points" section lists:

- Every zone the package exposes (name + purpose + one-line link to the
  constants file).
- Every package that currently injects into those zones (with intent +
  position).

The workspace-wide graph — which package injects where across every zone in the
workspace — lives at `.kiro/plans/zones-workspace-inventory.md`. Update in the
same commit that adds a new zone OR a new contribution.

## Anti-patterns

| Anti-pattern                                                                                                    | Correct                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `<Zone id="rbac.role.detail.sidebar">`                                                                          | `<Zone id={RBAC_ZONES.ROLE_DETAIL_SIDEBAR}>` — import the constant per Rule 1.                 |
| Zone constant declared in the owning package's `src/core/`                                                      | In `frontend/packages/contracts/src/zones/<pkg>.zones.ts` per Rule 2.                          |
| `PKG_ZONE` (singular) or `PkgZones` (PascalCase)                                                                | `PKG_ZONES` (plural + SCREAMING_SNAKE) per Rule 5.                                             |
| Camel- or snake-case within an ID segment (`rbac.roleDetail.sidebar`)                                           | Kebab within segments, dotted between (`rbac.role.detail.sidebar`) per Rule 4.                 |
| Docblock omits emitters + current contributions                                                                 | Every zone carries the three-question docblock per Rule 6 — mandatory.                         |
| Contribution ID matches an intrinsic child ID                                                                   | Namespace the contribution ID to the injecting package (`grants.role-detail.grants-carrying`). |
| Contribution registered via a side-effecting `useFactory`                                                       | Inline `@Injectable()` registrar class implementing `OnApplicationBootstrap` per ADR-0052.     |
| Injecting package imports zone constant from the owning package                                                 | Import from `@stackra/contracts` (`import { RBAC_ZONES } from "@stackra/contracts"`).          |
| Injecting package's contribution adds to owning package's zone but doesn't update the owning package's docblock | Update the owning package's `<pkg>.zones.ts` docblock in the SAME commit (Rule 6).             |
| Reordering intrinsic children breaks contributions using `before:` / `after:`                                   | Intrinsic child IDs are STABLE; renaming one is a breaking change for every contribution.      |
| Multiple `*.zones.ts` files per package                                                                         | ONE `<pkg>.zones.ts` per package per Rule 5.                                                   |

## Enforcement

Zero-hit greps that must pass:

```sh
# Every <Zone id=...> uses a constant, not an inline string.
grep -rEn '<Zone[[:space:]]+[^>]*id=["'"'"'][a-z0-9.-]+' \
  frontend/packages/*/src/react frontend/packages/*/src/native

# Every IZoneContribution registers with a constant, not a string.
# The contract field is `zone:` (not `zoneId:`).
grep -rEn 'zone:[[:space:]]*["'"'"'][a-z][a-z0-9.-]+["'"'"']' \
  frontend/packages/*/src

# Zone-constants MUST live in @stackra/contracts/zones/.
# No PKG_ZONES defined outside contracts/src/zones/<pkg>.zones.ts.
grep -rEn 'export const [A-Z]+_ZONES = \{' \
  packages/frontend --include='*.ts' \
  | grep -v 'contracts/src/zones/[a-z-]\+.zones.ts'

# Every <pkg>.zones.ts file's exports match the pattern.
for f in frontend/packages/contracts/src/zones/*.zones.ts; do
  grep -q '^export const [A-Z_]\+_ZONES = {' "$f" \
    || echo "MISSING PKG_ZONES export in $f"
  grep -q '^export type .*ZoneId =' "$f" \
    || echo "MISSING ZoneId type export in $f"
done
```

Every violation is a review-blocking finding. Reviewers reject the PR + point at
this steering doc.

## Discovery — answering "who contributes to X?"

Two paths, both should be trivial:

1. **Read the owning package's `<pkg>.zones.ts` docblock.** Every current
   contribution is named there.
2. **Grep.** Search `zoneId: RBAC_ZONES.ROLE_DETAIL_SIDEBAR` — every
   contribution site surfaces. If the grep finds a contribution the docblock
   doesn't mention, the docblock is out of sync — fix in the same PR.

## Cross-references

- `events-authoring.md` — parallel pattern for event catalogues; the ownership +
  docblock discipline is identical.
- `module-lifecycle.md` §"forFeature — always via an @Injectable() registrar
  class" — the canonical pattern every zone-injecting package uses to register
  contributions.
- `subpath-layering.md` §"Where does a hook / context / provider go?" — zone
  constants + `<Zone>` runtime live under `core/` when both `react/` and
  `native/` consume them.
- `contract-reexports.md` — why zone constants don't live in contracts.
- `dashboard-widgets.md` — the widget-shaped zone system already in production;
  general zones follow the same discipline.
- `.kiro/plans/zones-workspace-inventory.md` — the workspace-wide zone catalog +
  injection graph.
- `.kiro/specs/zones/design.md` — the underlying architecture
  (`resolveZoneOrder`, `IZoneContribution`, `IZoneContext`).
