---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/react-native"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/react", "@stackra/storage", "@stackra/security", "@stackra/sync", "@stackra/observability"]
---
# `@stackra/react-native` — implementation plan

## Purpose
React Native runtime adapter for secure storage, connectivity, application lifecycle, filesystem/file picking, native notifications/push capabilities, clipboard and platform capability discovery. Shared business/application code remains runtime-neutral.

## Public API
```ts
interface NativeRuntime { capabilities():NativeCapabilities; initialize():Promise<void>; dispose():Promise<void>; }
interface SecureStorageAdapter { get(key:string):Promise<string|null>; set(key:string,value:string):Promise<void>; remove(key:string):Promise<void>; }
interface ConnectivityMonitor { current():ConnectivityState; subscribe(handler:(state:ConnectivityState)=>void):()=>void; }
interface AppLifecycle { state():AppState; onChange(handler:(state:AppState)=>void):()=>void; }
interface NativeFilePicker { pick(options:FilePickerOptions):Promise<readonly NativeFile[]>; }
interface NativePushTokenProvider { getToken():Promise<string>; subscribe(handler:(token:string)=>void):()=>void; }
```

## Source tree
```text
packages/react-native/
├── src/core/{runtime,capabilities,lifecycle,errors,index.ts}
├── src/storage/{secure-storage,keychain,index.ts}
├── src/connectivity/{monitor,reachability,index.ts}
├── src/files/{picker,sandbox,index.ts}
├── src/push/{tokens,permissions,index.ts}
├── src/react/{providers,hooks,index.ts}
├── src/testing/{runtime-fixture,permission-fixture,storage-fixture,index.ts}
└── __tests__/{unit,integration,ios,android,conformance}/
```

## Lifecycle/connectivity
Background/foreground transitions emit explicit lifecycle events. Nonessential work is cancelled or checkpointed before suspension where platform permits. Connectivity is advisory and feeds `@stackra/sync`; business correctness cannot depend on a connectivity event. Subscriptions are disposed exactly once.

## Secure storage/security
Authentication/session credentials use platform secure storage. Arbitrary AsyncStorage/local persistence is not an approved credential store. Keys are application/environment scoped. Push tokens are treated as sensitive identifiers. File URIs are sandbox-validated before use. Native bridge commands accept typed schemas and reject unknown fields.

## Sync integration
Connectivity and app lifecycle are adapters for `@stackra/sync`. Sync checkpoints are persisted before suspension when possible. Resume triggers bounded sync work; no background execution guarantee is assumed when the OS terminates the app.

## Permissions
Camera, notifications, files, location and other native permissions have explicit capability/status APIs. Denial or revocation returns typed errors/states; the runtime never assumes permission from a previous grant.

## Observability
Measure lifecycle transitions, connectivity flapping, secure-storage failures, permission denial and native bridge errors without logging tokens/push IDs/file contents. OTel client-safe attributes only.

## Testing
Simulate foreground/background, process termination, connectivity flapping, permission denial, secure-storage outage, file picker cancellation, push-token rotation and sync checkpoint recovery. Real iOS/Android conformance is required for supported baseline OS versions.

## Implementation phases
1. Runtime/capability/lifecycle core.
2. Secure storage and native bridge contracts.
3. Connectivity/file/push adapters.
4. React providers/hooks and Sync integration.
5. Security/observability/testing on iOS/Android.

## Exit criteria
- No browser/Node shim is presented as a native implementation.
- Credentials use secure platform storage.
- Permission/capability failures are explicit.
- Sync is crash-resumable across app lifecycle transitions.
