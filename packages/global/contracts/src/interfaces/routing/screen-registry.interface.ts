/**
 * @file screen-registry.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Public shape of the `ScreenRegistry` — the
 *   native counterpart to {@link IRouteRegistry} / the
 *   `RouteRegistry` on the web surface.
 */

import type { IScreenRecord } from "./screen-record.interface";

/**
 * The screen registry.
 *
 * Consumer packages register screens either statically (via
 * `NativeRoutingModule.forRoot({ screens })`) or, in a future spec,
 * via `NativeRoutingModule.forFeature({ name, screens })`.
 */
export interface IScreenRegistry {
  /**
   * Register a single screen under its `name`.
   *
   * @param screen - Screen record to register.
   * @param source - Source label — `"root"`, `"feature:<name>"`, etc.
   */
  registerScreen(screen: IScreenRecord, source?: string): void;

  /**
   * Register a batch of screens.
   *
   * @param screens - Screen records.
   * @param source  - Source label — `"feature:<name>"`.
   */
  registerBatch(screens: readonly IScreenRecord[], source: string): void;

  /**
   * List every registered screen in insertion order.
   */
  listScreens(): readonly IScreenRecord[];

  /**
   * Look up a screen by name. Returns `undefined` when unknown.
   */
  getScreen(name: string): IScreenRecord | undefined;

  /**
   * Look up the source label for a registered screen name. Returns
   * `undefined` when unknown.
   */
  getSource(name: string): string | undefined;
}
