---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/pwa'
---
# `@stackra/pwa` — Progressive Web App Capability

## Boundary
Web-only capability for installability, service-worker lifecycle, offline shell, update prompting, background sync integration and push capability negotiation. It does not own business offline data; `@stackra/sync` owns data synchronization and `@stackra/storage` owns durable browser storage.

## Subpaths
```text
@stackra/pwa
@stackra/pwa/react
@stackra/pwa/browser
@stackra/pwa/service-worker
@stackra/pwa/testing
```

## Public contracts
```ts
interface PwaManager { register():Promise<Registration>; checkForUpdate():Promise<UpdateState>; activateUpdate():Promise<void>; getInstallState():InstallState; requestInstall():Promise<InstallResult>; }
interface OfflinePolicy { cacheVersion:string; precache:readonly CacheEntry[]; runtimeRules:readonly RuntimeCacheRule[]; navigationFallback:string; }
```

## Source tree
```text
packages/capabilities/pwa/
├── src/core/{manifest,policy,update,errors,index.ts}
├── src/browser/{registration,install,push,index.ts}
├── src/react/{Provider,usePwa,UpdatePrompt,InstallPrompt,index.tsx}
├── src/service-worker/{bootstrap,routing,precache,runtime-cache,background-sync,index.ts}
└── src/testing/{fake-registration,cache-fixtures,e2e-helpers,index.ts}
```

## Lifecycle
```text
app boot → register SW → health/version handshake → update detected → user-safe prompt → activate → reload
```
Service-worker releases are content-hashed/versioned. A broken new worker cannot delete the last-known-good application shell.

## Offline
Only immutable app shell/static assets and explicitly opted-in public data may use SW caching. Authenticated/personalized data uses `@stackra/query` + `@stackra/sync`; secrets/tokens are never placed in Cache Storage.

## Testing
Real browser install/update, worker restart, cache version migration, offline navigation, recovery after failed update and background-sync handoff. No implementation depends on a service worker existing in Node/React Native.
