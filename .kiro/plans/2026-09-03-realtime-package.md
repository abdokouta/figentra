---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/realtime — architecture plan

**Status:** Planned
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md)
**Reference:** `.ref/packages/realtime/`
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger`, `@stackra/events`, `@stackra/redis` (for cross-server relay)

## Purpose

`@stackra/realtime` is the workspace's canonical real-time transport for
long-lived server-client and client-client channels. Distinct from
`@stackra/events` (in-process) and `@stackra/queue` (async jobs).

Enterprise requirements day one:

- **Multiple transports** — WebSocket (bi-directional), SSE (server-sent
  events, unidirectional), `cross-tab` (proxies through
  `@stackra/coordinator` — a BroadcastChannel-backed leader-election bridge),
  Durable Object (Worker stateful rooms).
- **Rooms** — subscribers join named rooms; server broadcasts to a room.
- **Presence** — track connected users in a room; emit `presence.joined`,
  `presence.left`.
- **Typed event streams** — every message is typed against a schema.
- **Backpressure** — bounded outgoing queue; slow consumers get pruned/dropped
  or disconnected per policy.
- **Reconnection** — client-side reconnect with exponential backoff.
- **Cross-server fan-out** — via Redis pub/sub (single-instance) OR
  NATS/JetStream (multi-DC).
- **Authentication** — token-based; the transport rejects unauthed clients.
- **Rate limiting** — per-connection outbound + inbound rate limits.
- **Message ordering + at-least-once delivery** — via message-id + client
  ack.
- **Heartbeat / ping-pong** — every 30s; disconnect on 3 missed.
- **RN via ws polyfill** — RN doesn't ship native WebSocket in every
  environment; use the `ws` polyfill or React Native's WebSocket.
- **NestJS Gateway integration** — via `@nestjs/websockets`.
- **Cloudflare Durable Objects** — stateful rooms surviving isolate restarts.

## Non-goals

- Full WebRTC signaling (peer-to-peer voice/video is out of scope).
- Real-time collaborative editing (CRDTs; that's a downstream lib on top).
- Video/audio streaming (media servers are separate).

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

`RealtimeManager extends MultipleInstanceManager<IRealtimeConnection>` — an
app can have multiple named channels/servers (a chat WS, a presence WS, an
analytics SSE stream).

```typescript
RealtimeModule.forRoot({
  default: "chat",
  connections: {
    chat: {
      driver: "websocket",
      url: "wss://chat.example.com/ws",
      auth: { type: "bearer", token: () => authService.getToken() },
      reconnect: { attempts: 10, backoff: "exponential" },
    },
    updates: {
      driver: "sse",
      url: "https://api.example.com/updates",
    },
    "cross-tab": {
      // Composes @stackra/coordinator — see
      // .kiro/plans/2026-09-03-coordinator-package.md. The leader tab
      // holds the "primary" WebSocket; followers subscribe via
      // BroadcastChannel and receive relayed messages. One socket per
      // browser, not one per tab.
      driver: "coordinator",
      channel: "app-events",
    },
  },
  // Cross-server relay (server-side only)
  relay: {
    driver: "redis",
    connection: "primary", // @stackra/redis connection
  },
});
```

## Subpath layout (per ADR-0091)

```
packages/realtime/
├── src/
│   ├── core/
│   │   ├── realtime.module.ts
│   │   ├── commands/                  # CLI: realtime:tail, realtime:broadcast
│   │   ├── connectors/                # (drivers) websocket, sse, coordinator
│   │   │   ├── websocket.connector.ts
│   │   │   ├── sse.connector.ts
│   │   │   ├── coordinator.connector.ts   # composes @stackra/coordinator (opt peer)
│   │   │   └── null.connector.ts
│   │   ├── constants/
│   │   ├── decorators/                # @RealtimeSubscribe, @RealtimeRoom
│   │   ├── errors/                    # RealtimeConnectionError, PresenceError
│   │   ├── interfaces/                # from .ref: realtime-connector, realtime-connection, module-options
│   │   ├── presence/                  # presence tracker
│   │   ├── protocol/                  # message framing (JSON default, MessagePack optional)
│   │   ├── rooms/                     # RoomRegistry
│   │   ├── services/                  # RealtimeManager, ReconnectService, HeartbeatService
│   │   ├── utils/                     # backoff, rate limiter, message-id gen
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── realtime.module.ts
│   │   ├── gateways/                  # WebsocketGateway wrapping @nestjs/websockets
│   │   ├── decorators/                # @SubscribeMessage (Nest-compatible)
│   │   ├── health/
│   │   │   └── realtime.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # <RealtimeProvider>
│   │   ├── hooks/                     # useRealtimeConnection, useRoom, usePresence, useRealtimeSubscribe
│   │   └── index.ts
│   │
│   ├── native/
│   │   ├── providers/
│   │   ├── hooks/
│   │   └── index.ts                   # RN WebSocket (built-in) OR ws polyfill
│   │
│   ├── worker/
│   │   ├── realtime.module.ts
│   │   ├── durable-object/
│   │   │   ├── room.durable-object.ts # DO implementing Room state
│   │   │   └── presence.durable-object.ts
│   │   ├── ws-router.ts               # binds fetch handler to WS upgrade
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-realtime.ts           # in-memory Rooms + messages for tests
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                        | Kind      |
| ----------------------------- | --------- |
| `IRealtimeConnection`         | interface |
| `IRealtimeManager`            | interface |
| `IRealtimeConnector`          | interface |
| `IRoom`                       | interface |
| `IPresence`                   | interface |
| `IRealtimeMessage<T>`         | interface |
| `ConnectionState` enum        | enum      |
| `REALTIME_MANAGER`            | token     |
| `REALTIME_CONNECTION`         | token (default) |
| `REALTIME_RELAY`              | token (for cross-server) |
| `RealtimeConnectionError`     | class     |

