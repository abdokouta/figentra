/**
 * @file permission-field-row.component.tsx
 * @module @stackra/settings/native/components/permission-field-row
 * @description `<PermissionFieldRow>` — a `ListGroup.Item` that
 *   routes to the OS Settings app on press via
 *   `Linking.openSettings()`.
 *
 *   Native permissions (camera, microphone, location, notifications,
 *   contacts, calendar) are NOT owned by the in-app settings surface
 *   — they live in the OS Settings app. The in-app row surfaces the
 *   current state (when known) and delegates the actual toggle to
 *   the OS.
 *
 *   Fail-soft: `Linking.openSettings()` may fail on unusual builds
 *   (private-mode, expo web dev, kiosk mode). The wrapping
 *   `useSystemSettings()` hook swallows those failures and returns
 *   `false` — the row silently no-ops on error rather than
 *   crashing.
 */

import { ListGroup } from "@stackra/ui/native";
import { useCallback, type ReactElement } from "react";

import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useSystemSettings } from "../../hooks/use-system-settings/use-system-settings.hook";

import type { IPermissionFieldRowProps } from "./permission-field-row.interface";

/**
 * `<PermissionFieldRow>` — tappable row that opens the OS Settings.
 *
 * @param props - {@link IPermissionFieldRowProps}.
 */
export function PermissionFieldRow(props: IPermissionFieldRowProps): ReactElement {
  const { field, currentState, onPress } = props;
  const t = useNativeSettingsT();
  const { open } = useSystemSettings();

  // Resolve the description slot: prefer the caller-supplied
  // `currentState` (canonical iOS/Android nomenclature); fall back to
  // the field's own `description`; fall back to a generic hint.
  const description = ((): string => {
    if (currentState === "granted") return t("permission_field.state_granted");
    if (currentState === "denied") return t("permission_field.state_denied");
    if (currentState === "undetermined") return t("permission_field.state_undetermined");
    return field.description ?? t("permission_field.manage_hint");
  })();

  const handlePress = useCallback((): void => {
    if (onPress) {
      onPress();
      return;
    }
    // Fire-and-forget — useSystemSettings.open handles its own
    // fail-soft branch. Nothing to await.
    void open();
  }, [onPress, open]);

  return (
    <ListGroup.Item
      accessibilityHint={t("permission_field.press_hint")}
      accessibilityLabel={field.label}
      accessibilityRole="button"
      className="min-h-[48px]"
      onPress={handlePress}
    >
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{field.label}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}

PermissionFieldRow.displayName = "PermissionFieldRow";
