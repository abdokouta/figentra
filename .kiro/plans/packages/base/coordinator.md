---
status: canonical
component: package
package: "@stackra/coordinator"
owner: platform
source: migrated from coordinator draft
---
# `@stackra/coordinator` — implementation-complete plan

## Purpose
Coordinate multiple application contexts, especially browser tabs/windows, without turning coordination into business state. It provides leader election, transport, heartbeats and bounded message routing.

## API
```ts
interface Coordinator { start():Promise<void>; stop():Promise<void>; isLeader():boolean; onMessage<T>(type:string,handler:(message:T)=>void):()=>void; publish<T>(type:string,message:T):Promise<void> }
interface CoordinatorTransport { send<T>(message:T):Promise<void>; subscribe<T>(handler:(message:T)=>void):()=>void; close():Promise<void> }
```
`CoordinatorOptions` declares channel name, instance ID, heartbeat interval, lease timeout and allowlisted broadcast patterns.

## Ownership
Coordinator owns process/tab coordination only. Events owns in-process event delivery; realtime owns network channels; application services own business state. Cross-tab event fan-out is an optional composition between Events and Coordinator.

## Leader election
A lease-based election is used where the runtime provides shared coordination storage. Instances have random stable IDs. Heartbeats refresh the lease. Expired leaders are replaced after a bounded randomized delay. Split-brain mitigation uses monotonically increasing leadership epochs; consumers reject stale epochs.

## Browser/runtime adapters
Browser uses `BroadcastChannel` with a storage/lock mechanism suitable for the deployment. Worker/Node can use explicit transport adapters when multi-instance coordination is actually required. Unsupported runtimes use a single-instance transport rather than a fake distributed implementation.

## Reliability/security
Messages are bounded by type and size. Only configured patterns are broadcast. Sensitive authentication/credential payloads are forbidden. Duplicate delivery is expected and handlers must be idempotent. Transport failure causes loss of coordination messages, never corruption of business state.

## Lifecycle
`start` acquires resources and begins heartbeats; `stop` relinquishes leadership and closes transport. Repeated lifecycle calls are safe. Page suspension and worker termination are treated as abrupt loss and recovered through lease expiry.

## Testing
Leader election, simultaneous startup, lease expiry, stale epoch rejection, duplicate messages, transport failure, shutdown, cross-tab event relay and runtime conformance. Browser tests use multiple independent contexts.

## Completion criteria
There is exactly one coordination primitive; cross-tab behavior does not exist as a second adapter in Events; no business state depends on leader election; all production coordination transports have real failure and split-brain tests.