## Core API (locked)

```typescript
interface IRealtimeConnection {
  // Connection lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getState(): ConnectionState;    // "connecting" | "open" | "closing" | "closed" | "reconnecting"

  // Rooms
  join(room: string, options?: IJoinOptions): Promise<IRoom>;
  leave(room: string): Promise<void>;
  rooms(): IRoom[];

  // Direct messaging (no room)
  send<T>(event: string, payload: T, options?: ISendOptions): Promise<void>;
  request<TReq, TRes>(event: string, payload: TReq, options?: IRequestOptions): Promise<TRes>;

  // Subscriptions
  on<T>(event: string, handler: (msg: IRealtimeMessage<T>) => void): () => void;
  off(event: string, handler?: Function): void;

  // Connection events
  onStateChange(handler: (state: ConnectionState) => void): () => void;
}

interface IRoom {
  readonly name: string;

  send<T>(event: string, payload: T): Promise<void>;
  broadcast<T>(event: string, payload: T): Promise<void>;   // to every member except self
  on<T>(event: string, handler: (msg: IRealtimeMessage<T>) => void): () => void;
  leave(): Promise<void>;

  presence(): IPresence;
}

interface IPresence {
  self(): IPresenceUser;
  users(): IPresenceUser[];
  update(state: Record<string, unknown>): Promise<void>;
  onJoin(handler: (user: IPresenceUser) => void): () => void;
  onLeave(handler: (user: IPresenceUser) => void): () => void;
  onUpdate(handler: (user: IPresenceUser) => void): () => void;
}
```

## Connectors

| Connector           | Home                                                | Runtime         |
| ------------------- | --------------------------------------------------- | --------------- |
| `websocket`         | `core/connectors/websocket.connector.ts`            | Every runtime   |
| `sse`               | `core/connectors/sse.connector.ts`                  | Every runtime   |
| `coordinator`       | `core/connectors/coordinator.connector.ts`          | Browser         |
| `durable-object`    | `worker/durable-object/room.durable-object.ts`      | Cloudflare      |
| `null`              | `core/connectors/null.connector.ts`                 | Every           |

## Leader-only WebSocket pattern — the coordinator connector

When `@stackra/coordinator` (see
[`.kiro/plans/2026-09-03-coordinator-package.md`](./2026-09-03-coordinator-package.md))
is installed in a browser app, realtime composes it as a smart routing layer:

- **Leader tab** — opens the real `websocket` connection.
- **Follower tabs** — subscribe to a shared `BroadcastChannel`; the leader
  relays every incoming WS message via `CoordinatorTransport`.
- **On leader death** — coordinator re-elects; new leader opens a fresh WS;
  followers keep subscribing (no consumer code change).

Consumer wiring:

```typescript
// Consumer app root module
imports: [
  RealtimeModule.forRoot({
    default: "primary",
    connections: {
      // Leader opens this.
      primary: {
        driver: "websocket",
        url: "wss://api.example.com/realtime",
      },
      // Followers subscribe to this instead.
      "cross-tab": { driver: "coordinator" },
    },
  }),
  CoordinatorModule.forRoot({ broadcastEvents: true, ... }),
],
```

Consumer service:

```typescript
@Injectable()
class LiveFeed implements OnModuleInit {
  constructor(
    @Inject(REALTIME_MANAGER) private realtime: RealtimeManager,
    @Inject(TAB_COORDINATOR) private coord: TabCoordinator,
  ) {}

  onModuleInit() {
    this.coord.onRoleChange(async (role) => {
      await this.realtime.disconnect();
      await this.realtime.connect(role === "leader" ? "primary" : "cross-tab");
    });
  }
}
```

Cuts backend connections by 5-20x per user with 5-20 tabs open.

## Cloudflare Durable Objects — stateful rooms

For Worker deployments, rooms live in DOs. Each `IRoom` maps to a DO instance
keyed by room name. Presence + message history + member list survive isolate
restarts.

