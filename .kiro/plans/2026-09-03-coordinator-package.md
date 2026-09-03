---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://cross-tab-coordinator-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/coordinator` — cross-tab coordination package

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/coordinator/` (`@stackra/coordinator` v0.1.0) **Depends on:**
`@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support`, `@stackra/logger` (optional) **Design effort:** 18 days
across 8 phases

## Purpose

Cross-tab coordination for browser apps. Elect ONE tab as the leader; every
other tab is a follower. Route cross-tab events + distributed locks through the
same primitive. Zero server dependency — uses **Web Locks API** (modern, atomic
lock semantics) with a **BroadcastChannel + localStorage-CAS** fallback for
Safari + older browsers.

Motivating scenarios:

- **Single WebSocket per browser** — `@stackra/realtime` composes coordinator so
  only the leader tab opens the socket; followers subscribe via
  BroadcastChannel. Cuts backend connections by 5-20x per user.
- **Deduped background sync** — only the leader runs the "refresh every 30 s"
  job; followers wait. Saves server load + battery.
- **Cross-tab event fan-out** — `@stackra/events` composes coordinator so events
  matching `broadcastPatterns` fire on every tab. Login in one tab → every other
  tab receives `session.updated`.
- **Atomic token refresh** — only ONE tab refreshes the JWT at a time. The
  others `await` the leader's result.

## Non-goals

- Cross-**browser** coordination — that's a server-side job (WebSocket + Redis
  pub/sub, delegated to `@stackra/realtime` + `@stackra/redis`).
- Cross-**device** synchronisation — same story.
- Persistent state — coordinator is stateless; state lives in `@stackra/storage`
  or `@stackra/cache`.
- Cross-runtime — this package is BROWSER-ONLY. Node / Worker / RN import a
  no-op transport so the DI graph stays clean but `TabCoordinator.getRole()`
  returns `"leader"` unconditionally (single-runtime = always leader).

## Manager pattern — Manager (Shape A per ADR-0090)

`TabTransportManager extends Manager<ITabTransport>` — Shape A because ONE
transport is active at a time (BroadcastChannel is the only real driver; `noop`
is the RN / Worker / Node fallback).

```typescript
{
  default: "broadcast-channel",
  channels: {
    "broadcast-channel": { driver: "broadcast-channel", channelName: "stackra" },
    "noop": { driver: "noop" },
  },
}
```

The runtime picks the driver via `typeof BroadcastChannel !== "undefined"`.

## Subpath layout — cross-runtime per ADR-0091

```
packages/coordinator/
├── package.json                          # 4 subpath exports
├── catalog.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── core/                             # ".": platform-agnostic
│   │   ├── coordinator.module.ts         # forRoot({ channelName, heartbeatMs, ... })
│   │   ├── constants/
│   │   │   └── default-options.ts
│   │   ├── decorators/
│   │   │   ├── inject-tab-coordinator.decorator.ts
│   │   │   └── inject-lock-manager.decorator.ts
│   │   ├── enums/
│   │   │   ├── tab-role.enum.ts          # 'leader' | 'follower' | 'unknown'
│   │   │   └── lock-mode.enum.ts         # 'exclusive' | 'shared'
│   │   ├── errors/
│   │   │   ├── lock-timeout.error.ts
│   │   │   └── lock-acquisition.error.ts
│   │   ├── interfaces/
│   │   │   ├── tab-coordinator.interface.ts
│   │   │   ├── lock-manager.interface.ts
│   │   │   ├── tab-transport.interface.ts
│   │   │   ├── tab-info.interface.ts
│   │   │   └── coordinator-options.interface.ts
│   │   ├── services/
│   │   │   ├── tab-coordinator.service.ts         # elects leader, tracks tabs
│   │   │   ├── lock-manager.service.ts            # Web Locks + CAS fallback
│   │   │   ├── coordinator-transport.service.ts   # bridges @stackra/events
│   │   │   └── tab-transport-manager.service.ts   # Manager<ITabTransport>
│   │   ├── transports/
│   │   │   ├── broadcast-channel-tab.transport.ts # browser-native
│   │   │   └── noop-tab.transport.ts              # RN / Worker / Node
│   │   ├── types/
│   │   │   └── message-envelope.type.ts
│   │   ├── utils/
│   │   │   ├── generate-tab-id.util.ts             # crypto.randomUUID()
│   │   │   ├── web-locks-supported.util.ts
│   │   │   └── heartbeat-scheduler.util.ts
│   │   └── index.ts
│   │
│   ├── react/                            # "./react": browser hooks
│   │   ├── web-coordinator.module.ts
│   │   ├── contexts/
│   │   │   └── coordinator.context.ts
│   │   ├── providers/
│   │   │   └── coordinator.provider.tsx
│   │   ├── hooks/
│   │   │   ├── use-tab-coordinator.hook.ts
│   │   │   ├── use-is-leader.hook.ts
│   │   │   ├── use-tab-count.hook.ts
│   │   │   ├── use-tab-role.hook.ts
│   │   │   └── use-cross-tab-lock.hook.ts
│   │   └── index.ts
│   │
│   └── testing/                          # "./testing"
│       ├── mock-tab-coordinator.ts       # scriptable role transitions
│       ├── in-memory-transport.ts        # tab-to-tab in one JS process
│       └── index.ts
│
└── __tests__/
    ├── unit/
    │   ├── tab-coordinator.test.ts
    │   ├── lock-manager.test.ts
    │   ├── coordinator-transport.test.ts
    │   └── broadcast-channel-transport.test.ts
    └── integration/
        └── multi-tab-election.test.ts
