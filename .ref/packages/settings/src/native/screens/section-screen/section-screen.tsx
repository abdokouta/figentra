/**
 * @file section-screen.tsx
 * @module @stackra/settings/native/screens/section-screen
 * @description `<SectionScreen>` — renders a single visual sub-group
 *   within a settings group as its own screen.
 *
 *   Useful when a group's sub-sections are RICH ENOUGH to deserve
 *   their own drill-down (e.g. a "Privacy" group with many nested
 *   sub-sections). Consumers who don't need this depth can skip the
 *   section screen entirely — `<GroupScreen>` already renders every
 *   visual sub-group inline as a section-titled `ListGroup`.
 *
 *   Resolves `(groupKey, sectionKey)` from props first, then from
 *   React Navigation route params (typed via
 *   {@link ISettingsRouteParamList}).
 */

import { useMemo, Fragment, type ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListGroup, Separator } from "@stackra/ui/native";

import { useSettings } from "../../../core/hooks/use-settings/use-settings.hook";
import { useSettingsSchema } from "../../../core/hooks/use-settings-schema/use-settings-schema.hook";

import { FieldRenderer } from "../../components/field-renderer/field-renderer.component";
import { useNativeSettingsConfig } from "../../hooks/use-native-settings-config/use-native-settings-config.hook";
import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useRouteParamOrProp } from "../group-screen/use-route-param-or-prop.util";

import type { ISettingDefinition, ISettingField } from "@stackra/contracts";
import type { ISectionScreenProps } from "./section-screen.interface";

/**
 * Filter a definition's fields down to those belonging to a specific
 * visual sub-group. The section reference matches EITHER the
 * visual group's `key` OR its `label` — the Laravel schema uses
 * labels, the client decorator uses keys, both must resolve.
 */
function selectSectionFields(
  definition: ISettingDefinition,
  sectionKey: string,
): {
  readonly fields: readonly ISettingField[];
  readonly heading: string;
  readonly description: string | null;
} {
  // Resolve the section's canonical key + heading.
  const visualGroup =
    definition.groups?.find((g) => g.key === sectionKey || g.label === sectionKey) ?? null;

  const heading = visualGroup?.label ?? sectionKey;
  const description = visualGroup?.description ?? null;

  const fields = (definition.fields ?? [])
    .filter((field) => {
      if (!field.group) return false;
      // Match by canonical key OR raw label — mirror the resolution
      // in the visual-group index above.
      if (visualGroup) {
        return field.group === visualGroup.key || field.group === visualGroup.label;
      }
      return field.group === sectionKey;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return { fields, heading, description };
}

/**
 * `<SectionScreen>` — one visual sub-group's editor.
 *
 * @param props - {@link ISectionScreenProps}.
 */
export function SectionScreen(props: ISectionScreenProps = {}): ReactElement {
  const groupKey = useRouteParamOrProp("groupKey", props.groupKey);
  const sectionKey = useRouteParamOrProp("sectionKey", props.sectionKey);
  const { safeAreaEdges } = useNativeSettingsConfig();
  const groups = useSettingsSchema();
  const t = useNativeSettingsT();

  const definition = useMemo<ISettingDefinition | undefined>(
    () => groups.find((g) => g.key === groupKey),
    [groups, groupKey],
  );

  const { values, setMany } = useSettings<Record<string, unknown>>(definition?.key ?? "");

  const section = useMemo(
    () =>
      definition && sectionKey.length > 0 ? selectSectionFields(definition, sectionKey) : null,
    [definition, sectionKey],
  );

  if (!definition || !section || section.fields.length === 0) {
    return (
      <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
        <View className="p-6">
          <Text className="text-foreground text-lg font-semibold">
            {t("section_page.not_found_title")}
          </Text>
          <Text className="text-muted mt-1 text-sm">{t("section_page.not_found_description")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="mb-6">
          <Text className="text-foreground text-2xl font-semibold">{section.heading}</Text>
          {section.description ? (
            <Text className="text-muted mt-1 text-sm">{section.description}</Text>
          ) : null}
        </View>

        <ListGroup>
          {section.fields.map((field, index) => (
            <Fragment key={field.key}>
              {index > 0 ? <Separator className="mx-4" /> : null}
              <FieldRenderer
                disabled={field.readOnly === true}
                field={field}
                groupKey={definition.key}
                onChange={(next) => setMany({ [field.key]: next })}
                value={values[field.key]}
              />
            </Fragment>
          ))}
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

SectionScreen.displayName = "SectionScreen";
