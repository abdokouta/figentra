---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://settings-package-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/settings` — runtime user-editable settings package

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/settings/` (`@stackra/settings` v0.1.0) **Depends on:**
`@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support`, `@stackra/storage`, `@stackra/http`, `@stackra/realtime`
(optional), `@stackra/logger` (optional), `@stackra/ui` (optional — HeroUI for
React admin) **Design effort:** 24 days across 10 phases

## Purpose

Runtime user-editable settings with a **schema-first** contract and
**multi-source persistence**. Distinct from `@stackra/config`:

|                      | `@stackra/config`                         | `@stackra/settings`                                  |
| -------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Who edits values?    | Developers / operators (env, Doppler, CI) | End-users (admin UI, preferences panel)              |
| Cadence of change    | Deploy-time (rare)                        | Runtime (frequent — a user toggles a preference)     |
| Schema origin        | Zod, TypeScript, build-time               | DTO decorators OR JSON schema fetched from API       |
| Persistence          | env / Doppler / AWS Secrets / http        | memory / storage (localStorage / AsyncStorage) / api |
| Cross-client sync    | HTTP driver refresh polling               | `@stackra/realtime` `settings.changed` events        |
| React surface        | `useConfig(key)` typed hook               | `<SettingsForm>` schema-rendered HeroUI form         |
| Override semantics   | Layered driver, right-most wins           | Local (user override) wraps remote (org default)     |
| Access-control aware | No                                        | Yes — schema fields carry `@RequirePermission`       |

## Design highlights

Faithful to `.ref/packages/settings`. Production-day-one requirements:

- **Sync `get(dto)` API** — React `useState` initializers work synchronously
  even when the backing store is async. First call returns default; async
  hydration fills in later; subscribers get notified.
- **Debounced writes** — 300 ms default. Every input change triggers
  `settings.set(key, value)`; the debouncer batches and flushes once.
- **Registry-driven** — `SettingsRegistry` accepts BOTH local DTOs (via
  `@Setting()` / `@Field()` / `@Group()` / `@Section()`) AND remote JSON schemas
  fetched at boot. Downstream code stays source-agnostic.
- **Local + remote overlay** — a user's local overrides ALWAYS win over the
  remote default. UI shows both values + a "reset to org default" button per
  field.
- **Access-control aware** — every `@Field()` accepts a `permission` prop;
  fields the caller can't edit render read-only. Integrates with
  `@stackra/authorization` (Task 6 dep).
- **Cross-runtime** — same DTO shape on browser + RN + Nest server. The server
  admin API (`GET /admin/settings/schema`) is authored on the SAME DTOs the
  browser uses.
- **Realtime broadcast** — optional. When `@stackra/realtime` is installed +
  configured, `settings.changed` events merge into the local cache; every
  connected client re-renders.

## Manager pattern — Manager (Shape A per ADR-0090)

`SettingsManager extends Manager<ISettingsStore>` — Shape A. ONE active store at
a time (per app). The `layered` store composes N inner stores for the local +
remote overlay (mirrors config's `layered` driver).

```typescript
{
  default: "layered",
  channels: {
    "layered": {
      driver: "layered",
      stores: ["storage", "api"], // storage wins for user-overrides
    },
    "memory": { driver: "memory" },
    "storage": { driver: "storage", key: "app:settings" },
    "api": { driver: "api", baseURL: "/api/settings", refreshMs: 60_000 },
  },
}
```

## Subpath layout — cross-runtime per ADR-0091

```
packages/settings/
├── package.json                          # 6 subpath exports
├── catalog.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── config/                               # ADR-0063 factory (namespaced)
│   └── settings.config.ts
├── src/
│   ├── core/                             # ".": platform-agnostic runtime
│   │   ├── settings.module.ts            # forRoot({ stores, realtime? })
│   │   ├── constants/
│   │   │   ├── settings-events.ts        # SETTINGS_EVENTS constant
│   │   │   └── default-options.ts
│   │   ├── decorators/
│   │   │   ├── setting.decorator.ts      # @Setting({ key, version })
│   │   │   ├── field.decorator.ts        # @Field({ type, permission, ... })
│   │   │   ├── group.decorator.ts        # @Group("Notifications")
│   │   │   └── section.decorator.ts      # @Section("Advanced")
│   │   ├── errors/
│   │   │   ├── settings-validation.error.ts
│   │   │   ├── settings-store.error.ts
│   │   │   └── settings-schema.error.ts
│   │   ├── i18n/                         # per-package en/ar catalogs
│   │   │   ├── en.json
│   │   │   └── ar.json
│   │   ├── interfaces/
│   │   │   ├── settings-store.interface.ts       # get/set/delete/all
│   │   │   ├── settings-schema.interface.ts      # ISettingsSchema (DTO shape)
│   │   │   ├── settings-service.interface.ts
│   │   │   ├── field-control.interface.ts        # ControlType enum + props
│   │   │   └── settings-options.interface.ts
│   │   ├── registries/
│   │   │   └── settings.registry.ts              # register DTOs + JSON schemas
│   │   ├── services/
│   │   │   ├── settings-manager.service.ts       # Manager<ISettingsStore>
│   │   │   ├── settings.service.ts               # sync .get(dto), .set(key, v)
│   │   │   ├── settings-schema-fetcher.service.ts # loads remote JSON schemas
│   │   │   └── settings-broadcast-listener.service.ts # optional realtime
│   │   ├── stores/
│   │   │   ├── memory-settings.store.ts
│   │   │   ├── storage-settings.store.ts         # composes @stackra/storage
│   │   │   ├── api-settings.store.ts             # composes @stackra/http
│   │   │   └── layered-settings.store.ts         # local + remote overlay
│   │   ├── utils/
│   │   │   ├── debounce.util.ts                  # 300 ms default writer
│   │   │   ├── deep-merge.util.ts
│   │   │   └── resolve-permission.util.ts
│   │   └── index.ts
│   │
│   ├── react/                            # "./react": browser admin UI
│   │   ├── web-settings.module.ts
│   │   ├── components/
│   │   │   ├── settings-form.component.tsx       # schema-driven HeroUI form
│   │   │   ├── settings-field.component.tsx      # per-ControlType renderer
│   │   │   ├── settings-section.component.tsx
│   │   │   └── settings-reset-button.component.tsx
│   │   ├── contexts/
│   │   │   └── settings.context.ts
│   │   ├── providers/
│   │   │   └── settings.provider.tsx
│   │   ├── hooks/
│   │   │   ├── use-setting.hook.ts                # useSetting(dto, field)
│   │   │   ├── use-settings.hook.ts               # useSettings(dto)
│   │   │   ├── use-setting-schema.hook.ts
│   │   │   ├── use-can-edit-setting.hook.ts       # permission gate
│   │   │   └── use-settings-status.hook.ts        # loading | ready | error
│   │   ├── pages/
│   │   │   └── settings-page.component.tsx        # full admin page shell
│   │   ├── routes/
│   │   │   └── settings.routes.ts                 # /settings/* route table
│   │   └── index.ts
│   │
│   ├── native/                           # "./native": React Native
│   │   ├── native-settings.module.ts
│   │   ├── components/
│   │   │   ├── settings-form.component.tsx        # HeroUI Native fields
│   │   │   └── ...
│   │   ├── hooks/                                 # same shapes as ./react
│   │   └── index.ts
│   │
│   ├── nest/                             # "./nest": server admin API
│   │   ├── nest-settings.module.ts
│   │   ├── controllers/
│   │   │   └── settings-admin.controller.ts       # GET /schema, GET /:key, PUT /:key
│   │   ├── guards/
│   │   │   └── settings-permission.guard.ts       # composes @RequirePermission
│   │   ├── services/
│   │   │   └── settings-persistence.service.ts    # DB-backed store adapter
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-settings.ts               # in-memory store + set/get helpers
│       ├── test-settings-fixture.ts
│       └── index.ts
│
└── __tests__/
    ├── unit/                              # 12+ unit test files
    └── integration/
        └── local-remote-overlay.test.ts   # local override wraps remote