```

## Public API — locked

| Symbol                  | Kind         |
| ----------------------- | ------------ |
| `TabCoordinator`        | class        |
| `LockManager`           | class        |
| `CoordinatorTransport`  | class        |
| `TabTransportManager`   | class        |
| `TAB_COORDINATOR`       | token        |
| `LOCK_MANAGER`          | token        |
| `COORDINATOR_TRANSPORT` | token        |
| `COORDINATOR_EVENTS`    | const object |
| `TabRole`               | enum         |
| `LockMode`              | enum         |
| `ITabInfo`              | interface    |
| `ICoordinatorOptions`   | interface    |

### Cross-tab events

```typescript
export const COORDINATOR_EVENTS = {
  LEADER_ELECTED: "coordinator.leader.elected",
  LEADER_RESIGNED: "coordinator.leader.resigned",
  TAB_JOINED: "coordinator.tab.joined",
  TAB_LEFT: "coordinator.tab.left",
} as const;
```

## Leader election — two strategies

**Strategy 1 — Web Locks (preferred).** `navigator.locks.request()` with
`{ steal: false, mode: "exclusive" }` gives atomic acquire semantics. First tab
wins the lock; when it closes, the browser releases the lock and the next tab
wins immediately. No timing hacks, no race conditions.

**Strategy 2 — Heartbeat protocol (Safari fallback).** Every tab writes a
heartbeat to a shared `localStorage` key with its `tabId` + timestamp every
`heartbeatMs` ms (default 1000). A tab claims leadership when the current
leader's heartbeat is `> staleThresholdMs` old (default 3000). Compare-and-swap
via `localStorage.setItem` (atomic on same-origin same-frame).

Runtime picks Strategy 1 when `preferWebLocks: true` AND
`navigator.locks !== undefined`. Falls back to Strategy 2 in Safari < 15.4 and
old Edge / Firefox.

## LockManager — cross-tab mutex

```typescript
await locks.run(
  "token-refresh",
  async () => {
    const token = await api.refresh();
    await cache.set("token", token);
    return token;
  },
  { timeoutMs: 10_000 },
);
```

Only one tab per browser executes the callback at a time. Every other tab waits
(or throws `LockTimeoutError` on `timeoutMs`). Uses Web Locks API when
available; localStorage-CAS fallback for older browsers.

## Composition — how events + realtime use coordinator

### `@stackra/events` cross-tab relay

```typescript
// packages/events/src/react/web-events.module.ts
imports: [
  CoordinatorModule.forRoot({
    broadcastEvents: true,
    broadcastPatterns: ["auth:**", "session:**", "state:**"],
  }),
],
```

`CoordinatorTransport` subscribes to `@stackra/events` and re-fires matching
events on every tab via `BroadcastChannel`. Zero API surface change to consumers
of `@stackra/events` — they call `events.emit("session.updated", ...)` as usual;
coordinator handles the fan-out.

### `@stackra/realtime` leader-only WebSocket

```typescript
// consumer usage
@Injectable()
class RealtimeConsumer implements OnModuleInit {
  constructor(
    @Inject(REALTIME_MANAGER) private realtime: RealtimeManager,
    @Inject(TAB_COORDINATOR) private coord: TabCoordinator,
  ) {}

  async onModuleInit() {
    this.coord.onRoleChange(async (role) => {
      if (role === "leader") {
        // Leader opens the WebSocket
        await this.realtime.connect("primary");
      } else {
        // Followers subscribe to BroadcastChannel — leader relays every
        // WS message via coordinator's cross-tab transport.
        await this.realtime.connect("cross-tab");
      }
    });
  }
}
```

Realtime's connectors registry gains a `"cross-tab"` alias whose transport IS
the coordinator's BroadcastChannel. Followers see WS messages relayed by the
leader; when the leader closes, election runs, the new leader takes over the
socket.

## Options

| Option                   | Default                              | Purpose                                                          |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `channelName`            | `'stackra-coordinator'`              | BroadcastChannel name (isolates apps on the same origin)         |
| `heartbeatMs`            | `1000`                               | Leader liveness ping interval                                    |
| `staleThresholdMs`       | `3000`                               | Time after which the leader is considered dead                   |
| `broadcastEvents`        | `true`                               | Enable cross-tab event relay                                     |
| `broadcastPatterns`      | `['sync:**', 'auth:**', 'state:**']` | Wildcard patterns to relay                                       |
| `preferWebLocks`         | `true`                               | Use Web Locks API for distributed locks (fallback: localStorage) |
| `preferWebLocksElection` | `true`                               | Use Web Locks for leader election (fallback: heartbeat protocol) |
| `preferVisibleLeader`    | `false`                              | Prefer the visible/focused tab as leader                         |

## React hooks

```tsx
import {
  useIsLeader,
  useTabCount,
  useTabRole,
  useCrossTabLock,
} from "@stackra/coordinator/react";

