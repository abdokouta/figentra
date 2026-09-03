---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/network — architecture plan

**Status:** Planned (extend `.ref/packages/network` v3.0.0) **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md)
**Reference:** `.ref/packages/network/` — already ADR-0091-shaped, v3.0.0
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/logger`

## Purpose

`@stackra/network` provides cross-runtime network-status detection:

- **Browser** — `navigator.onLine`, `navigator.connection` (Network Information
  API), `online`/`offline` events, connection type + effective bandwidth.
- **React Native** — `@react-native-community/netinfo` — WiFi vs cellular,
  connection strength, expensive-network detection.
- **Node** — `NodeNetworkDetector` (from .ref) — DNS probe-based detection.
- **Cloudflare Worker** — noop detector (Workers are always "online" or dead; no
  network state to detect).

Enterprise requirements day one:

- **Reactive status** — subscribers receive
  `{ online, connectionType, effectiveType, downlink, rtt, saveData }` on every
  state change.
- **Offline event bus** — emit `network.online`, `network.offline`,
  `network.changed` on `@stackra/events`.
- **Retry-aware** — expose `IRetryable` interface for HTTP/queue packages to
  gate retries on network state.
- **Auto-pause queues** — subscribers can gate `@stackra/queue` dispatches when
  offline (buffer via IndexedDB queue connector).
- **React hooks** — `useNetworkStatus()`, `useOnline()`, `useConnectionType()`.
- **RN device-state integration** — expose foreground/background app state (via
  `AppState`) alongside connection state.

## Non-goals

- Bandwidth measurement (that's browser/OS territory).
- Traceroute / ping utility (Node only, out of scope).
- VPN detection.

## Subpath layout (per ADR-0091)

Reference already has 4 subpaths — LOCK them:

```
packages/network/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── network.module.ts
│   │   ├── detectors/                 # from .ref: node-network.detector.ts
│   │   ├── hooks/                     # useNetworkStatus, useOnline (cross-platform)
│   │   ├── i18n/                      # error messages (offline banner, etc.)
│   │   ├── interfaces/
│   │   ├── services/                  # NetworkService, NetworkStateStore
│   │   ├── utils/                     # effective-type inference, retry-when-online
│   │   └── index.ts
│   │
│   ├── react/
│   │   ├── providers/                 # <NetworkProvider>
│   │   ├── detectors/                 # BrowserNetworkDetector (window.online + Network Info API)
│   │   ├── hooks/                     # useConnectionType, useEffectiveType, useSaveData
│   │   ├── components/                # <OfflineBanner> (optional, opt-in)
│   │   └── index.ts
│   │
│   ├── native/
│   │   ├── providers/                 # <NativeNetworkProvider>
│   │   ├── detectors/                 # NativeNetworkDetector via @react-native-community/netinfo
│   │   ├── hooks/                     # useNetworkState, useAppState (RN app state)
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-network.ts             # setOnline(), setOffline(), setConnectionType()
│       ├── network-fixture.ts
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol             | Kind         |
| ------------------ | ------------ |
| `INetworkDetector` | interface    |
| `INetworkService`  | interface    |
| `INetworkStatus`   | interface    |
| `IConnectionType`  | interface    |
| `NETWORK_DETECTOR` | token        |
| `NETWORK_SERVICE`  | token        |
| `NETWORK_EVENTS`   | constant map |

## Core API (locked from .ref)

```typescript
interface INetworkStatus {
  online: boolean;
  connectionType: ConnectionType; // "wifi" | "cellular" | "ethernet" | "unknown" | "none"
  effectiveType: EffectiveType; // "slow-2g" | "2g" | "3g" | "4g" | "unknown"
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time (ms)
  saveData?: boolean; // "Data-saver" enabled
  lastChangedAt: string; // ISO 8601
}

interface INetworkService {
  current(): INetworkStatus;
  onChange(handler: (status: INetworkStatus) => void): () => void;
  isOnline(): boolean;
  awaitOnline(timeoutMs?: number): Promise<void>;
  awaitOffline(timeoutMs?: number): Promise<void>;
}

interface INetworkDetector {
  start(): Promise<void>;
  stop(): void;
  probe(): Promise<INetworkStatus>;
  onChange(handler: (status: INetworkStatus) => void): () => void;
}
```

## Detectors