```typescript
// worker/durable-object/room.durable-object.ts
export class Room implements DurableObject {
  private members = new Map<string, WebSocket>();

  async fetch(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    server.addEventListener("message", (event) => {
      // broadcast to every other member
      for (const [id, ws] of this.members) {
        if (ws !== server) ws.send(event.data);
      }
    });
    this.members.set(crypto.randomUUID(), server);
    return new Response(null, { status: 101, webSocket: client });
  }
}
```

## Cross-server relay (server-side)

For multi-server Node deployments, messages fan out across servers via Redis
pub/sub OR NATS:

```typescript
RealtimeModule.forRoot({
  connections: { ... },
  relay: {
    driver: "redis",
    connection: "primary",
    channelPrefix: "realtime:",
  },
});
```

`RelayService` subscribes to `realtime:*` Redis channels and rebroadcasts to
local WS/SSE clients. Every local message publishes to the relay first, so
every server sees every message.

## Backpressure

Outbound message queue is bounded per connection (default 1000 messages).
When full:

- Policy `drop-oldest` — drops FIFO.
- Policy `disconnect` — kicks the slow consumer.
- Policy `pause` — pauses send loop, buffers upstream (dangerous).

## Reconnection

Client automatically reconnects with exponential backoff + jitter:

```
attempt 1: 1s
attempt 2: 2s
attempt 3: 4s
attempt 4: 8s + jitter
...
```

Bound at `maxDelayMs`. On successful reconnect, resubscribes to every joined
room + replays acked-not-delivered messages.

## Auth

Every connect includes an auth token:

```typescript
{
  auth: {
    type: "bearer",
    token: () => authService.getToken(),
    onExpired: async () => authService.refresh(),
  },
}
```

Server-side validates the token, associates the connection with a user, emits
`realtime.authenticated` event.

## Hooks (React)

```typescript
function ChatRoom({ roomId }: { roomId: string }) {
  const conn = useRealtimeConnection();
  const room = useRoom(conn, roomId);
  const presence = usePresence(room);

  useRealtimeSubscribe(room, "message", (msg) => {
    console.log("received", msg.payload);
  });

  const send = () => room.send("message", { text: "hi" });

  return (
    <>
      <h1>Members: {presence.users.length}</h1>
      <button onClick={send}>Say hi</button>
    </>
  );
}
```

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@stackra/redis": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "@nestjs/websockets": "catalog:nestjs",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "ws": "^8.18.0"
  },
  "peerDependenciesMeta": {
    "@stackra/redis": { "optional": true },
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "@nestjs/websockets": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "ws": { "optional": true }
  }
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

### Phase 2 — Core (4 days)

- [ ] `RealtimeManager`, `RoomRegistry`, `Presence`, `Heartbeat`,
      `ReconnectService`.
- [ ] `WebsocketConnector`, `SseConnector`, `CoordinatorConnector` (composes
      `@stackra/coordinator` as optional peer),
      `NullConnector`.
- [ ] Message framing + serialization.
- [ ] Rate limiter + backpressure.
- [ ] `@RealtimeSubscribe`, `@RealtimeRoom` decorators.

### Phase 3 — NestJS (3 days)

- [ ] `RealtimeModule.forRoot()`.
- [ ] `WebsocketGateway` wrapping `@nestjs/websockets`.
- [ ] `RealtimeHealthIndicator`.

### Phase 4 — Cloudflare Worker (3 days)

- [ ] `Room` Durable Object.
- [ ] `Presence` Durable Object.
- [ ] `ws-router.ts` — Worker fetch handler upgrades to WS + routes to DO.

### Phase 5 — React + RN (2 days)

- [ ] `<RealtimeProvider>` + hooks.
- [ ] RN — same hooks, but tests platform WebSocket + fallback ws polyfill.

### Phase 6 — Cross-server relay (2 days)

- [ ] `RelayService` — Redis pub/sub bridge.
- [ ] NATS variant future work.

### Phase 7 — Testing (1 day)

- [ ] `MockRealtime` — in-memory Rooms + messages.

### Phase 8 — Docs + release (2 days)

**Total effort:** 19 days.

## Success criteria

- [ ] 6 subpath exports build cleanly.
- [ ] WebSocket round-trip (send/receive) works browser ↔ Nest server.
- [ ] Room broadcast fans out to every joined client.
- [ ] Presence tracks user joins/leaves.
- [ ] Reconnect after network drop, re-subscribes to joined rooms.
- [ ] Cloudflare DO room works via Miniflare.
- [ ] Redis relay: 2 Nest servers see each other's messages.
- [ ] SSE stream: one-way updates to browser client.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/plans/2026-09-03-events-package.md` — in-process events (distinct
  from realtime cross-network).
- `.kiro/plans/2026-09-03-redis-package.md` — pub/sub relay backing.
- `.kiro/plans/2026-09-03-network-package.md` — reconnect gates on network
  online.
- `.ref/packages/realtime/` — reference.