```

## Public API — locked

| Symbol                       | Kind          | Notes                                               |
| ---------------------------- | ------------- | --------------------------------------------------- |
| `SettingsManager`            | class         | `Manager<ISettingsStore>`                           |
| `SettingsService`            | class         | Sync `.get(dto)` + `.set(key, v)` + subscribe       |
| `SettingsRegistry`           | class         | Accepts DTO classes + JSON schemas                  |
| `SettingsSchemaFetcher`      | class         | Loads schemas from API at boot                      |
| `SettingsBroadcastListener`  | class         | Optional — subscribes to `@stackra/realtime`        |
| `@Setting(opts)`             | decorator     | Class-level: `key`, `version`, `namespace`          |
| `@Field(opts)`               | decorator     | Property-level: `type`, `permission`, `default`     |
| `@Group(label)`              | decorator     | Groups fields under a heading                       |
| `@Section(label)`            | decorator     | Groups groups under a page section                  |
| `ControlType`                | enum          | text/number/boolean/select/multiselect/date/color/… |
| `SETTINGS_MANAGER`           | token         |                                                     |
| `SETTINGS_SERVICE`           | token         |                                                     |
| `SETTINGS_REGISTRY`          | token         |                                                     |
| `SETTINGS`                   | token (alias) | `manager.driver()` shortcut                         |
| `SETTINGS_EVENTS`            | const object  | `.CHANGED`, `.RESET`, `.SCHEMA_LOADED`              |
| `SettingsValidationError`    | class         |                                                     |
| `SettingsStoreError`         | class         |                                                     |
| `<SettingsForm dto={...} />` | component     | React — schema-driven HeroUI form                   |
| `useSetting(dto, key)`       | hook          | React — sync-read, debounced-write                  |
| `useSettings(dto)`           | hook          | React — whole DTO                                   |
| `useCanEditSetting(dto, k)`  | hook          | React — permission gate                             |

## Sync `.get()` — the trick that makes React work

```typescript
// Consumer code
const settings = useInject<SettingsService>(SETTINGS_SERVICE);

