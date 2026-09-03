/**
 * @file use-system-settings.hook.ts
 * @module @stackra/settings/native/hooks/use-system-settings
 * @description `useSystemSettings()` — opens the OS Settings app for
 *   the current bundle via `Linking.openSettings()`.
 *
 *   Used by {@link PermissionFieldRow} to route permission-managed
 *   settings (camera, mic, location, notifications) to the iOS /
 *   Android system Settings app — no in-app permission UI is
 *   authoritative on RN, so the consumer must delegate to the OS.
 *
 *   `open()` is fail-soft: any exception from the platform bridge
 *   is caught + reported as `false` return value. That matches
 *   HeroUI Native's fail-soft policy and keeps the settings screen
 *   from crashing when the peer is broken or missing.
 */

import { useCallback, useMemo } from "react";
import { Linking } from "react-native";

import type { IUseSystemSettingsResult } from "./use-system-settings.interface";

/**
 * Open the OS Settings app for the current bundle.
 *
 * @returns Stable {@link IUseSystemSettingsResult} object.
 *
 * @example
 * ```tsx
 * import { useSystemSettings } from "@stackra/settings/native";
 *
 * function CameraPermissionRow() {
 *   const { open } = useSystemSettings();
 *   return (
 *     <ListGroup.Item onPress={() => void open()}>
 *       ...
 *     </ListGroup.Item>
 *   );
 * }
 * ```
 */
export function useSystemSettings(): IUseSystemSettingsResult {
  const open = useCallback(async (): Promise<boolean> => {
    try {
      // `Linking.openSettings` returns Promise<void> — coerce to
      // `true` on success. The RN types don't advertise a return
      // value; we synthesise one so the consumer can react
      // predictably.
      await Linking.openSettings();
      return true;
    } catch {
      // fail-soft — a broken Linking bridge or missing platform peer
      // should never crash the settings screen. Consumers who care
      // about the failure can inspect the boolean return.
      return false;
    }
  }, []);

  return useMemo<IUseSystemSettingsResult>(() => ({ open }), [open]);
}
