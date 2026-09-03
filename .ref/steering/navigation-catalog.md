# Navigation catalog — workspace convention

Rules for how every `@stackra/*` package that ships pages / composite chrome
contributes to the workspace navigation surface, and how consumers wire up the
sidebar / header / footer / breadcrumb / tabs shells.

Read alongside:

- [`zones-catalog.md`](zones-catalog.md) — the sibling `<Zone>` system;
  navigation ships zones under `NAVIGATION_ZONES` in `@stackra/contracts/zones`
  so packages can inject arbitrary content into the sidebar header, footer
  bottom, header end, etc.
- [`module-lifecycle.md`](module-lifecycle.md) — the inline `@Injectable()`
  registrar-class pattern (ADR-0052) that every menu contribution routes
  through.
- [`dashboard-widgets.md`](dashboard-widgets.md) — the specialised widget-shaped
  contribution system on the dashboard.
- [`ui-components.md`](ui-components.md) — the HeroUI composition rules every
  navigation contribution follows.
- [`subpath-layering.md`](subpath-layering.md) — where `WebXModule.forRoot`
  imports `NavigationModule.forFeature`.

## Precedence

1. This file wins over generic navigation guidance.
2. When this file and a package-level README disagree, this file wins.
3. Cross-references take precedence for their specific concerns.

## The three concerns

Every navigation contribution has three moving parts:

1. **The LOCATION** — a string identifier (`"primary"`, `"footer"`, `"account"`,
   `"mobile"`, `"header-end"`, `"command"`) the surface reads.
2. **The MENU** — a shape with an id + ordered `IMenuItem[]`.
3. **The REGISTRATION** — a package registers via
   `NavigationModule.forFeature({ menus })` per ADR-0052.

## Rule 1 — every menu item carries a stable `id`

Every `IMenuItem.id` is a globally-unique string (namespaced to the contributing
package):

```typescript
// ✅ correct — namespaced, stable.
{ id: "rbac.roles", kind: "link", label: "Roles", to: "/rbac/roles" }

// ❌ wrong — bare `roles` collides across packages.
{ id: "roles", kind: "link", label: "Roles", to: "/rbac/roles" }
```

## Rule 2 — every menu contribution uses `NavigationModule.forFeature`

Never call `IMenuRegistry.register(...)` directly at module boot — that's the
same anti-pattern ADR-0052 codifies. Wrap the registration in an inline
`@Injectable()` registrar class implementing `OnApplicationBootstrap`:

```typescript
import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
} from "@stackra/container";
import { MENU_REGISTRY, type IMenuRegistry } from "@stackra/contracts";
import { NavigationModule } from "@stackra/navigation";

@Module({})
export class WebRbacModule {
  public static forRoot(): DynamicModule {
    return {
      module: WebRbacModule,
      imports: [
        NavigationModule.forFeature({
          source: "@stackra/rbac",
          menus: [
            {
              menu: {
                id: "rbac-primary",
                location: "primary",
                items: [
                  {
                    id: "rbac.roles",
                    kind: "link",
                    label: "Roles",
                    to: "/rbac/roles",
                    icon: "shield-check",
                    requiresPermission: "rbac.roles.view",
                  },
                ],
              },
              priority: 100,
            },
          ],
        }),
      ],
    };
  }
}
```

Under the hood, `NavigationModule.forFeature` synthesises a registrar class per
ADR-0052 §Canonical shape and calls `IMenuRegistry.register` for each entry.

## Rule 3 — location naming — dotted-lowercase, package-agnostic

Locations are semantic strings that describe WHERE, not WHO:

- **Primary chrome** — `"primary"`, `"footer"`, `"mobile"`, `"mobile-bar"`,
  `"account"`, `"help"`, `"command"`, `"header-end"`, `"footer-bottom"`.
- **Sub-surface** — `"sidebar-below"`, `"admin"`, `"docs"`.

Bad location names:

- `"rbac-primary"` — a package name in the location. Locations describe
  surfaces; anyone can contribute to `"primary"`, but only rbac contributes to
  `"rbac-primary"`. Reserve package-scoped locations for genuine per-package
  surfaces.
- `"PrimaryMenu"` — PascalCase. Locations are lowercase-dotted.

## Rule 4 — order across contributions is deterministic

Every registration carries `priority` (default `100`) — lower runs first, stable
when equal. Every item carries `order` (default `0`) — lower renders first,
stable when equal.

Global ordering convention:

