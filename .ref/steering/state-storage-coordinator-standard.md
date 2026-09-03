# State, storage & coordinator — the three-lane rule

Rules for how every workspace package handles **reactive state**,
**persistence**, and **cross-tab synchronisation**. Three concerns, three
canonical lanes, one canonical package per lane. This is the enforcement
counterpart to the workspace audit that surfaced ~30 P1 findings from hand-
rolled subscribe/notify + raw localStorage + raw BroadcastChannel usage.

Read alongside:

- [`storage-usage.md`](storage-usage.md) — the parent rule for
  `@stackra/storage` (this doc extends it into the reactive + cross-tab
  concerns).
- [`communication-patterns.md`](communication-patterns.md) — the DI / context /
  events three-lane rule for _communication_ (this doc is its sibling for
  _state_).
- [`events-authoring.md`](events-authoring.md) — event catalogue discipline that
  Lane 3 emissions follow.

## The three lanes

Every stateful concern maps to exactly one primary lane. Composing lanes is
supported and often required (a persisted, cross-tab-synced store touches all
three) — but the CANONICAL PACKAGE for each lane is fixed.

| Concern                             | Lane            | Canonical package      |
| ----------------------------------- | --------------- | ---------------------- |
| Reactive state (subscribe / notify) | **State**       | `@stackra/state`       |
| Persistence (get / set / remove)    | **Storage**     | `@stackra/storage`     |
| Cross-tab sync (leader + broadcast) | **Coordinator** | `@stackra/coordinator` |

If a service invents its own subscribe/notify + its own localStorage read + its
own BroadcastChannel, it has re-implemented all three lanes badly. The audit
finds these and reviewers reject them.

## Rule 1 — Reactive state routes through `@stackra/state`

Every workspace service that publishes reactive state — a store consumers
subscribe to via `useSyncExternalStore` or an equivalent — MUST compose on
`@stackra/state`'s `Store<S>` primitive rather than hand-rolling a
subscribe/notify pattern.

The service registers its state under a DI token:

```typescript
// frontend/packages/contracts/src/tokens/consent.tokens.ts
export const CONSENT_STORE = Symbol.for("CONSENT_STORE");
```

Then wires the store at module composition:

```typescript
// frontend/packages/consent/src/core/consent.module.ts
imports: [
  StateModule.forFeature<ConsentState>({
    name: "consent",
    token: CONSENT_STORE,
    initialState: { preferences: {}, decided: false },
    crossTab: true, // → CrossTabBroadcaster (default true)
    persistence: "localStorage", // → PersistenceBroadcaster (default)
  }),
];
```

Every mutation flows through `Store.setState`:

```typescript
public grantConsent(category: string): void {
  this.store.setState((s) => ({
    ...s,
    preferences: { ...s.preferences, [category]: true },
  }));
  // Auto-emits `consent.changed` on the shared bus.
  // CrossTabBroadcaster relays to peer tabs.
  // PersistenceBroadcaster writes to storage.
  this.emit(CONSENT_EVENTS.GRANTED, { category, timestamp: Date.now() });
}
```

React consumers use the `useStore` hook:

```tsx
import { useStore } from "@stackra/state/react";
import { CONSENT_STORE } from "@stackra/contracts";

function ConsentBanner() {
  const decided = useStore<ConsentState, boolean>(
    CONSENT_STORE,
    (s) => s.decided,
  );
  if (decided) return null;
  return <BannerBody />;
}
```

### What NOT to do

- **No hand-rolled `Set<listener>` + `notify()` methods** in a service that
  publishes state. That's what `@stackra/state`'s `Store<S>` already provides —
  with cross-tab sync + persistence for free.
- **No private `snapshotRef` + `getSnapshot()`** — the store IS the snapshot;
  consumers subscribe through `useStore` (selector semantics give tear-free
  reads).
- **No
  `useSyncExternalStore(service.subscribe.bind(service), service.getSnapshot.bind(service))`**
  — that's the anti-pattern the audit finds and flags.

### Legitimate exceptions

Services that DON'T publish reactive state to React consumers stay as plain
classes — no store required. Examples: `AuthService.login()` (fire

- forget), `NetworkService.markOnline()` (emits, doesn't hold state a consumer
  subscribes to). Adding a store where none is needed adds noise.

## Rule 2 — Persistence routes through `@stackra/storage`

Every read/write to a persistent substrate — `localStorage`, `sessionStorage`,
`IndexedDB`, `AsyncStorage`, `document.cookie` — routes through
`@stackra/storage`'s `IStorageManager`. This rule is codified already in
[`storage-usage.md`](storage-usage.md); this doc adds the integration with the
reactive layer:

**When a service composes an `@stackra/state` store with a `persistence` config,
the `PersistenceBroadcaster` uses `@stackra/storage` under the hood** — the
service never touches storage APIs directly. The `persistence` value names the
storage INSTANCE (from `WebStorageModule.forRoot({ stores: { ... } })`), not the
driver.

