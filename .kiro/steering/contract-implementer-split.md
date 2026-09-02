---
inclusion: fileMatch
fileMatchPattern: "packages/**/package.json"
---

# Contract-implementer split — the two-package pattern

Some framework concerns have TWO natural audiences:

- **Every consumer** needs to declare the concern (decorator on a class,
  contract to type against, middleware to install).
- **Only some consumers** need the storage, admin surface, and vendor wiring
  that IMPLEMENTS the concern.

When those two audiences exist for the same concern, split into **two
packages**: one lightweight `<concern>` package + one heavy
`<concern>-implementation` (or reference-implementation) package. This is the
pattern codified by
[ADR-0008](../../docs/adr/0008-keep-authorization-and-access-split.md) and the
canonical shape every future framework package should follow when the shape
fits.

## Decision test — does the split apply?

Answer yes to ALL three questions:

1. **Does every domain package NEED to declare against this concern?**
   (Decorators on handlers, contracts on services, middleware on routes.) If
   only one or two consumers touch it, don't split — ship one package.
2. **Does the reference implementation carry weight some consumers don't need?**
   (DB models, migrations, admin routes, heavy vendor deps, request-time hooks,
   boot-time registries.) If the implementation is <10 files with no DB, don't
   split — it's not heavy enough to justify the ceremony.
3. **Could a consumer legitimately want to swap the implementation?** (Custom
   storage, LDAP-backed roles, external IdP, in-memory fakes for tests,
   alternate storage for a slim service.) If the storage is fixed forever, don't
   split — YAGNI.

If any answer is "no", ship ONE package. The split is not the default; it's the
answer for concerns that meet all three tests.

## The canonical example — `authorization` + `access`

| Concern                                                                  | Package         | Reason                                                |
| ------------------------------------------------------------------------ | --------------- | ----------------------------------------------------- |
| `@RequirePermission` + `@RequireRole` + `@AllowGuest`                    | `authorization` | Every route uses them; must be cheap to depend on.    |
| `AuthorizeRoute` middleware                                              | `authorization` | Same — no DB dependency.                              |
| `PermissionEnum` / `PermissionContributor` / `RoleContributor` contracts | `authorization` | Contracts live one layer below their implementers.    |
| `Role` + `Permission` DB models                                          | `access`        | DB-backed.                                            |
| Migrations for `roles` + `permissions` tables                            | `access`        | DB-backed.                                            |
| Admin routes (`GET /api/admin/roles`, ...)                               | `access`        | HTTP surface — not every app needs it.                |
| RBAC vendor wiring                                                       | `access`        | Vendor coupling — kept away from base package.        |
| Super-admin bypass hook                                                  | `access`        | Runtime hook — kept away from base package.           |
| Role / permission registry hydration at boot                            | `access`        | Uses contributor tags declared in `authorization`.    |

The AI service (`apps/ai-service`) pulls in `authorization` (decorators

- middleware) but NOT `access` (roles/permissions admin) — it verifies inbound
  service JWTs and checks abilities on the caller, never renders an admin UI.
  That's the payoff.

## Canonical shape

Every split follows the SAME structure. Copy `authorization` + `access` when
authoring a new pair.

### Light package — `<concern>`

npm name: `@stackra/<concern>`. What ships:

- `decorators/` — every `@AsX` / `@RequireX` marker consumers attach to their
  classes.
- `contracts/` — every contract the reference implementation satisfies.
  `<Concern>Contributor` (for boot-time registration), `<Concern>Store` (for
  storage abstraction), `<Concern>Enum` (for enum-based catalogues).
- `middleware/` — middleware that only depends on the abstract user shape
  (`.can()`, `.hasRole()`, `.hasPermission()`) — never on a concrete DB model.
- Module — registers middleware + contributor tag; no DB bootstrapping.
- **ZERO** DB models, ZERO migrations, ZERO admin routes, ZERO vendor deps
  beyond the framework.

Consumers depend on this. It must stay cheap.

### Heavy package — `<concern>-<impl>` (or just `<concern>-implementation`)

