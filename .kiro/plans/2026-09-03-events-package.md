---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/events — architecture plan

**Status:** Planned **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/events/` **Depends on:** `@stackra/container` (Task 13),
`@stackra/contracts` (Task 6), `@stackra/logger` (event trace logging)

## Purpose

`@stackra/events` is the workspace's canonical IN-PROCESS event bus. Distinct
from `@stackra/queue` (job dispatch) and `@stackra/realtime` (cross-network
pub/sub) — this is process-local, synchronous OR async, type-safe pub/sub for
decoupled communication INSIDE a single service.

Enterprise requirements day one:

- **Typed events** — every event has a payload type validated at compile time.
  No `emit(name, anyPayload)`.
- **Event catalogue** — every event owned by a domain lives in a
  `<domain>.events.ts` file per `.kiro/steering/events-authoring.md`.
- **Auto-discovery** — `@OnEvent(EVENT_NAME)`-decorated methods auto-register
  via `IDiscoveryService`.
- **Ordered delivery** — subscribers can declare `priority` to guarantee order
  (100 = default; 0 = first, 1000 = last).
- **Wildcard subscription** — `@OnEvent("user.*")` matches all `user.*` events
  (rare; discouraged; used for observability).
- **Async + sync semantics** — subscribers can `return void | Promise<void>`;
  emit awaits every subscriber when called via `emitAsync`.
- **Error isolation** — one subscriber throwing does NOT kill others; every
  error routes to `EVENT_ERROR_HANDLER` (defaults to logger error).
- **Cross-tab (browser)** — optional relay through BroadcastChannel for
  cross-tab event fan-out.
- **Cross-runtime** — same API on browser, RN, Worker, NestJS server.
- **Test primitives** — `assertEmitted(EVENT, payload?)`,
  `assertNotEmitted(EVENT)`, `emittedFor(EVENT)`.

## Non-goals

- Cross-service event dispatch (that's `@stackra/queue` + NATS per
  ADR-0018/0020).
- Persistent event log for replay (that's ADR-0059 outbox + ADR-0065 event
  sourcing).
- Real-time pub/sub over the wire (that's `@stackra/realtime`).

## Package pattern — NOT driver-based

`@stackra/events` is NOT `Manager<T>`-shaped because there's ONE bus per
application. No swappable drivers. The abstraction that swaps is the event-name
catalogue, not the emitter.

For cross-tab semantics, an optional adapter layer (`CrossTabAdapter`) mounts on
top; not a driver-manager pattern.

## Subpath layout (per ADR-0091)

```
packages/events/
├── src/
│   ├── core/
│   │   ├── events.module.ts
│   │   ├── commands/                  # CLI: events:list, events:trace
│   │   ├── constants/                 # metadata keys (ON_EVENT_METADATA, etc.)
│   │   ├── decorators/                # @OnEvent, @OnAnyEvent
│   │   ├── errors/                    # EventValidationError, EventBusError
│   │   ├── hooks/                     # useOnEvent (cross-platform), useEmit
│   │   ├── interfaces/                # local
│   │   ├── registries/                # EventCatalogueRegistry
│   │   ├── services/                  # EventEmitter, EventSubscribersLoader
│   │   ├── utils/                     # wildcard matcher, priority sort
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── events.module.ts
│   │   └── index.ts
│   │
│   ├── react/                         # cross-platform via core
│   │   ├── providers/                 # <EventBusProvider>
│   │   ├── hooks/                     # useOnEvent, useEmit (from core)
│   │   └── index.ts
│   │
│   ├── native/
│   │   └── index.ts                   # same as react/
│   │
│   ├── worker/
│   │   ├── events.module.ts           # per-request or global emitter
│   │   ├── waituntil-flush.ts         # async subscribers flushed via ctx.waitUntil()
│   │   └── index.ts
│   │
│   └── testing/
│       ├── event-recorder.ts          # captures every emit for assertions
│       ├── mock-event-bus.ts
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                 | Kind      |
| ---------------------- | --------- |
| `IEventEmitter`        | interface |
| `IEventPayload<T>`     | interface |
| `IEventSubscriber<T>`  | interface |
| `IEventErrorHandler`   | interface |
| `EVENT_EMITTER`        | token     |
| `EVENT_ERROR_HANDLER`  | token     |
| `EventValidationError` | class     |
| `EventBusError`        | class     |