Direct `IStorage` use is still valid for services that persist state outside a
store (single-value caches, install-dismissed counters, snooze maps). Those go
through `useStorage("<instance>")` or `@Inject(STORAGE_MANAGER)` per
`storage-usage.md`.

Direct `localStorage.*` calls in workspace code outside `@stackra/storage/src/`
remain a Rule-2 violation regardless of context.

## Rule 3 — Cross-tab sync routes through `@stackra/coordinator`

The workspace has TWO cross-tab channels serving different purposes:

- **`stackra-event-relay`** — owned by `@stackra/coordinator`'s
  `CoordinatorTransport`. Pattern-based relay of matching `EVENT_EMITTER` emits
  across tabs. Enabled per-emit-pattern via the app-level
  `coordinator.broadcastPatterns` config. Use this when cross-package listeners
  want to react to a peer's lifecycle event (e.g. `theming.mode-changed` on the
  analytics package).

- **`__stackra_state_sync`** — owned by `@stackra/state`'s
  `CrossTabBroadcaster`. State replication of stores registered via
  `StateModule.forFeature`. Enabled per-store via the `crossTab: true` config
  (default). Use this when peer tabs need the actual STATE synchronised (e.g.
  the consent preferences map applies in every open tab the instant one tab
  grants a category).

Both channels use the same underlying `ITabTransportManager` from
`@stackra/coordinator` — they multiplex on different channel names to avoid
crossing concerns.

### What NOT to do

- **No raw `new BroadcastChannel(...)`** in workspace code outside
  `@stackra/coordinator/src/` and `@stackra/state/src/broadcasters/`.
- **No raw `window.addEventListener("storage", ...)`** outside
  `@stackra/state/src/broadcasters/`.
- **No raw `navigator.locks`** outside `@stackra/coordinator/src/`.
- Cross-tab sync of a SERVICE'S PRIVATE STATE — do NOT roll a bespoke
  BroadcastChannel to sync N services. Route state through `@stackra/state`
  (Lane 1) and cross-tab comes free.

### Legitimate exceptions

- **Web Locks CAS fallback in `@stackra/coordinator`'s lock manager** — the
  sync-semantics constraint of compare-and-swap primitives requires bypassing
  the async `IStorage` contract. Documented in `storage-usage.md` §Exemption 1.
- **Room-scoped realtime transports** (`@stackra/collaboration`'s
  `BroadcastChannelTransport`) — layer ABOVE the coordinator's transport manager
  for domain-specific pub/sub with different serialisation. Legitimate.

## The composition pattern

A fully-loaded reactive+persisted+cross-tab service composes all three lanes:

```typescript
// frontend/packages/consent/src/core/consent.module.ts
@Module({})
export class ConsentModule {
  public static forRoot(options?: IConsentModuleOptions): DynamicModule {
    return {
      module: ConsentModule,
      imports: [
        // Lane 1 — Reactive state. Auto-emits `consent.changed`.
        // Lane 2 — Persistence. `persistence: "localStorage"` picks the
        //   IStorage instance registered under that name.
        // Lane 3 — Cross-tab. `crossTab: true` (default) hooks
        //   CrossTabBroadcaster on the state-sync channel.
        StateModule.forFeature<ConsentState>({
          name: "consent",
          token: CONSENT_STORE,
          initialState: { preferences: {}, decided: false },
          crossTab: true,
          persistence: "localStorage",
        }),
      ],
      providers: [
        ConsentManager,
        { provide: CONSENT_MANAGER, useExisting: ConsentManager },
      ],
      exports: [ConsentManager, CONSENT_MANAGER],
    };
  }
}
```

The `ConsentManager` service class becomes a thin wrapper that owns
`grantConsent` / `revokeConsent` semantics but no state — the state lives in the
store. Cross-tab sync + persistence are the store's concern.

## Retrofit note — services that emit but don't route state through @stackra/state

The workspace ships services (`ThemeService`, `I18nLocaleService`,
`ConsentManager`, `InAppNotificationCentre`) that EMIT lifecycle events on the
shared `EVENT_EMITTER` bus + subscribe to peer emits to trigger a local
re-hydrate from storage. That pattern is architecturally sound but INCOMPLETE —
it replicates changes across tabs via events + storage rather than via
`@stackra/state`'s direct state relay.

Migrating each service to `StateModule.forFeature` removes the
subscribe-and-rehydrate boilerplate: the state itself flows across tabs via
`CrossTabBroadcaster`. Cross-package lifecycle events (for analytics,
monitoring) continue to fan out via the shared `EVENT_EMITTER` bus +
`CoordinatorTransport` — the two lanes stay separate.

The migration plan lives in
[`.kiro/plans/coordinator-state-storage-migration.md`](../plans/coordinator-state-storage-migration.md).
Follow the recipe there when migrating a service; do not roll a bespoke pattern.

