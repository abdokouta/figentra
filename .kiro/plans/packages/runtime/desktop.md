---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/desktop"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/browser", "@stackra/node", "@stackra/storage", "@stackra/security", "@stackra/http", "@stackra/realtime"]
---
# `@stackra/desktop` — implementation plan

## Purpose
Secure desktop runtime adapter for Electron/Tauri-class applications. It owns IPC boundaries, window/application lifecycle, filesystem/credential access, deep links, notifications and native capability discovery. Business logic remains in shared application/services packages.

## Public API
```ts
interface DesktopRuntime { capabilities():DesktopCapabilities; initialize():Promise<void>; dispose():Promise<void>; }
interface IpcBridge { invoke<TReq,TRes>(channel:string,input:TReq):Promise<TRes>; expose<TReq,TRes>(channel:string,handler:(input:TReq)=>Promise<TRes>):Disposable; }
interface DesktopFileSystem { read(path:string):Promise<Uint8Array>; write(path:string,data:Uint8Array):Promise<void>; chooseFile(options:FilePickerOptions):Promise<FileRef>; }
interface DesktopCredentials { get(key:string):Promise<string|null>; set(key:string,value:string):Promise<void>; delete(key:string):Promise<void>; }
interface WindowManager { create(options:WindowOptions):Promise<WindowRef>; close(id:string):Promise<void>; }
```

## Source tree
```text
packages/desktop/
├── src/core/{runtime,capabilities,lifecycle,errors,index.ts}
├── src/ipc/{bridge,channels,schema,index.ts}
├── src/windows/{manager,events,index.ts}
├── src/files/{filesystem,path-policy,file-picker,index.ts}
├── src/credentials/{keychain,secure-store,index.ts}
├── src/links/{deep-link,index.ts}
├── src/notifications/{desktop-notification,index.ts}
├── src/testing/{ipc-fixture,runtime-fixture,security-fixture,index.ts}
└── __tests__/{unit,integration,security,conformance}/
```

## IPC security
Renderer-to-main/native calls use an explicit channel allowlist and Standard Schema-validated request/response contracts. No arbitrary function exposure, eval, shell execution or raw privileged bridge exists. Renderer identity and authorization context are not trusted merely because a message originates from the renderer.

## Filesystem/credentials
Filesystem operations are root/policy constrained. Canonical paths and symlink resolution prevent traversal/escape. Credentials use OS credential/keychain facilities. Raw tokens are never stored in general application files or SQLite.

## Window/application lifecycle
Lifecycle is `starting → ready → closing → disposed`. Closing stops new IPC commands, drains active authorized work and disposes listeners/resources. A renderer crash is isolated and does not leak main-process resources.

## Deep links/notifications
Deep-link URLs pass through `@stackra/link` validation before routing. Notification payloads are schema-validated and minimized. Desktop notifications never expose secret data.

## Networking/realtime
HTTP uses `@stackra/http`; realtime uses `@stackra/realtime`. Native capability APIs remain runtime adapters. Offline synchronization composes `@stackra/sync` where needed.

## Observability
IPC latency/failures, window lifecycle, filesystem errors and capability mismatches are measured without request payloads/secrets. Main and renderer telemetry are correlated but privacy-safe.

## Reliability
IPC requests have deadlines and cancellation. Oversized messages are rejected. Native process failures return typed dependency errors. Long-running work moves to worker/service boundaries rather than blocking UI threads.

## Testing
IPC schema/authorization, renderer/main isolation, filesystem path traversal, credential storage, deep-link validation, window lifecycle, native crash recovery and capability conformance. Security tests attempt arbitrary-channel invocation and privilege escalation.

## Implementation phases
1. Core capability/lifecycle.
2. IPC bridge and security policy.
3. Filesystem/credentials/window adapters.
4. deep-link/notification/network integration.
5. testing/observability/security-hardening.

## Exit criteria
- No unrestricted renderer→native API exists.
- Filesystem/credentials are policy-bound.
- IPC schemas and deadlines are enforced.
- Desktop runtime contains no product-specific business logic.