npm name: `@stackra/<impl-name>` — pick the name that describes the
implementation, not the concern. For authorization the impl name is `access`;
for a future feature-flags split it might be `feature-flags-store`.

What ships:

- `models/` — the models backing the storage.
- `migrations/` — schema for the storage tables.
- `repositories/` — storage-facing repos implementing the light package's
  `contracts/`.
- `actions/` — admin CRUD handlers when the concern has an admin surface.
- Module — boot-time registry hydration; runtime hooks; vendor wiring (RBAC
  library, feature-flag library, etc.).
- Optional `cli/` — admin commands (seed default roles, purge stale flags,
  etc.).
- Depends on the light package. Never the reverse.

Apps that need the admin surface pull this in. Apps that only need to DECLARE
against the concern don't.

## Why the split works

1. **Weight-appropriate dependencies.** Every domain package that declares
   `@RequirePermission(UserPermission.View)` on a handler would otherwise pull
   in DB models + migrations + admin routes, even if that domain never renders
   an admin UI.
2. **Slim service compatibility.** Workers, MCP servers, and slim apps (like
   `apps/ai-service`) only need to AUTHORIZE — not to ADMINISTER. The split lets
   them ship without hauling the RBAC library + admin CRUD into their dependency
   tree.
3. **Substitutability.** The light package runs against ANY store that satisfies
   its contracts. Custom permission stores, LDAP backends, external IdPs,
   in-memory fakes — all valid. An app can ship its own permission storage layer
   and still use the light package's decorators verbatim.
4. **Test isolation.** Tests of authorization behaviour don't need to run
   migrations for a permission surface they don't exercise. The light package's
   test suite uses in-memory fakes; the heavy package's test suite is the only
   place the DB tables are exercised.
5. **Clean deprecation path.** When the reference implementation is replaced (a
   v2 store, a new vendor lib), only the heavy package moves. The contract seam
   in the light package stays put. Every consumer keeps working against the same
   decorator + contract surface.

## Candidate future splits

These concerns already show the shape and should follow the same split when
their reference implementation is built:

| Light package                                                                       | Heavy package                                                           | Split trigger                                                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `feature-flags` (decorators, `Checker` contract, middleware)                        | `feature-flags-store` (models + admin CRUD + rollout runner)            | Every domain gates behind flags; only admin apps need the store + rollout UI.               |
| `settings` (`@AsSetting` + `@SettingField`, contracts, schema builder)              | `settings-store` (`scope_values` backing + admin CRUD)                  | Every domain declares settings; only admin apps need the CRUD surface.                      |
| `audit` (`@Auditable` contract + observer skeleton)                                 | `audit-log` (audit rows + retention runner + admin viewer)              | Every domain marks auditable; only compliance-aware apps need the DB.                       |
| `caching` (cache-tag resolver decorators + contracts)                               | `caching-registry` (concrete registry + admin invalidation surface)     | ADR-0004 already implies this split; wire it up when the registry lands.                    |
| `scheduling` (`@Cron` + `@WithoutOverlapping` + `@OnOneServer` + `@ScheduleName`)   | `scheduling-runtime` (schedule discovery + queue integration + admin)   | Every domain declares scheduled jobs; only long-running apps need the runtime.              |
| `events` (`@AsEvent` + `@OnEvent` + `@ListensFor`)                                  | `events-bus` (broadcasting store + admin monitor)                       | Every domain publishes + listens; only apps that need broadcast monitoring pull in the bus. |

The check on each row is the same: does every consumer NEED to declare, but only
some consumers NEED the storage + admin? If yes, split. If no, ship one package.

## Naming

- **Light package** is named for the CONCERN: `authorization`, `feature-flags`,
  `settings`.
- **Heavy package** is named for the IMPLEMENTATION strategy or the storage:
  `access` (for the role/permission storage layer), `feature-flags-store`,
  `settings-store`, `audit-log`.
- Never suffix the heavy package with `-impl` or `-implementation` — that's the
  abstraction leaking. Pick a name that describes what the package DOES.

## Anti-patterns

