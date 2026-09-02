/**
 * @file native-routing-feature-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape for
 *   `NativeRoutingModule.forFeature(...)` — the React-Navigation
 *   counterpart to {@link IRoutingFeatureOptions}.
 *
 *   Every feature module that contributes native screens uses this
 *   shape. Mirrors the web `IRoutingFeatureOptions` field-for-field
 *   with a single substitution: `routes: IRouteRecord[]` becomes
 *   `screens: IScreenRecord[]`.
 */

import type { IScreenRecord } from "./screen-record.interface";

/**
 * Options for `NativeRoutingModule.forFeature({...})`. Each feature
 * package that ships native screens registers them through this
 * shape.
 *
 * @example
 * ```typescript
 * import { NativeRoutingModule } from "@stackra/routing/native";
 * import { buildRbacScreens } from "./screens/build-rbac-screens.util";
 *
 * @Module({
 *   imports: [
 *     NativeRoutingModule.forFeature({
 *       name: "rbac",
 *       screens: buildRbacScreens(config),
 *     }),
 *   ],
 * })
 * export class NativeRbacModule {}
 * ```
 */
export interface INativeRoutingFeatureOptions {
  /**
   * Feature name — used to key the seed-loader token and to
   * disambiguate registrar sources in the screen registry
   * (`"feature:<name>"`).
   */
  readonly name: string;

  /**
   * Screen records the feature contributes to the navigator. Passed
   * verbatim to `ScreenRegistry.registerBatch(...)` at
   * `OnApplicationBootstrap`.
   */
  readonly screens: readonly IScreenRecord[];
}