// This runs SYNCHRONOUSLY in a useState initialiser:
const [pref] = useState(() => settings.get(NotificationsDto));

// First call: reads memory + returns default from decorator metadata.
// Async hydration: storage + api load in parallel; when values arrive,
// service calls .notify() which triggers React re-render via
// useSyncExternalStore in the useSetting/useSettings hooks.
```

Implementation: every store returns `Promise<T | null>` from `.get(key)` async;
`SettingsService` maintains a synchronous in-memory cache. First read returns
cache OR default (from DTO metadata); subsequent async fills bubble through
`.notify()`.

## Local + remote overlay — the core semantic

```
User opens Settings page
    │
    ▼
useSetting(dto, "notification.email")  → reads layered store
    │
    ▼
LayeredSettingsStore.get("notification.email")
    │
    ├─→ StorageStore.get(...)  → localStorage has value? RETURN
    │                            (user set this — local override)
    │
    └─→ ApiStore.get(...)      → HTTP fetch → RETURN (org default)
```

Reset behaviour: `<SettingsResetButton>` calls `settings.deleteLocal(key)`,
which clears the storage store's value — next read falls through to the API
store (org default). UI shows: `[● local override] [reset to org default]`.

## Cross-client sync via `@stackra/realtime` (optional)

When `@stackra/realtime` is installed AND
`SettingsModule.forRoot({ realtime: { enabled: true, room: "settings:<orgId>" }})`:

- Server publishes `settings.changed` events after PUT `/admin/settings/:key`.
- `SettingsBroadcastListener` subscribes to the room + merges into local cache.
- Every connected client re-renders instantly.

## Permission gating

```typescript
@Setting({ key: "org.notifications", version: 1 })
class NotificationsSettings {
  @Field({ type: ControlType.Boolean, default: true })
  emailEnabled: boolean;

