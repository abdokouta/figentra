/**
 * @file use-route-param-or-prop.util.ts
 * @module @stackra/settings/native/screens/group-screen
 * @description `useRouteParamOrProp()` — resolves a React Navigation
 *   route param OR falls back to a caller-supplied prop.
 *
 *   Screens under `@stackra/settings/native` accept the routing key
 *   either as a prop (consumer wires the screen manually) or as a
 *   React Navigation route param (consumer wires it via a Stack /
 *   Tab navigator). This util centralises the resolution so every
 *   screen picks up the same rule.
 *
 *   `@react-navigation/native` is an OPTIONAL peer per the package's
 *   `peerDependenciesMeta`. When the peer is absent the util
 *   quietly returns the prop only — the screen still works so long
 *   as the caller passes the prop directly.
 */

import { useRoute, type RouteProp } from "@react-navigation/native";

/**
 * Loose `RouteProp` shape — carries the mandatory `key` + `name`
 * fields React Navigation demands, plus a params record wide enough
 * for our two known screen types (`SettingsGroup` / `SettingsSection`
 * / `SettingsFieldEditor`). Kept local so consumers with fully-typed
 * param lists still compile — React Navigation's generics are
 * covariant on the params record.
 */
export type LooseSettingsRoute = RouteProp<
  Record<string, Readonly<Record<string, unknown>> | undefined>,
  string
>;

/**
 * Resolve a route param or prop for a native settings screen.
 *
 * @param paramName - The route param key to read.
 * @param propValue - The caller-supplied prop value. Wins over the
 *   route param when defined.
 * @returns The resolved string value, or an empty string when neither
 *   source provides one — screens branch on the empty string to
 *   render a "not found" state rather than crashing.
 */
export function useRouteParamOrProp(paramName: string, propValue?: string): string {
  if (propValue !== undefined && propValue.length > 0) return propValue;

  // `useRoute<LooseSettingsRoute>()` — kept loose so the util doesn't
  // need the consumer's typed param list. The route.params shape is
  // `Record<string, unknown> | undefined` per screen.
  const route = useRoute<LooseSettingsRoute>();
  const raw = route.params?.[paramName];
  return typeof raw === "string" ? raw : "";
}
