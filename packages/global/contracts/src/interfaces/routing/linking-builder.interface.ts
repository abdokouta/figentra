/**
 * @file linking-builder.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Public shape of the `LinkingBuilderService` — the
 *   native-only service that turns `IScreenRecord[]` into React
 *   Navigation's `LinkingOptions.config` shape.
 *
 *   Kept as a contract so consumers who want to inject the built
 *   linking config for a custom `<NavigationContainer>` mount (e.g.
 *   apps that layer a bespoke navigator between the provider and
 *   the framework) can reach for the token.
 */

/**
 * React Navigation's `LinkingOptions.config.screens` shape —
 * described here structurally to avoid a devDependency on
 * `@react-navigation/native` inside contracts.
 *
 * A leaf entry maps a screen name to a path template
 * (`{ Home: "/home" }`) or a nested object with `path` +
 * `screens` for nested navigators.
 */
export type ILinkingScreensConfig = Record<
  string,
  | string
  | {
      readonly path?: string;
      readonly initialRouteName?: string;
      readonly screens?: ILinkingScreensConfig;
    }
>;

/**
 * The linking builder service.
 */
export interface ILinkingBuilder {
  /**
   * Build a React-Navigation-shaped `screens` object from the
   * currently-registered screen tree.
   *
   * @returns The `screens` sub-tree of `LinkingOptions.config`.
   */
  buildScreensConfig(): ILinkingScreensConfig;
}