| Concern                                      | Priority range |
| -------------------------------------------- | -------------- |
| Framework primitives (auth, tenant switcher) | 0-49           |
| Product-level surfaces (settings, dashboard) | 50-99          |
| Feature packages (rbac, grants, delegation)  | 100+           |
| Discovered routes (`<NavRouteSource>`)       | 200+           |
| Tenant / admin overrides                     | 500+           |

## Rule 5 — every item that gates on state uses the schema fields

Never guard rendering with an if / early-return in the surface component.
Instead, declare the gate ON the item — the workspace registry filters
consistently across every surface:

```typescript
{
  id: "rbac.admin",
  kind: "link",
  label: "Admin",
  to: "/admin",
  auth: "authenticated",            // signed-in only
  requiresPermission: "admin.view", // must hold permission
  hideOn: { mobile: true },         // hidden on mobile
  when: (ctx) => Boolean(ctx.tenant?.slug), // custom predicate
}
```

Rationale:

- **Single filter path.** One place decides visibility for every surface.
- **Testability.** Contributions can be tested against a synthetic
  `INavigationContext` without mounting a React tree.
- **Cross-package consistency.** Two packages that both check the same
  permission always render the same visible set.

## Rule 6 — every visual composed from HeroUI Pro primitives

Navigation surfaces compose primitives from `@stackra/ui/react` (which
re-exports both `@heroui/react` and `@heroui-pro/react`):

| Component          | Uses                                |
| ------------------ | ----------------------------------- |
| `<NavSidebar>`     | HeroUI Pro `Sidebar` compound       |
| `<NavHeader>`      | HeroUI Pro `Navbar` compound        |
| `<NavFooter>`      | Composition of `<NavMenu>`          |
| `<NavMegaMenu>`    | HeroUI `Popover` + `Popover.Dialog` |
| `<NavAccountMenu>` | HeroUI `Popover` + `Avatar`         |
| `<NavCommand>`     | HeroUI `Modal` + `SearchField`      |
| `<NavBanner>`      | HeroUI `Alert`                      |
| `<NavBreadcrumb>`  | HeroUI `Breadcrumbs`                |
| `<NavSearch>`      | HeroUI `SearchField`                |

Never hand-roll semantic markup for these concerns. Never bring in bespoke CSS
files. Utility classes (Tailwind layout: `flex`, `gap-*`, `mt-*`) are the only
custom styling permitted per `.kiro/steering/ui-components.md`.

## Rule 7 — the sidebar is composable, not baked

The workspace canonicalises the sidebar via `<NavSidebar>`, which supports two
mount shapes:

1. **AppLayout slot** (recommended for full shells):

   ```tsx
   <AppLayout
     sidebar={<NavSidebar />}
     navbar={<NavHeader />}
     sidebarVariant="sidebar"
     sidebarCollapsible="icon"
     sidebarResizable
     resizableAutoSaveId="stackra:app-sidebar"
   >
     {children}
   </AppLayout>
   ```

2. **Standalone** (for smaller / preview surfaces):

   ```tsx
   <NavSidebar standalone variant="floating" collapsible="offcanvas" />
   ```

Never wrap `<NavSidebar>` inside another sidebar container — HeroUI Pro's
`Sidebar.Provider` is mounted once (by `AppLayout` OR by `<SidebarProvider>` in
standalone mode).

## Rule 8 — locations are documented in the workspace inventory

Every new location is added to `.kiro/plans/navigation-workspace-inventory.md`
with:

- What contributes today.
- What the surface renders.
- Order of appearance.

The inventory is the source of truth for reviewers checking cross-package
contribution graphs.

## Enforcement

Zero-hit greps that must pass:

```sh
# Every menu contribution goes through NavigationModule.forFeature.
grep -rEn 'menuRegistry\.register\(' frontend/packages/*/src/react

# Every <Zone id="navigation.*"> uses a constant.
grep -rEn '<Zone[^>]*id=["'"'"']navigation\.' \
  frontend/packages/*/src/react

# Locations are lowercase-dotted, never PascalCase.
grep -rEn 'location:\s*["'"'"']([A-Z]|[a-z]+_)' \
  frontend/packages/*/src/react
```

## Cross-references

- `zones-catalog.md` — sibling `<Zone>` system.
- `module-lifecycle.md` §ADR-0052 — registrar-class pattern.
- `dashboard-widgets.md` — widget-shaped contributions.
- `ui-components.md` — HeroUI composition + no bespoke class names.
- `.kiro/plans/navigation-workspace-inventory.md` — cross-package graph.
- `.kiro/specs/navigation-day-one/design.md` — architecture spec.
