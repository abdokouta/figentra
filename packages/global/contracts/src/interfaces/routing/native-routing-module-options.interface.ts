/**
 * @file native-routing-module-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape for
 *   `NativeRoutingModule.forRoot(options)`.
 *
 *   Ships as a SUPERSET of {@link IRoutingModuleOptions}: every field
 *   the core routing module accepts (basename, devMode, ai, seo, …)
 *   is inherited, plus native-only knobs for deep-link prefixes and
 *   the initial route.
 */

import type { IRoutingModuleOptions } from "./routing-module-options.interface";
import type { IScreenRecord } from "./screen-record.interface";

/**
 * Native routing module options.
 *
 * @example
 * ```typescript
 * import { NativeRoutingModule } from "@stackra/routing/native";
 * import { HomeScreen, SettingsScreen } from "../../screens";
 *
 * @Module({
 *   imports: [
 *     NativeRoutingModule.forRoot({
 *       screens: [
 *         { name: "Home", path: "/", component: HomeScreen },
 *         { name: "Settings", path: "/settings", component: SettingsScreen },
 *       ],
 *       linking: {
 *         prefixes: ["stackra://", "https://app.stackra.io"],
 *       },
 *       initialRouteName: "Home",
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export interface INativeRoutingModuleOptions extends IRoutingModuleOptions {
  /**
   * The screens the app ships at bootstrap. Seeded into the
   * `ScreenRegistry` at `onModuleInit`. Feature packages
   * that contribute screens will do so via a future
   * `NativeRoutingModule.forFeature(...)` mechanism (deferred; not
   * shipped in the initial cut).
   */
  readonly screens?: readonly IScreenRecord[];

  /**
   * The screen name to mount as the navigator's initial route.
   * Passed through to
   * `<Stack.Navigator initialRouteName={...}>`. Optional; React
   * Navigation falls back to the first `<Stack.Screen>` when unset.
   */
  readonly initialRouteName?: string;

  /**
   * Deep-linking configuration. Merged with the auto-built
   * `config` derived from each screen's `path` field.
   */
  readonly linking?: {
    /**
     * URL prefixes React Navigation should treat as deep-links.
     * Common shape: `["myapp://", "https://myapp.com"]`.
     *
     * @default []
     */
    readonly prefixes?: readonly string[];

    /**
     * Whether deep-linking is enabled at all. When `false`, the
     * `<NavigationContainer>` mounts without a `linking` prop —
     * useful for storybook + tests.
     *
     * @default true
     */
    readonly enabled?: boolean;

    /**
     * Async function to get the initial URL — passed through to
     * React Navigation's `LinkingOptions.getInitialURL`. Consumers
     * rarely need this; defaults are correct for standard Expo /
     * bare RN apps.
     */
    readonly getInitialURL?: () => Promise<string | null | undefined>;

    /**
     * Async function to subscribe to URL updates — passed through
     * to React Navigation's `LinkingOptions.subscribe`.
     */
    readonly subscribe?: (
      listener: (url: string) => void,
    ) => undefined | void | (() => void);
  };

  /**
   * Fallback element rendered while `<NavigationContainer>` reads
   * the initial URL. React Navigation shows nothing by default;
   * consumers who want a splash screen pass a ReactNode here.
   */
  readonly onReadyFallback?: unknown;
}
