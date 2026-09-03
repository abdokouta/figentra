/**
 * @file group-screen.tsx
 * @module @stackra/settings/native/screens/group-screen
 * @description `<GroupScreen>` — renders one settings group's
 *   fields.
 *
 *   The screen resolves the group definition via
 *   `SettingsService.getGroup(key)`, subscribes to its current
 *   values via `useSettings(key)`, and dispatches each field through
 *   {@link FieldRenderer} inside a `ListGroup`.
 *
 *   Fields with a `group` property (referencing an
 *   `ISettingVisualGroup`) are visually grouped under a sub-heading
 *   — matches the iOS Settings convention of section-titled groups
 *   within a screen. Fields without an owning `group` collect under
 *   an anonymous "root" section rendered first.
 *
 *   The `groupKey` comes from either the `groupKey` prop (when the
 *   caller passes it explicitly) or from a React Navigation route
 *   param (typed via {@link ISettingsRouteParamList}). Consumers
 *   without React Navigation always pass the prop directly.
 */

import { useMemo, type ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListGroup, Separator } from "@stackra/ui/native";

import { useSettings } from "../../../core/hooks/use-settings/use-settings.hook";
import { useSettingsSchema } from "../../../core/hooks/use-settings-schema/use-settings-schema.hook";

import { FieldRenderer } from "../../components/field-renderer/field-renderer.component";
import { useNativeSettingsConfig } from "../../hooks/use-native-settings-config/use-native-settings-config.hook";
import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useRouteParamOrProp } from "./use-route-param-or-prop.util";

import type { ISettingDefinition, ISettingField } from "@stackra/contracts";
import type { IGroupScreenProps } from "./group-screen.interface";
import { Fragment } from "react";

/** Bucket a group's fields by visual sub-group key. */
export interface IFieldBucket {
  readonly heading: string | null;
  readonly description: string | null;
  readonly fields: readonly ISettingField[];
}

/**
 * Bucket a definition's fields by their visual sub-group. Fields
 * without a `group` reference collect under a `null`-headed bucket
 * rendered first.
 */
function bucketFieldsByVisualGroup(definition: ISettingDefinition): readonly IFieldBucket[] {
  const groupMap = new Map<string, IFieldBucket>();
  const rootFields: ISettingField[] = [];

  // Index visual groups by both `key` and `label` — the Laravel API
  // uses labels; the client-side decorator uses keys. Both must
  // resolve.
  const visualGroupIndex = new Map<string, { key: string; label: string; description?: string }>();
  for (const group of definition.groups ?? []) {
    visualGroupIndex.set(group.key, {
      key: group.key,
      label: group.label,
      description: group.description,
    });
    if (group.label && group.label !== group.key) {
      visualGroupIndex.set(group.label, {
        key: group.key,
        label: group.label,
        description: group.description,
      });
    }
  }

  // Sort fields by `order` so predictable rendering matches the web
  // page. Copy-then-sort so the definition itself stays frozen.
  const orderedFields = [...(definition.fields ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  for (const field of orderedFields) {
    if (!field.group) {
      rootFields.push(field);
      continue;
    }
    const meta = visualGroupIndex.get(field.group);
    // Unknown visual group reference — fall back to a bucket named
    // after the raw reference so nothing silently disappears.
    const bucketKey = meta?.key ?? field.group;
    const heading = meta?.label ?? field.group;
    const description = meta?.description ?? null;

    const bucket = groupMap.get(bucketKey);
    if (bucket) {
      groupMap.set(bucketKey, {
        heading: bucket.heading,
        description: bucket.description,
        fields: [...bucket.fields, field],
      });
    } else {
      groupMap.set(bucketKey, {
        heading,
        description,
        fields: [field],
      });
    }
  }

  // The root bucket (no visual group) renders first, then the
  // grouped buckets in visual-group `order` (fallback: definition
  // order, which Map preserves).
  const buckets: IFieldBucket[] = [];
  if (rootFields.length > 0) {
    buckets.push({ heading: null, description: null, fields: rootFields });
  }
  for (const bucket of groupMap.values()) buckets.push(bucket);
  return buckets;
}

/**
 * `<GroupScreen>` — one settings group's editor.
 *
 * @param props - {@link IGroupScreenProps}.
 *
 * @example
 * ```tsx
 * <Stack.Screen name="SettingsGroup">
 *   {(routeProps) => (
 *     <GroupScreen groupKey={routeProps.route.params?.groupKey} />
 *   )}
 * </Stack.Screen>
 * ```
 */
export function GroupScreen(props: IGroupScreenProps = {}): ReactElement {
  const groupKey = useRouteParamOrProp("groupKey", props.groupKey);
  const { safeAreaEdges } = useNativeSettingsConfig();
  const groups = useSettingsSchema();
  const t = useNativeSettingsT();

  const definition = useMemo<ISettingDefinition | undefined>(
    () => groups.find((g) => g.key === groupKey),
    [groups, groupKey],
  );

  // Hydrate values from the settings service. Falls back to an empty
  // Record when the group is unknown — the screen renders a "not
  // found" state below so `useSettings("")` never trips.
  const { values, setMany } = useSettings<Record<string, unknown>>(definition?.key ?? "");

  const buckets = useMemo<readonly IFieldBucket[]>(
    () => (definition ? bucketFieldsByVisualGroup(definition) : []),
    [definition],
  );

  if (!definition) {
    return (
      <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
        <View className="p-6">
          <Text className="text-foreground text-lg font-semibold">
            {t("group_page.not_found_title")}
          </Text>
          <Text className="text-muted mt-1 text-sm">{t("group_page.not_found_description")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Screen header — group label + description. */}
        <View className="mb-6">
          <Text className="text-foreground text-2xl font-semibold">{definition.label}</Text>
          {definition.description ? (
            <Text className="text-muted mt-1 text-sm">{definition.description}</Text>
          ) : null}
        </View>

        {/* Bucketed fields — one ListGroup per visual sub-group. */}
        {buckets.map((bucket, bucketIndex) => (
          <View className={bucketIndex > 0 ? "mt-6" : undefined} key={bucket.heading ?? "__root__"}>
            {bucket.heading ? (
              <View className="mb-2 px-1">
                <Text className="text-foreground text-sm font-medium">{bucket.heading}</Text>
                {bucket.description ? (
                  <Text className="text-muted text-xs">{bucket.description}</Text>
                ) : null}
              </View>
            ) : null}

            <ListGroup>
              {bucket.fields.map((field, fieldIndex) => (
                <Fragment key={field.key}>
                  {fieldIndex > 0 ? <Separator className="mx-4" /> : null}
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
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

GroupScreen.displayName = "GroupScreen";
