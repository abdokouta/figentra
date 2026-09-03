---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/collaboration'
---
# `@stackra/collaboration` — Realtime Collaboration Capability

## Boundary
Provides shared collaboration primitives for editors and workspaces: presence, cursors, typing/selection state, optimistic operation streams and synchronization hooks. It does not own business documents, persistence, workflow approval or identity.

## Subpaths
```text
@stackra/collaboration
@stackra/collaboration/react
@stackra/collaboration/native
@stackra/collaboration/realtime
@stackra/collaboration/commands
@stackra/collaboration/testing
```

## Public contracts
```ts
interface CollaborationSession { id:string; resourceType:string; resourceId:string; tenantId:string; principalId:string; protocolVersion:string; }
interface Presence { participantId:string; status:'online'|'idle'|'offline'; cursor?:unknown; selection?:unknown; updatedAt:string; }
interface CollaborationTransport { join(ctx:RequestContext,input:JoinInput):Promise<CollaborationSession>; publish(op:Operation):Promise<void>; subscribe(handler:(op:Operation)=>void):()=>void; leave(sessionId:string):Promise<void>; }
```

## Transport
Uses `@stackra/realtime` and authenticated HTTP/bootstrap; durable persistence remains the host service. Redis may be an ephemeral presence/cache adapter; NATS is used for durable server-side fan-out when required. No business mutation is accepted solely from presence traffic.

## Consistency
V1 supports optimistic commands + server version checks. Resource documents use stable IDs and monotonically increasing revisions. A stale operation receives a typed conflict. CRDT/OT may be implemented only behind `/commands` if a future document explicitly selects it; no separate document database is introduced by this package.

## Security
Every session is tenant/principal scoped. Presence data is not authorization. Private document snapshots are never broadcast to participants lacking document access. Tokens are never embedded in collaboration payloads.

## Failure/recovery
Disconnects trigger rejoin with current authoritative revision. Duplicate operations use operation IDs. Presence expires automatically. Realtime failure must not corrupt durable documents; edits remain retryable through host APIs.

## React/Native
React exports `CollaborationProvider`, `usePresence`, `useParticipants`, `useCollaborativeResource`, `useConnectionState`. Native equivalents avoid DOM assumptions.

## Testing
Join/leave, duplicate operations, reconnect, out-of-order operations, conflict handling, tenant isolation, presence expiry, realtime outage, React/native integration and browser/mobile E2E.