Every DOMAIN also ships its own `<domain>.events.ts` in
`@stackra/contracts/events/`:

```typescript
// @stackra/contracts/events/user.events.ts
export const USER_EVENTS = {
  CREATED: "user.created",
  UPDATED: "user.updated",
  DELETED: "user.deleted",
} as const;

export type UserCreatedPayload = { userId: string; email: string };
export type UserUpdatedPayload = { userId: string; changes: Partial<IUser> };
export type UserDeletedPayload = { userId: string; deletedAt: string };
```

## Core API (locked)

```typescript
interface IEventEmitter {
  emit<TPayload>(event: string, payload: TPayload): void;
  emitAsync<TPayload>(event: string, payload: TPayload): Promise<void>;

  on<TPayload>(
    event: string,
    handler: (payload: TPayload) => void | Promise<void>,
    options?: ISubscribeOptions,
  ): () => void;
  once<TPayload>(
    event: string,
    handler: (payload: TPayload) => void | Promise<void>,
  ): () => void;
  off(event: string, handler?: Function): void;

  listeners(event: string): IEventSubscriber[];
  listenerCount(event: string): number;
  hasListeners(event: string): boolean;

  clear(event?: string): void;
}

interface ISubscribeOptions {
  priority?: number; // default 100; lower = earlier
  once?: boolean;
  handler?: string; // human-readable name for diagnostics
}
```

## `@OnEvent` decorator + auto-discovery

```typescript
@Injectable()
export class WelcomeEmailProcessor {
  public constructor(
    @Inject(EMAIL_SERVICE) private readonly mail: IEmailService,
  ) {}

  @OnEvent(USER_EVENTS.CREATED, { priority: 50 })
  public async onUserCreated(payload: UserCreatedPayload): Promise<void> {
    await this.mail.sendTemplate("welcome", { userId: payload.userId });
  }
}
```

`EventSubscribersLoader` walks
`IDiscoveryService.getProvidersByMetadata(ON_EVENT_METADATA)` at
`OnApplicationBootstrap`, extracts `(event, priority, methodName)`, and
registers each with the bus. Zero manual wiring.

Type-safety at the decorator level via TypeScript's `satisfies` + string literal
narrowing:

```typescript
@OnEvent(USER_EVENTS.CREATED)  // typed as "user.created"
public async onUserCreated(payload: UserCreatedPayload): Promise<void> { ... }
//                                  ^ compile-time enforcement via TypeScript's flow analysis
```

The `EventCatalogueRegistry` in `core/registries/` maps event NAME to payload
TYPE (registered by contracts). At emit time, the bus verifies the emitted
payload matches the registered type (dev-only assertion; stripped in prod).

## React hooks (cross-platform)

```typescript
// packages/events/src/core/hooks/use-on-event.hook.ts
export function useOnEvent<TPayload>(
  event: string,
  handler: (payload: TPayload) => void | Promise<void>,
  deps: unknown[] = [],
): void {
  const emitter = useInject<IEventEmitter>(EVENT_EMITTER);
  useEffect(() => {
    return emitter.on(event, handler);
  }, [event, emitter, ...deps]);
}
```

Same file works on React DOM AND React Native — pure React + hook composition
per ADR-0091 §Rule 3.

## Cross-tab relay — delegated to `@stackra/coordinator`

**Cross-tab relay is NOT owned by this package.** `@stackra/coordinator`
(`.ref/packages/coordinator/`, see
[`.kiro/plans/2026-09-03-coordinator-package.md`](./2026-09-03-coordinator-package.md))
owns the primitive: leader election + `CoordinatorTransport` that automatically
relays events matching `broadcastPatterns` across every open tab. Events
declares `@stackra/coordinator` as an OPTIONAL peer.

Composition — no wiring needed in consumer code:

```typescript
// packages/events/src/react/web-events.module.ts (composed by consumer app)
imports: [
  EventsModule.forRoot({...}),
  CoordinatorModule.forRoot({
    broadcastEvents: true,
    broadcastPatterns: ["auth:**", "session:**", "state:**"],
  }),
],
```

The old `CrossTabAdapter` referenced below IS retired in favour of coordinator's
`CoordinatorTransport`. Do NOT ship both — they'd double-fire every event.

## Legacy note — retired `CrossTabAdapter`

Some browser use-cases need cross-tab event fan-out (login in one tab → other
tabs receive `session.updated`). The `CrossTabAdapter` mounts:

