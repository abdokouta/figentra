/**
 * @file settings-list.component.tsx
 * @module @stackra/settings/native/components/settings-list
 * @description `<SettingsList>` — grouped ListGroup renderer over an
 *   array of settings-group definitions.
 *
 *   Instead of a bare `FlatList`, we render a single `ListGroup`
 *   container with items + separators between them — that's the
 *   HeroUI Native + iOS Settings convention. FlatList's virtualisation
 *   isn't a win for typical settings lists (<50 entries) and
 *   composing `ListGroup.Item`s directly gives the correct rounded-
 *   corner surface + separator styling for free.
 *
 *   Consumers with >50 groups pass a bespoke `renderItem` and wrap
 *   the list themselves via a FlashList — the component's built-in
 *   path keeps peers minimal.
 */

import { ListGroup, Separator } from "@stackra/ui/native";
import { Fragment, type ReactElement } from "react";
import { Text, View } from "react-native";

import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { SettingsRow } from "../settings-row/settings-row.component";

import type { ISettingDefinition } from "@stackra/contracts";
import type { ISettingsListProps } from "./settings-list.interface";

/**
 * `<SettingsList>` — grouped ListGroup renderer.
 *
 * @param props - {@link ISettingsListProps}.
 */
export function SettingsList(props: ISettingsListProps): ReactElement {
  const { groups, onGroupPress, renderItem, className } = props;
  const t = useNativeSettingsT();

  // Empty state — the settings hub has no groups registered. This
  // typically only happens in fresh app installs before any module
  // has called `SettingsModule.forFeature([DTO])`.
  if (groups.length === 0) {
    return (
      <View className={className ? `items-center p-6 ${className}` : "items-center p-6"}>
        <Text className="text-muted text-sm">{t("hub.empty")}</Text>
      </View>
    );
  }

  const renderRow = (group: ISettingDefinition): ReactElement => {
    if (renderItem) return renderItem(group);
    return (
      <SettingsRow
        description={group.description}
        onPress={onGroupPress ? () => onGroupPress(group.key) : undefined}
        title={group.label}
      />
    );
  };

  return (
    <ListGroup className={className}>
      {groups.map((group, index) => (
        <Fragment key={group.key}>
          {index > 0 ? <Separator className="mx-4" /> : null}
          {renderRow(group)}
        </Fragment>
      ))}
    </ListGroup>
  );
}

SettingsList.displayName = "SettingsList";