  @Field({
    type: ControlType.Select,
    options: ["basic", "advanced"],
    permission: "settings.notifications.admin", // ← gated
  })
  notificationTier: "basic" | "advanced";
}
```

`useCanEditSetting()` composes `@stackra/authorization` (Task 6 dep). Fields the
caller can't edit render read-only + show a "requires
`settings.notifications.admin`" tooltip.

## Options

| Option             | Default      | Purpose                                         |
| ------------------ | ------------ | ----------------------------------------------- |
| `default`          | `"layered"`  | Default store name                              |
| `stores`           | `{...}`      | Per-name store configs                          |
| `debounceMs`       | `300`        | Write debounce window                           |
| `schemaUrl`        | `undefined`  | Optional URL for remote JSON schemas            |
| `refreshMs`        | `60_000`     | API store refresh interval                      |
| `realtime.enabled` | `false`      | Enable @stackra/realtime broadcast subscription |
| `realtime.room`    | `"settings"` | Room name for cross-client sync                 |

## Testing

- `MockSettings` — in-memory store + `.setValue(key, v)` helper for tests.
- `TestSettingsFixture` — auto-registers a set of test DTOs.
- Coverage target: 90% branch coverage.

## Phases

### Phase 1 — Scaffold + registry (2 days)

- [ ] Package skeleton per `.kiro/steering/package-conventions.md`.
- [ ] `SettingsRegistry` — accepts DTOs + JSON schemas via `register(...)`.
- [ ] Decorators: `@Setting`, `@Field`, `@Group`, `@Section` — reflect metadata
      used by the registry.

### Phase 2 — Manager + stores (3 days)

- [ ] `SettingsManager extends Manager<ISettingsStore>`.
- [ ] `MemorySettingsStore`, `StorageSettingsStore`, `ApiSettingsStore`,
      `LayeredSettingsStore`.
- [ ] `.notify()` change bus + debouncer.

### Phase 3 — Service (2 days)

- [ ] `SettingsService` — sync `get(dto)` + async `set(key, v)` + subscribe.
- [ ] Deep-merge for partial DTO writes.
- [ ] `SettingsSchemaFetcher` — fetches JSON schemas from configured URL.

### Phase 4 — Nest admin API (3 days)

- [ ] `SettingsAdminController` — GET /schema, GET /:key, PUT /:key.
- [ ] `SettingsPermissionGuard` — composes @stackra/authorization.
- [ ] `SettingsPersistenceService` — DB-backed store adapter (Nest side).

### Phase 5 — React UI (4 days)

- [ ] `<SettingsForm>` — schema-driven HeroUI form.
- [ ] `<SettingsField>` — per-ControlType renderer (Input, Switch, Select,
      Textarea, DatePicker, ColorPicker).
- [ ] `<SettingsResetButton>` — clears local override, falls through to org
      default.
- [ ] Hooks: `useSetting`, `useSettings`, `useCanEditSetting`,
      `useSettingsStatus`.
- [ ] Full `<SettingsPage>` shell w/ navigation.

### Phase 6 — RN UI (2 days)

- [ ] Same DTO surface; HeroUI Native fields (`Switch`, `Select`, `TextField`).
- [ ] Hooks share code with React (both compose the core service).

### Phase 7 — Realtime integration (2 days)

- [ ] `SettingsBroadcastListener` — subscribes to `@stackra/realtime`.
- [ ] Merge strategy — last-writer-wins with source `tabId` tracking.
- [ ] Optional-peer dep on `@stackra/realtime`.

### Phase 8 — Access control integration (2 days)

- [ ] `useCanEditSetting` — reads `@stackra/authorization`.
- [ ] Read-only rendering + tooltip.
- [ ] Nest guard checks + admin API 403 on unauthorised writes.

### Phase 9 — Testing (2 days)

- [ ] Unit tests for every service + registry + store.
- [ ] Integration test — local override wraps remote (write locally → remote
      poll fires → local value STILL wins).
- [ ] Test coverage 90%.

### Phase 10 — Verification + docs (2 days)

- [ ] README documents every subpath + a copy-pasteable "declare-a-setting"
      example.
- [ ] Migration guide from `@stackra/config` for values that shouldn't live
      there (user-editable ones).
- [ ] `.kiro/steering/testing.md` cross-ref.

## Exit criteria

- [ ] 6 subpath exports build cleanly (`.`, `./react`, `./native`, `./nest`,
      `./testing`, barrel).
- [ ] `useSetting()` returns synchronously with the DTO's decorator default on
      first call; re-renders when async hydration completes.
- [ ] Local storage override wraps remote API value (verified in integration
      test).
- [ ] `<SettingsForm>` renders every `ControlType` correctly (visual regression
      test with 12+ field types).
- [ ] Permission-gated fields render read-only when caller lacks permission.
- [ ] Debouncer flushes exactly one write per 300 ms window with 10 rapid
      inputs.
- [ ] Cross-client sync round-trip verified (two browser tabs — write in tab 1,
      tab 2 sees update within 1 s).
- [ ] Admin API validated end-to-end with a Nest e2e test.
- [ ] 90% branch coverage.

## Cross-refs

- ADR-0090, 0091, 0092.
- `.ref/packages/settings` — full reference implementation.
- `.kiro/plans/2026-09-03-config-package.md` — the config package the
  Settings-vs-Config distinction is documented against.
- `@stackra/authorization` (Task 6) — permission gate integration.
- `@stackra/realtime` (Task 32) — optional realtime broadcast.

## Follow-ups

- **Schema evolution** — `@Setting({ version: 2 })` — the service reads a
  migration table when the stored version < current. Ship in v1.1.
- **Import / export** — JSON dump / restore for org-level backups. v1.1.
- **Setting audit trail** — every `.set()` logs to `@stackra/audit` (planned
  package). v1.2.
