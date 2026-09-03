---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/browser"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/storage", "@stackra/security", "@stackra/link", "@stackra/observability"]
---
# `@stackra/browser` — implementation plan

## Purpose
Browser capability boundary for DOM lifecycle, secure/public storage, BroadcastChannel, Web Locks, visibility, navigation, clipboard, file picking and browser APIs. Shared/core packages must not directly access browser globals.

## Public API
```ts
interface BrowserRuntime { capabilities():BrowserCapabilities; initialize():void; dispose():void; }
interface BrowserStorage { get(key:string):Promise<string|null>; set(key:string,value:string):Promise<void>; remove(key:string):Promise<void>; }
interface BrowserChannel { post<T>(message:T):void; onMessage(handler:(message:unknown)=>void):()=>void; close():void; }
interface BrowserLock { run<T>(name:string,fn:()=>Promise<T>,options?:LockOptions):Promise<T>; }
interface BrowserNavigation { open(url:string,options?:NavigationOptions):void; }
interface Clipboard { readText():Promise<string>; writeText(value:string):Promise<void>; }
interface FilePicker { open(options:FilePickerOptions):Promise<readonly File[]>; }
```

## Source tree
```text
packages/browser/
├── src/core/{runtime,capabilities,lifecycle,errors,index.ts}
├── src/storage/{public-storage,secure-storage,index.ts}
├── src/coordination/{broadcast-channel,web-locks,index.ts}
├── src/dom/{visibility,events,index.ts}
├── src/navigation/{navigation,clipboard,file-picker,index.ts}
├── src/testing/{capability-fixture,storage-fixture,channel-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Capability model
Capabilities are detected once and exposed through a typed `BrowserCapabilities` structure. Unsupported features return explicit `CapabilityUnavailableError`; they never silently fall back to an unsafe substitute.

## Storage/security
Public browser storage is for non-sensitive cache/config data only. Authentication/session tokens use the approved Identity/SecureStorage mechanism and may not be placed in arbitrary localStorage without an explicit ADR. Storage keys are namespaced by application/environment; values have size limits.

## Cross-tab APIs
BroadcastChannel and Web Locks are exposed as low-level browser capabilities. `@stackra/coordinator` owns leader election/distributed coordination and higher-level cross-tab event semantics. Browser must not implement a second coordinator.

## Navigation/file access
Navigation delegates safe link normalization to `@stackra/link`. External URLs use scheme/host policy. File picker results are validated for type/size before application consumption. Clipboard access requires user/browser permission semantics.

## Lifecycle
Visibility/pagehide/beforeunload events trigger cancellation/disposal signals. The runtime does not promise background execution after unload. Long-running background sync is delegated to coordinator/service-worker mechanisms and `@stackra/sync`.

## Privacy/security
No secret values are exposed through diagnostics/devtools serialization. Content Security Policy-compatible APIs are used. Origin scoping, sandboxed iframe boundaries and permission failures are explicit. Storage access is never treated as a trust boundary for authorization.

## Observability
Measure capability failures, storage errors, channel lifecycle, navigation failures and file-picker usage without recording contents. OTel is client-safe only; sensitive identifiers are redacted.

## Testing
Real Chromium/Firefox/WebKit tests cover BroadcastChannel, Web Locks, storage, visibility, file picking and navigation. Unit tests inject capability-controlled adapters. Conformance records browser-version differences without claiming unsupported APIs work.

## Implementation phases
1. Capability/lifecycle core.
2. Storage/channel/lock adapters.
3. DOM/navigation/clipboard/file APIs.
4. Security/privacy/observability.
5. Cross-browser conformance and failure testing.

## Exit criteria
- Core packages contain no direct browser-global access.
- Unsupported capabilities fail explicitly.
- Sensitive persistence uses approved secure boundaries.
- Cross-tab coordination is delegated to coordinator.
- Browser lifecycle cleanup is deterministic and tested.
