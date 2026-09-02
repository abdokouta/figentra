/**
 * @file expo-notifications.interface.ts
 * @module @stackra/contracts/interfaces/expo
 * @description Canonical structural narrowing of
 *   `expo-notifications`'s public surface — push registration,
 *   permissions, and foreground listener.
 *
 *   Two consumer adapters in `@stackra/notifications/native` each
 *   shipped a narrow local shim of a different SUBSET of
 *   `expo-notifications`. The listener adapter consumed only the
 *   `addNotificationReceivedListener` slice; the push-token adapter
 *   consumed the `getExpoPushTokenAsync` + `getPermissionsAsync` +
 *   `requestPermissionsAsync` slice. The promoted `IExpoNotifications`
 *   interface is a UNION SUPERSET covering both slices — the real
 *   `expo-notifications` module ships every method, and every
 *   consumer's lazy import is structurally assignable.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/notifications/native` — `ExpoNotificationListenerAdapter`
 *     (foreground listener for received notifications, forwarded to
 *     `InAppNotificationCentre.dispatch`).
 *   - `@stackra/notifications/native` — `ExpoPushTokenAdapter` (push
 *     token registration + permission probe/request).
 */

/**
 * The listener event payload shape `expo-notifications` forwards
 * to `addNotificationReceivedListener` callbacks.
 *
 * Every field is optional because the underlying push provider
 * (APNs / FCM) can send silent pushes without title / body. The
 * consumer normalises missing fields to sensible defaults before
 * dispatching to `InAppNotificationCentre`.
 */
export interface IExpoNotificationReceivedEvent {
  readonly request?: {
    readonly content?: {
      readonly title?: string | null;
      readonly body?: string | null;
      readonly data?: Record<string, unknown> | null;
    };
  };
}

/**
 * The permission-status shape both `getPermissionsAsync` and
 * `requestPermissionsAsync` resolve to.
 */
export interface IExpoNotificationsPermissionStatus {
  /**
   * Current status string. Follows Expo's own vocabulary —
   * `"granted" | "denied" | "undetermined"` most commonly, plus
   * platform-specific extensions.
   */
  readonly status: string;
  /**
   * Explicit granted flag on newer Expo SDKs. When present it
   * wins over the `status` string. Absent on older SDKs (pre-49).
   */
  readonly granted?: boolean;
}

/**
 * Structural view of the subset of `expo-notifications`'s public
 * API `@stackra/*` packages consume. Every method routes 1:1 to
 * the same-named export on the concrete `expo-notifications`
 * module.
 *
 * Union superset — a single consumer typically touches only a
 * subset (listener consumers use `addNotificationReceivedListener`
 * only; token consumers use the getter / permission trio). The
 * real Expo module ships every method, so every lazy-import
 * resolves to a value assignable to this interface.
 *
 * @example
 * ```typescript
 * import type { IExpoNotifications } from "@stackra/contracts";
 *
 * async function loadPeer(): Promise<IExpoNotifications | null> {
 *   try {
 *     const spec = "expo-notifications";
 *     const mod = (await import(spec)) as
 *       { default?: IExpoNotifications } | IExpoNotifications;
 *     return "default" in mod && mod.default
 *       ? mod.default
 *       : (mod as IExpoNotifications);
 *   } catch {
 *     return null;
 *   }
 * }
 * ```
 */
export interface IExpoNotifications {
  /**
   * Register a listener for OS-received notifications. Foreground
   * only — OS delivers background notifications directly to the
   * notification tray without invoking this listener.
   *
   * @param listener - Callback invoked with the received event.
   * @returns Subscription handle with `remove()` for detach.
   */
  addNotificationReceivedListener(
    listener: (event: IExpoNotificationReceivedEvent) => void,
  ): {
    remove: () => void;
  };

  /**
   * Retrieve the Expo-provisioned push token for this device.
   *
   * @param options - Optional targeting params (Expo project ID,
   *   experience ID, or application ID).
   * @returns Token payload with `data` (the token string) +
   *   optional `type` discriminator.
   */
  getExpoPushTokenAsync?(options?: {
    projectId?: string;
    experienceId?: string;
    applicationId?: string;
  }): Promise<{ data: string; type?: string }>;

  /**
   * Probe the current notification permission state without
   * prompting the user. Optional on older SDKs.
   */
  getPermissionsAsync?(): Promise<IExpoNotificationsPermissionStatus>;

  /**
   * Prompt the user for notification permission. Silently returns
   * the existing state if the user has already granted or denied.
   * Optional on older SDKs.
   */
  requestPermissionsAsync?(): Promise<IExpoNotificationsPermissionStatus>;
}
