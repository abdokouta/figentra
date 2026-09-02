/**
 * @file setup.ts
 * @module @stackra/testing/native
 * @description Workspace-wide Jest setup for React Native packages
 *   and apps.
 *
 *   Consumers wire it via `setupFilesAfterEnv`:
 *
 *   ```js
 *   // jest.config.js
 *   const { createJestConfig } = require("@stackra/testing/native");
 *
 *   module.exports = createJestConfig({ rootDir: __dirname });
 *   ```
 *
 *   Or opt-in one file at a time:
 *
 *   ```js
 *   // jest.setup.ts (in a consumer with additional per-app boot)
 *   import "@stackra/testing/native/setup";
 *   // ... app-specific mocks / DI bootstrap
 *   ```
 *
 *   Registers the workspace's canonical RN mock set — every RN
 *   package's Jest run needs these, so keeping them in one place
 *   prevents per-app drift:
 *
 *   - `reflect-metadata` polyfill (decorator metadata)
 *   - `react-native-reanimated` (worklets can't run in Jest VM)
 *   - `react-native-gesture-handler` (native modules unavailable)
 *   - `@react-native-async-storage/async-storage` (workspace default)
 *   - `@react-native-community/netinfo` (mocked "online")
 *   - `expo-modules-core`, `expo-notifications`, `expo-secure-store`,
 *     `expo-local-authentication`, `expo-linking`
 *   - `react-native-mmkv` (Map-backed in-memory store)
 *
 *   Every mock ships the minimum surface the workspace consumes;
 *   individual tests can override with a local `jest.mock(...)` call.
 *
 *   Auto-registers RNTL v12.4+ built-in Jest matchers (`toBeVisible`,
 *   `toHaveTextContent`, `toHaveProp`, ...) via the RNTL import
 *   side effect — the legacy `@testing-library/jest-native/extend-expect`
 *   import is deprecated.
 *
 *   Closes `.kiro/backlog-frontend-2026-07-27.md` §5.3.
 */

import "reflect-metadata";

// RNTL v12.4+ auto-registers matchers on first import — the side
// effect is enough; we never call `expect.extend` explicitly.
import "@testing-library/react-native";

// ── Reanimated 3 mock ────────────────────────────────────────────────
// Reanimated 3 needs its own Jest setup because its worklets can't run
// in the Jest VM. The official mock replaces every worklet primitive
// with a no-op equivalent.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return -- Jest mock factories run in CommonJS scope; the RN reanimated mock ships CJS-only + no types.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// ── Gesture Handler mock ─────────────────────────────────────────────
// Gesture handler uses native modules that Jest can't load. Consumer
// tests that need real gesture behavior use Detox instead.
jest.mock("react-native-gesture-handler", () => ({
  Swipeable: () => null,
  DrawerLayout: () => null,
  State: {},
  ScrollView: () => null,
  Slider: () => null,
  Switch: () => null,
  TextInput: () => null,
  ToolbarAndroid: () => null,
  ViewPagerAndroid: () => null,
  DrawerLayoutAndroid: () => null,
  WebView: () => null,
  NativeViewGestureHandler: () => null,
  TapGestureHandler: () => null,
  FlingGestureHandler: () => null,
  ForceTouchGestureHandler: () => null,
  LongPressGestureHandler: () => null,
  PanGestureHandler: () => null,
  PinchGestureHandler: () => null,
  RotationGestureHandler: () => null,
  Directions: {},
  gestureHandlerRootHOC: (component: unknown) => component,
  GestureHandlerRootView: ({ children }: { children: unknown }) => children,
}));

// ── AsyncStorage mock ────────────────────────────────────────────────
// Every test can override — this is the workspace-wide default so
// tests never crash on the `NativeModule: AsyncStorage is null` boot
// error.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return -- Jest mock factories run in CommonJS scope; the AsyncStorage mock ships CJS-only + no types. */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return */

// ── NetInfo mock ─────────────────────────────────────────────────────
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
      details: { isConnectionExpensive: false },
    }),
  ),
  addEventListener: jest.fn(() => () => undefined),
  refresh: jest.fn(() => Promise.resolve()),
  configure: jest.fn(),
  useNetInfo: () => ({
    isConnected: true,
    isInternetReachable: true,
    type: "wifi",
  }),
}));

// ── Expo modules mocks ───────────────────────────────────────────────
// Expo modules used by @stackra/* native subpaths. Each mock ships the
// minimum surface the workspace consumes; individual tests can override.
jest.mock("expo-modules-core", () => ({
  NativeModule: class {},
  requireNativeModule: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => null),
  EventEmitter: class {
    public addListener(): { remove: () => void } {
      return { remove: () => undefined };
    }
    public removeAllListeners(): void {
      // No-op — matches expo-modules-core's real `EventEmitter.removeAllListeners`
      // signature; test doubles never accumulate listeners because
      // `afterEach(jest.clearAllMocks)` sweeps them.
    }
    public emit(): void {
      // No-op — same rationale; consumers who need emission use
      // `jest.spyOn(mockEmitter, 'emit')` on their own mock instance.
    }
  },
}));

jest.mock("expo-notifications", () => ({
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: "ExponentPushToken[test-token]" }),
  ),
  getDevicePushTokenAsync: jest.fn(() =>
    Promise.resolve({ type: "ios", data: "device-token" }),
  ),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", canAskAgain: true, granted: true }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", canAskAgain: true, granted: true }),
  ),
  addNotificationReceivedListener: jest.fn(() => ({
    remove: () => undefined,
  })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: () => undefined,
  })),
  addPushTokenListener: jest.fn(() => ({ remove: () => undefined })),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("id")),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  WHEN_UNLOCKED: "whenUnlocked",
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly",
  AFTER_FIRST_UNLOCK: "afterFirstUnlock",
  ALWAYS: "always",
}));

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path: string) => `stackra://${path}`),
  addEventListener: jest.fn(() => ({ remove: () => undefined })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  parse: jest.fn((url: string) => ({ path: url })),
  openURL: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-mmkv", () => {
  const store = new Map<string, string | number | boolean>();
  return {
    MMKV: class {
      public getString(key: string): string | undefined {
        const value = store.get(key);
        return typeof value === "string" ? value : undefined;
      }
      public getNumber(key: string): number | undefined {
        const value = store.get(key);
        return typeof value === "number" ? value : undefined;
      }
      public getBoolean(key: string): boolean | undefined {
        const value = store.get(key);
        return typeof value === "boolean" ? value : undefined;
      }
      public set(key: string, value: string | number | boolean): void {
        store.set(key, value);
      }
      public delete(key: string): void {
        store.delete(key);
      }
      public clearAll(): void {
        store.clear();
      }
      public getAllKeys(): string[] {
        return [...store.keys()];
      }
    },
  };
});

// ── Reset between tests ──────────────────────────────────────────────
afterEach(() => {
  jest.clearAllMocks();
});