## Anti-patterns

| Anti-pattern                                                                | Fix                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `private listeners = new Set<() => void>()` in a service                    | Compose on `Store<S>` from `@stackra/state`; consumers use `useStore(TOKEN, selector)`.                     |
| `useSyncExternalStore(svc.subscribe, svc.getSnapshot)` at every call site   | Consumers call `useStore(TOKEN, selector)` — the store's subscription is centralised.                       |
| Direct `localStorage.setItem(...)` in a service                             | `IStorageManager.instance('<name>').set(...)` per [`storage-usage.md`](storage-usage.md).                   |
| `new BroadcastChannel('my-service-channel')` in a service                   | Compose `StateModule.forFeature({ crossTab: true, ... })` for state; use `CoordinatorTransport` for events. |
| Custom `Set<Callback>` + custom BroadcastChannel + custom localStorage read | Compose all three lanes — one line each in `forFeature`.                                                    |
| Two BroadcastChannels for the same store                                    | Only one — `@stackra/state`'s `__stackra_state_sync` is the state channel; that's it.                       |
| Emitting lifecycle events for cross-tab sync of PRIVATE state               | Route the state through `@stackra/state`; lifecycle events are for cross-package listeners.                 |
| Skipping `@stackra/state` because "our state is just a boolean"             | Small stores are legitimate. The composition cost is one `forFeature` call.                                 |

## Enforcement — zero-hit greps

Run before every PR that touches state / storage / cross-tab code:

```sh
# Hand-rolled subscribe/notify in workspace services
# (BaseRegistry from @stackra/support is allowed — see the storage
# subscribe rule in Wave 8 of the migration plan.)
grep -rEn 'private listeners\s*=\s*new Set' \
  frontend/packages/*/src \
  | grep -v 'frontend/packages/state/src' \
  | grep -v 'frontend/packages/query/src'

# Direct localStorage / sessionStorage / cookie access outside @stackra/storage
grep -rEn '\b(localStorage|sessionStorage)\.[a-z]' \
  frontend/packages/*/src \
  | grep -v 'frontend/packages/storage/src' \
  | grep -v 'i18n-exempt\|storage-exempt'

# Raw BroadcastChannel outside coordinator + state broadcasters
grep -rEn 'new BroadcastChannel' \
  frontend/packages/*/src \
  | grep -v 'frontend/packages/coordinator/src' \
  | grep -v 'frontend/packages/state/src/broadcasters' \
  | grep -v 'frontend/packages/collaboration/src'

# Raw storage-event listener outside state broadcasters
grep -rEn 'addEventListener\(["'\'']storage' \
  frontend/packages/*/src \
  | grep -v 'frontend/packages/state/src/broadcasters'

# useSyncExternalStore call sites that bypass @stackra/state
grep -rEn 'useSyncExternalStore\(' \
  frontend/packages/*/src \
  | grep -v 'frontend/packages/state/src' \
  | grep -v 'frontend/packages/query/src' \
  | grep -v '@stackra/state'
```

Each hit is either:

1. A legitimate exemption with an inline `// state-lane-exempt: <why>` comment
   naming the constraint (rare — reviewers demand the reason).
2. A P1 finding — refactor onto the canonical lane before merge.

## When you're tempted

- **"But my service is simple — just an array of items."** Simple is fine.
  `StateModule.forFeature({ name, token, initialState: [] })` is ONE line. It
  gets you cross-tab sync and persistence with zero additional code.

- **"But `useSyncExternalStore` is a React built-in."** It is. And
  `@stackra/state`'s `useStore` calls it under the hood — one time, correctly,
  with tearing safety. Every hand-rolled `useSyncExternalStore` call site
  duplicates that machinery.

- **"But my state is transient."** Then don't set `persistence`. The store still
  gives you reactive reads + cross-tab (opt out with `crossTab: false`).
  `@stackra/state` isn't "the persistence package" — it's "the reactive state
  package" that happens to ship a persistence broadcaster.

- **"But I already emit events + reload from storage on peer emits."** That's a
  retrofit pattern documented in the migration plan. It works. It's also 30
  lines of subscribe/emit boilerplate replaced by ONE `forFeature` call. Migrate
  on the next touch.

## Cross-references

- [`storage-usage.md`](storage-usage.md) — parent rule for `@stackra/storage`.
- [`communication-patterns.md`](communication-patterns.md) — sibling three-lane
  rule for _communication_.
- [`events-authoring.md`](events-authoring.md) — event catalogue rules for
  cross-package lifecycle emits.
- [`.kiro/plans/coordinator-state-storage-migration.md`](../plans/coordinator-state-storage-migration.md)
  — ordered migration plan (completed waves + deferred items + retrofit story).
- [`package-conventions.md`](package-conventions.md) — module + config trio
  (`StateModule.forFeature` follows the same registrar-class pattern per
  ADR-0052).