| Anti-pattern                                                                                             | Correct                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merging both back into one package "for simplicity"                                                      | Keep split — slim consumers must not pay for the admin surface.                                                                                                       |
| Light package depends on the heavy package                                                               | Reverse the arrow — heavy depends on light. Light must have zero dependency on any storage.                                                                           |
| Contracts placed in the heavy package                                                                    | Contracts live in the light package — one layer below their implementers. Otherwise consumers can't type against them without pulling in the storage.                 |
| Middleware with a concrete DB-model type in the light package                                            | Middleware types against the contract (`UserContract`, `PermissionStore`), never against the concrete model.                                                          |
| Vendor dependency (RBAC library, feature-flag library) declared in the light package                    | Vendor deps live in the heavy package. The light package's deps declare only framework packages.                                                                     |
| Two packages authored but the heavy package's tests reach into the light package's `tests/` for fixtures | Each package's tests are self-contained. Shared fixtures live in `@stackra/testing` (or a dedicated `<concern>-testing` sibling if the fixtures are concern-specific). |
| Heavy package registers the CONTRACT tag at boot                                                         | Contract tag is registered by the light package's module (it OWNS the contract). Heavy package registers IMPLEMENTERS against the existing tag.                       |
| Splitting a concern where only one or two consumers exercise it                                          | Ship ONE package. The split's ceremony only pays off when many consumers reference the concern.                                                                       |
| Naming the heavy package `<concern>-impl`                                                                | Name it for what it does (`access`, `feature-flags-store`, `audit-log`).                                                                                              |

## Precedence

- Cost of the split is negligible in code (the light package is usually ~10
  files) — but is not zero in mental overhead. Only reach for it when the three
  decision tests all say yes.
- When the split IS right, `authorization` + `access` is the canonical shape.
  Copy that layout — folder-by-folder — rather than invent a new one.
- New splits are ADR-worthy — they codify a boundary between two packages. Write
  the ADR before shipping the pair (see ADR-0008 for the template).

## Frontend instantiation

The same pattern applies to the frontend, with one extra axis: the reference
implementation splits further into a headless runtime and a UI kit, because the
UI kit's peer chain (HeroUI Pro, HeroUI, layout variants) is independently
swappable — RN apps and custom-brand products both reasonably skip it.

The frontend instantiation is codified in
[ADR-0037](../../docs/adr/0037-client-side-authorization-split.md) as a
three-package split:

| npm name                 | Layer         | Consumer profile                                        |
| ------------------------ | ------------- | ------------------------------------------------------- |
| `@stackra/authorization` | light         | Slim consumers — `useCan()` / guards / decorators only. |
| `@stackra/auth`          | heavy runtime | Custom-brand products — services + login hooks, no UI.  |
| `@stackra/auth-ui`       | heavy UI      | Standard products — batteries-included forms + layouts. |

The decision test remains identical: three yes answers ⇒ split. The one
adaptation for the frontend is that a third package can be justified when the UI
layer is independently swappable and would drag a peer chain (HeroUI Pro, etc.)
that non-UI consumers should not inherit. Any future frontend concern that meets
the same conditions (e.g. a `feature-flags` UI kit) follows the same
three-package shape.

## Related steering + ADRs

- [ADR-0008](../../docs/adr/0008-keep-authorization-and-access-split.md) — the
  backend decision this steering codifies.
- [ADR-0037](../../docs/adr/0037-client-side-authorization-split.md) — the
  frontend instantiation of the same pattern, splitting the heavy tier into a
  headless runtime + a UI kit.
- `.kiro/steering/subpath-layering.md` — the subpath dependency-direction rule
  every light + heavy package converges on.
- `.kiro/steering/contracts-and-decorators-promotion.md` — when a symbol earns
  promotion into the shared contracts/decorators package the light tier depends
  on.
- `.kiro/steering/code-standards.md` — the folder taxonomy + one-export-per-file
  rules both packages follow.
- `.kiro/steering/auth-tenancy-composition.md` — the auth-vs-tenancy layering
  that builds on this light-vs-heavy split.