```typescript
EventsModule.forRoot({
  crossTab: {
    channel: "app-events",
    events: ["session.updated", "cart.cleared"], // whitelist
  },
});
```

Uses `BroadcastChannel` in browsers, no-ops in Worker/RN/Node.

## Error handling

Every subscriber runs in a `try/catch`; errors route to the
`EVENT_ERROR_HANDLER`:

```typescript
{
  provide: EVENT_ERROR_HANDLER,
  useFactory: (logger: ILogger) => new LoggerEventErrorHandler(logger),
  inject: [LOGGER],
}
```

Default handler logs `error` with event name + subscriber name + payload
(redacted per logger rules). Consumers can override for e.g. Sentry capture.

## Worker semantics

Worker `EventBus` is per-request (bound to fetch scope) OR global (module-init
scope). For async subscribers running past request end, wrap in
`ctx.waitUntil()` via the `waituntil-flush.ts` helper — otherwise Cloudflare
kills the isolate at response send.

## Test primitives

```typescript
import { createEventRecorder } from "@stackra/events/testing";

const recorder = createEventRecorder();
container.overrideProvider(EVENT_EMITTER).useValue(recorder);

// Act
await service.createUser({ email: "a@b.com" });

// Assert
recorder.assertEmitted(USER_EVENTS.CREATED, { email: "a@b.com" });
recorder.assertEmittedOnce(USER_EVENTS.CREATED);
recorder.assertNotEmitted(USER_EVENTS.DELETED);
expect(recorder.emittedFor(USER_EVENTS.CREATED)).toHaveLength(1);
```

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (1 day)

- [ ] `packages/contracts/src/interfaces/events/*.interface.ts`.
- [ ] `packages/contracts/src/tokens/events.tokens.ts`.
- [ ] `packages/events/` scaffold with 6 subpaths.

### Phase 2 — Core (3 days)

- [ ] `EventEmitter` w/ priority sort, wildcard matcher.
- [ ] `@OnEvent`, `@OnAnyEvent` decorators.
- [ ] `EventCatalogueRegistry` — event-name → payload-type map.
- [ ] `EventSubscribersLoader` — auto-discovery.
- [ ] `useOnEvent` + `useEmit` cross-platform hooks.
- [ ] Default `EVENT_ERROR_HANDLER`.

### Phase 3 — NestJS (1 day)

- [ ] `EventsModule.forRoot()`.
- [ ] Health indicator: `event.subscribers.count`.

### Phase 4 — Worker (1 day)

- [ ] Per-request emitter binding.
- [ ] `waituntil-flush` for async subscribers.

### Phase 5 — Cross-tab (0 days — delegated)

- Cross-tab relay lives in `@stackra/coordinator`
  ([`2026-09-03-coordinator-package.md`](./2026-09-03-coordinator-package.md)).
  This package declares an OPTIONAL peer on `@stackra/coordinator` and ships
  ZERO cross-tab code. Consumers compose
  `CoordinatorModule.forRoot({ broadcastEvents: true, broadcastPatterns: [...] })`
  alongside `EventsModule.forRoot(...)` to enable cross-tab fan-out.

### Phase 6 — React + RN (1 day)

- [ ] `<EventBusProvider>` composition.
- [ ] `useOnEvent`, `useEmit` in `react/` + `native/` (re-export core).

### Phase 7 — Testing (1 day)

- [ ] `createEventRecorder()` w/ full assertion API.

### Phase 8 — Docs + release (1 day)

**Total effort:** 9 days.

## Success criteria

- [ ] 6 subpath exports build cleanly.
- [ ] `@OnEvent`-decorated methods auto-register at bootstrap.
- [ ] Priority ordering: subscribers run in ascending priority order.
- [ ] Wildcard: `@OnEvent("user.*")` fires on `user.created` + `user.updated`.
- [ ] Error isolation: one thrower doesn't kill others; error hits handler.
- [ ] Cross-tab relay round-trip verified.
- [ ] `EventRecorder.assertEmitted()` matches shape.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/steering/events-authoring.md` — event catalogue rules.
- `.kiro/plans/2026-09-03-queue-package.md` — cross-service event dispatch
  (queue is for cross-service; events is in-process).
- `.kiro/plans/2026-09-03-realtime-package.md` — cross-network pub/sub.
- `.ref/packages/events/` — reference (event-emitter, subscribers-loader).
