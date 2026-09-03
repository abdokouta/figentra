---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/realtime"
anchor_adrs: [ADR-0091, ADR-0092]
depends_on: ["@stackra/contracts", "@stackra/container", "@stackra/identity", "@stackra/observability", "@stackra/coordinator"]
---
# `@stackra/realtime` — implementation plan

## Purpose
Runtime-neutral realtime transport boundary for authenticated subscriptions, typed messages, presence and connection lifecycle. It supports browser, React Native, desktop and Node/NestJS consumers through explicit adapters. Durable domain events remain in services/NATS; realtime is not a source of truth.

## Non-goals
- Durable event storage/replay.
- Cross-service business orchestration.
- Authorization policy ownership.
- Browser-tab leadership implementation; that belongs to `@stackra/coordinator`.

## Public API
```ts
interface RealtimeClient {
  connect(options:ConnectionOptions):Promise<ConnectionState>;
  disconnect(reason?:string):Promise<void>;
  subscribe<T>(channel:string,handler:(message:T)=>void,options?:SubscribeOptions):Unsubscribe;
  publish<T>(channel:string,message:T):Promise<void>;
  presence(channel:string):Promise<PresenceView>;
  state():ConnectionState;
}
interface RealtimeTransport {
  connect(options:TransportOptions):Promise<void>;
  send<T>(message:WireMessage<T>):Promise<void>;
  close():Promise<void>;
  onMessage(handler:(message:WireMessage<unknown>)=>void):Unsubscribe;
}
```

Events/messages include protocol version, connection ID, message ID, channel, tenant context, timestamp and payload schema identifier. Message IDs are used for duplicate-safe delivery on reconnect.

## Source tree
```text
packages/realtime/
├── src/core/{realtime.manager.ts,client.ts,subscription.ts,presence.ts,protocol.ts,errors/,constants/,index.ts}
├── src/transports/{websocket.ts,sse.ts}
├── src/browser/{provider.ts,hooks.ts,index.ts}
├── src/native/{provider.ts,index.ts}
├── src/node/{provider.ts,index.ts}
├── src/worker/{provider.ts,index.ts}
├── src/coordinator/{leader-transport.ts,index.ts}
├── src/testing/{in-memory-transport.ts,mock-client.ts,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Connection lifecycle
States are `disconnected → connecting → connected → reconnecting → closing`. Invalid transitions are typed errors. Connect has a deadline. Reconnect uses capped exponential backoff + jitter. Authentication refresh is explicit and coordinated through Identity/session context; credentials are never placed into channel messages.

## Subscription semantics
Subscriptions require channel authorization metadata. The client maintains bounded subscription count and message-size limits. Unsubscribe is idempotent. A reconnect re-establishes authorized subscriptions from local state but does not silently resubscribe after authorization failure.

## Multi-tab composition
In browsers, `@stackra/coordinator` may elect a leader and provide a cross-tab transport. Only the leader maintains the network socket; followers consume relayed messages. This package exposes a `CoordinatorRealtimeTransport` adapter and contains no leader-election implementation.

## Security
Every server-side subscription is authorized against authenticated principal + tenant + channel/resource. Tokens are short-lived and refreshed through Identity. Channels have maximum name/message sizes and allowlisted patterns. Incoming messages are schema-validated before handler execution. No raw token or secret is logged.

## Reliability/backpressure
Transport reconnects after connection loss. Application messages are at-least-once unless the server contract explicitly says otherwise. Client-side duplicate suppression uses bounded message IDs. Outbound queues have hard limits; overflow rejects the oldest/newest according to a configured policy rather than allocating unbounded memory. Heartbeats detect dead connections.

## Runtime adapters
Browser and RN use platform WebSocket APIs. Node uses WebSocket-compatible transport. Worker deployments use platform-compatible WebSocket/SSE capability where available. Adapter capability discovery is explicit; unsupported presence/stream features return a typed capability error instead of pretending to work.

## Observability
Metrics: active connections, connection failures, reconnect count, subscription count, message rate, message size, handler latency and dropped-message count. OTel spans correlate connection lifecycle and message handling. Payload content is excluded by default.

## Configuration
Connection endpoint, handshake deadline, reconnect limits, heartbeat, subscription/message limits, queue limits, auth refresh strategy and optional coordinator mode are required configuration. Production startup fails for malformed endpoints/security settings.

## Testing
Transport conformance covers connect/disconnect, message parsing, reconnect/backoff, subscription restore, authorization rejection, duplicate messages, backpressure and graceful shutdown. Browser/coordinator integration verifies leader socket takeover. Native/Node/Worker fixtures prove capability reporting.

## Implementation phases
1. Core protocol/client/connection state machine.
2. Subscription/presence and message validation.
3. WebSocket/SSE adapters and runtime exports.
4. Reconnect/backpressure/security.
5. Coordinator leader transport.
6. Testing, observability, load/failure and release verification.

## Exit criteria
- All supported runtimes use the same protocol-neutral client API.
- Network transport adapters pass conformance tests.
- Unauthorized subscriptions fail closed.
- Reconnect and backpressure are bounded.
- Leader-only browser mode works without duplicate sockets.
- No realtime package stores durable business truth.
