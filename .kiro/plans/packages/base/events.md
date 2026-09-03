---
status: canonical
component: package
package: "@stackra/events"
owner: platform
source: migrated from 2026-09-03-events-package.md
---
# `@stackra/events` — implementation-complete plan

## Purpose
Typed in-process event bus for decoupling modules inside one runtime/service. It is not cross-service messaging, a durable event log, or realtime transport.

## Non-goals
Cross-service delivery belongs to NATS/JetStream and outbox; durable replay belongs to event infrastructure; cross-tab coordination belongs to `@stackra/coordinator`; realtime channels belong to `@stackra/realtime`.

## Source layout
```text
src/core/{emitter,decorators,registry,discovery,errors,utils}/
src/nestjs/
src/react/
src/native/
src/worker/
src/testing/
src/index.ts
```

## Contracts
`IEventEmitter`, `IEventSubscriber`, `ISubscribeOptions`, `IEventErrorHandler`, `EVENT_EMITTER`, `EVENT_ERROR_HANDLER`. Event names and payload types are defined in `@stackra/contracts/events` and never as anonymous string literals in business modules.

```ts
interface IEventEmitter {
  emit<T>(event: string, payload: T): void;
  emitAsync<T>(event: string, payload: T): Promise<void>;
  on<T>(event:string, handler:(payload:T)=>void|Promise<void>, options?:ISubscribeOptions):()=>void;
  once<T>(event:string, handler:(payload:T)=>void|Promise<void>):()=>void;
  off(event:string, handler?:Function):void;
  listeners(event:string):readonly IEventSubscriber[];
  clear(event?:string):void;
}
interface ISubscribeOptions { priority?:number; once?:boolean; handler?:string }
```

## Delivery semantics
`emit` executes synchronous handlers without awaiting asynchronous work; `emitAsync` awaits all handlers. Subscribers are ordered by ascending priority. A subscriber failure is isolated and routed to the error handler; it does not prevent remaining subscribers from executing. Wildcards are supported for explicitly registered patterns and are discouraged for business logic.

## Auto-discovery
`@OnEvent(event, options)` records metadata. NestJS bootstrap uses the platform discovery abstraction to locate providers and register decorated methods. Duplicate registration is detected. Shutdown unregisters listeners and releases resources.

## Error handling
The default handler sends event name, subscriber identity and sanitized failure information to `@stackra/logger`. Payloads are redacted according to logging classification. Consumers may provide a handler for telemetry, but event errors do not silently disappear.

## Runtime behavior
Node/NestJS uses application-scoped emitter; request-scoped dependencies are resolved within subscriber execution. Workers bind lifecycle to invocation and use platform `waitUntil` for work that must outlive the response. Browser/native use the same core API. Cross-tab fan-out is composed through coordinator transport and is never duplicated here.

## Testing API
`createEventRecorder`, `assertEmitted`, `assertEmittedOnce`, `assertNotEmitted`, `emittedFor`. Tests cover priority, once/off, wildcard matching, async completion, error isolation, discovery, duplicate registration and runtime lifecycle.

## Performance/limits
Event name length, subscriber count and payload size are bounded. Handler execution has no implicit retry. Long-running work must move to a durable worker/queue. Recursive event loops are detected or prevented through execution metadata and explicit depth limits.

## Security
No credentials or raw sensitive payloads in diagnostics. Events do not cross tenant boundaries unless the payload and subscriber are explicitly authorized by the owning service.

## Completion criteria
All in-process events are catalogued and typed; decorated subscribers auto-register; production and worker lifecycle semantics are tested; no legacy CrossTabAdapter or cross-service transport code exists in this package.