| Detector                 | Home                                          | Runtime                                    |
| ------------------------ | --------------------------------------------- | ------------------------------------------ |
| `NoopNetworkDetector`    | `core/detectors/noop.detector.ts`             | Every runtime (fallback)                   |
| `NodeNetworkDetector`    | `core/detectors/node-network.detector.ts`     | Node — DNS probe                           |
| `BrowserNetworkDetector` | `react/detectors/browser-network.detector.ts` | Browser — window.online + Network Info API |
| `NativeNetworkDetector`  | `native/detectors/native-network.detector.ts` | RN — @react-native-community/netinfo       |

Runtime picks via DI:

- Browser: `<NetworkProvider>` binds `BrowserNetworkDetector`.
- RN: `<NativeNetworkProvider>` binds `NativeNetworkDetector`.
- Node: `NetworkModule.forRoot({ detector: NodeNetworkDetector })`.
- Worker: noop (always online).

## Hooks (cross-platform)

```typescript
// core/hooks/use-network-status.hook.ts
export function useNetworkStatus(): INetworkStatus {
  const service = useInject<INetworkService>(NETWORK_SERVICE);
  return useSyncExternalStore(
    (cb) => service.onChange(cb),
    () => service.current(),
    () => service.current(),
  );
}

export function useOnline(): boolean {
  return useNetworkStatus().online;
}
```

Works identically on React DOM + React Native — same file re-exported from both
`/react` and `/native` per ADR-0091 §Rule 3.

## Events integration

`NetworkService` emits on `@stackra/events`:

```typescript
NETWORK_EVENTS.ONLINE         → { previousStatus, currentStatus }
NETWORK_EVENTS.OFFLINE        → { previousStatus, currentStatus }
NETWORK_EVENTS.CHANGED        → { previousStatus, currentStatus }
NETWORK_EVENTS.SLOW_CONNECTION → { effectiveType, downlink }
```

Downstream: HTTP client circuit-breaker, queue offline buffer, analytics pauses
on save-data.

## Retry-when-online helper

Composable retry that WAITS for online before firing:

```typescript
import { retryWhenOnline } from "@stackra/network";

const result = await retryWhenOnline(() => http.post("/api/orders", data), {
  attempts: 3,
  offlineTimeoutMs: 60_000,
});
```

If offline, waits (with subscription to `NETWORK_EVENTS.ONLINE`) up to
`offlineTimeoutMs` before giving up.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@stackra/ui": "workspace:*",
    "@stackra/testing": "workspace:*",
    "react": "catalog:react",
    "react-native": "catalog:react-native",
    "@react-native-community/netinfo": "^12.0.0",
  },
  "peerDependenciesMeta": {
    "@stackra/ui": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "@react-native-community/netinfo": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Port from .ref (2 days)

- [ ] Copy `src/core/`, `src/react/`, `src/native/`, `src/testing/`.
- [ ] Rename to workspace conventions.

### Phase 2 — Contracts split (1 day)

- [ ] `packages/contracts/src/interfaces/network/*.interface.ts`.
- [ ] `packages/contracts/src/tokens/network.tokens.ts`.

### Phase 3 — Events integration (1 day)

- [ ] `NETWORK_EVENTS` catalogue.
- [ ] `NetworkService.onChange()` → emit on `@stackra/events`.

### Phase 4 — Additions (2 days)

- [ ] `<OfflineBanner>` optional React component (uses `@stackra/ui`).
- [ ] `retryWhenOnline()` helper.
- [ ] Node-side detector polish (DNS probe interval configurable).

### Phase 5 — Testing (1 day)

- [ ] `MockNetworkService.setOnline(false)` etc.

### Phase 6 — Docs + release (1 day)

**Total effort:** 8 days.

## Success criteria

- [ ] 4 subpath exports build cleanly.
- [ ] Browser detector fires `network.offline` when DevTools "Offline" throttle
      enabled.
- [ ] RN detector reports connection type transitions (wifi → cellular).
- [ ] Node detector re-probes on interval; emits change events.
- [ ] Worker detector is a no-op (never emits).
- [ ] `retryWhenOnline` waits then fires on `network.online`.

## Cross-references

- ADR-0091.
- `.kiro/plans/2026-09-03-events-package.md` — `NETWORK_EVENTS` catalogue.
- `.kiro/plans/2026-09-03-http-package.md` — circuit-breaker gate on offline.
- `.kiro/plans/2026-09-03-queue-package.md` — offline queue buffer.
- `.ref/packages/network/` — reference implementation.
