/**
 * @file screen-record.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Native counterpart to {@link IRouteRecord}.
 *
 *   Where `IRouteRecord` extends RRv7's `RouteObject` and lives on
 *   the web surface, `IScreenRecord` is React-Navigation-shaped and
 *   lives on the native surface. Both records share the workspace's
 *   cross-cutting concerns (guards, middleware, access, meta) but
 *   diverge on the platform-specific ROUTING fields — RRv7 has
 *   `loader` / `action` / `element` / `children`, React Navigation
 *   has `component` / `initialParams` / `options`.
 *
 *   Design decision (2026-07-26 spec): `IScreenRecord` and
 *   `IRouteRecord` stay as INDEPENDENT contracts. Cross-cutting
 *   fields are deliberately copied. When one shape drifts (e.g.
 *   RRv7's data-router grows a native counterpart, or React
 *   Navigation adds a web-story), the split stays clean.
 *
 *   Type-only import surface: consumers writing
 *   `defineScreen<NativeStackNavigationOptions>({...})` opt into a
 *   stricter `options` type via the generic; the default is
 *   `Record<string, unknown>` so contracts stays free of an
 *   `@react-navigation/*` devDependency.
 */

import type { ComponentType } from "react";

import type { IAccessSpec } from "./access-spec.interface";
import type { IGuardOptions } from "./guard-options.interface";
import type { IMiddlewareOptions } from "./middleware-options.interface";

/**
 * Screen kind — informs the caller which navigator container to
 * compose. Optional; when omitted the record is treated as a leaf
 * `"screen"`.
 *
 * - `"screen"` — a leaf screen mounted inside a navigator.
 * - `"stack"` — a nested stack of children (leverages
 *   `createNativeStackNavigator()` in the consumer).
 * - `"tabs"` — a nested tab group (leverages
 *   `createBottomTabNavigator()` in the consumer).
 */
export type IScreenKind = "screen" | "stack" | "tabs";

/**
 * A single native screen record.
 *
 * @typeParam TOptions - Options-bag type; defaults to
 *   `Record<string, unknown>`. Consumers may narrow by passing e.g.
 *   `NativeStackNavigationOptions` from `@react-navigation/native-stack`.
 * @typeParam TName    - Screen name literal; defaults to `string`.
 * @typeParam TParams  - Initial params shape; defaults to `undefined`.
 *
 * @example
 * ```typescript
 * import { defineScreen } from "@stackra/routing/native";
 * import { HomeScreen } from "../../screens/home";
 *
 * export const homeScreen = defineScreen({
 *   name: "Home",
 *   path: "/",
 *   component: HomeScreen,
 *   guards: [AuthGuard],
 *   access: { roles: ["member"] },
 *   options: { headerTitle: "Home" },
 * });
 * ```
 */
export interface IScreenRecord<
  TOptions = Record<string, unknown>,
  TName extends string = string,
  TParams = undefined,
> {
  /**
   * React Navigation screen name — the identifier used by
   * `<Stack.Screen name={...}>` and `navigation.navigate(name)`.
   * Must be unique within its navigator scope.
   */
  readonly name: TName;

  /**
   * The screen component. React Navigation's
   * `<Stack.Screen component={...}>` slot.
   */
  readonly component: ComponentType<any>;

  /**
   * Optional initial params — merged into `route.params` on first
   * mount. Same shape React Navigation accepts via
   * `<Stack.Screen initialParams={...}>`.
   */
  readonly initialParams?: TParams;

  /**
   * Screen options — merged with the navigator's default
   * `screenOptions`. Passed through to
   * `<Stack.Screen options={...}>`. Kept as an untyped bag by
   * default so contracts stays platform-free; consumers narrow via
   * the `TOptions` generic.
   */
  readonly options?: TOptions;

  /**
   * Deep-link path template. Used by `buildLinkingConfig()` to
   * assemble the React Navigation `LinkingOptions.config`. Follows
   * React Navigation's placeholder syntax:
   *
   * - `"/settings"`
   * - `"/users/:id"`
   * - `"/posts/:slug?filter=:filter"` (query stubs)
   *
   * Omit for screens that have no deep-link entry (e.g. an
   * intermediate wizard step reachable only via
   * `navigation.navigate`).
   */
  readonly path?: string;

  /**
   * Workspace guards to run before mounting / focusing the screen.
   * Mirrors {@link IRouteRecord}'s `guards` — same shape,
   * same resolver.
   */
  readonly guards?: readonly IGuardOptions[];

  /**
   * Workspace middleware to run on focus. Mirrors
   * {@link IRouteRecord}'s `middleware` field.
   */
  readonly middleware?: readonly IMiddlewareOptions[];

  /**
   * Access-shortcut spec (roles / permissions). Compiled into the
   * equivalent `guards` list at bootstrap. Same shape as
   * {@link IRouteRecord}'s `access` field.
   */
  readonly access?: IAccessSpec;

  /**
   * Arbitrary metadata bag — visible to guards, middleware, and
   * consumer hooks via `useScreenMeta()`. Reserved workspace keys
   * live under a `stackra:*` prefix (analytics tags, breadcrumb
   * labels, feature flags).
   */
  readonly meta?: Readonly<Record<string, unknown>>;

  /**
   * Screen kind. Omit for a plain leaf screen. Set to `"stack"` or
   * `"tabs"` when the record is a nested navigator (children in
   * `children`).
   */
  readonly kind?: IScreenKind;

  /**
   * Nested children when `kind === "stack" | "tabs"`. Each child is
   * a full {@link IScreenRecord} — nested navigators compose
   * exactly the same shape.
   */
  readonly children?: readonly IScreenRecord[];
}