function SyncStatus() {
  const isLeader = useIsLeader(); // boolean
  const tabCount = useTabCount(); // number
  const role = useTabRole(); // 'leader' | 'follower'
  return isLeader ? <Badge>Syncing</Badge> : <span>{tabCount} tab(s)</span>;
}

function AtomicButton() {
  const { run, isRunning } = useCrossTabLock("expensive-op");
  return (
    <Button
      onPress={() => run(() => performExpensiveWork())}
      isLoading={isRunning}
    >
      Sync all tabs
    </Button>
  );
}
```

## Testing

- `MockTabCoordinator` — scriptable `role` transitions; consumer tests simulate
  elections without a real browser.
- `InMemoryTransport` — every tab lives in one JS process; useful for
  integration tests without spinning up N Playwright contexts.
- Coverage target: 90% branch coverage per the workspace testing standard.

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton per `.kiro/steering/package-conventions.md`.
- [ ] `tsup.config.ts` w/ 4 entries (`core`, `react`, `testing`, plus barrel).
- [ ] `catalog.json` with `optional_peer_deps`.

### Phase 2 — Core (3 days)

- [ ] `TabCoordinator` service — heartbeat scheduler + role change bus.
- [ ] `TabTransportManager extends Manager<ITabTransport>`.
- [ ] `BroadcastChannelTabTransport` — encode/decode envelopes.
- [ ] `NoopTabTransport` — RN / Worker / Node fallback.

### Phase 3 — Election strategies (3 days)

- [ ] Web Locks strategy — `navigator.locks.request` w/ steal semantics.
- [ ] Heartbeat protocol — localStorage-CAS + stale-check.
- [ ] Auto-selection based on browser support.

### Phase 4 — LockManager (2 days)

- [ ] Web Locks-backed `.run(name, fn, opts)` primitive.
- [ ] CAS fallback for older browsers.
- [ ] `LockTimeoutError` + `LockAcquisitionError` handling.

### Phase 5 — CoordinatorTransport for events (2 days)

- [ ] Listen to `@stackra/events`; match `broadcastPatterns`; relay.
- [ ] Re-fire on receiver side; avoid re-emit loops (envelope carries origin
      `tabId`).
- [ ] Optional-peer dep on `@stackra/events`.

### Phase 6 — React bindings (2 days)

- [ ] `WebCoordinatorModule` + `<CoordinatorProvider>`.
- [ ] Hooks: `useIsLeader`, `useTabCount`, `useTabRole`, `useCrossTabLock`.

### Phase 7 — Testing (2 days)

- [ ] `MockTabCoordinator`, `InMemoryTransport`.
- [ ] Multi-tab election tests using multiple `BroadcastChannel` instances in
      one process.

### Phase 8 — Verification (3 days)

- [ ] Playwright integration test — 3 real browser tabs, kill leader, verify new
      leader elected within 3× `heartbeatMs`.
- [ ] `@stackra/events` composition test — cross-tab event round-trip.
- [ ] `@stackra/realtime` composition test — follower receives leader's WS
      messages via BC.
- [ ] Docs + README updated to point at `@stackra/coordinator`.

## Exit criteria

- [ ] 4 subpath exports build cleanly (`.`, `./react`, `./testing`, barrel).
- [ ] `TabCoordinator.getRole()` returns `"leader"` in the ONLY open tab
      immediately after boot.
- [ ] Opening a second tab produces exactly one leader (verified in Playwright).
- [ ] `LockManager.run()` serialises callbacks across tabs.
- [ ] `@stackra/events` cross-tab relay round-trip verified.
- [ ] `@stackra/realtime` composition (leader-only WebSocket) verified with a
      test app.
- [ ] 90% branch coverage.

## Cross-refs

- ADR-0090, 0091, 0092.
- `.ref/packages/coordinator` — full reference implementation.
- `.kiro/plans/2026-09-03-events-package.md` §"Cross-tab relay" — delegates to
  this package.
- `.kiro/plans/2026-09-03-realtime-package.md` §"Leader-only WebSocket" —
  composes this package.

## Follow-ups

- SharedWorker-based transport for very high-throughput cross-tab cases
  (currently deferred; BroadcastChannel is enough for the events volumes we
  ship).
- `@stackra/coordinator/native` subpath — react-native single-runtime shim
  (`getRole` always `"leader"`; `run(fn)` runs `fn` directly). Not shipped in v1
  — RN doesn't have the multi-tab problem.
