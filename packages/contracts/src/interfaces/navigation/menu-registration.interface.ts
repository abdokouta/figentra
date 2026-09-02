/**
 * @file menu-registration.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description The record a package registers when contributing a
 *   menu to `@stackra/navigation`'s registry.
 *
 *   Registration is done through `NavigationModule.forFeature({ menus })`
 *   per ADR-0052 §Canonical shape — an inline `@Injectable()` registrar
 *   class implementing `OnApplicationBootstrap` calls
 *   `registry.register(location, registration)` for each entry.
 */

import type { IMenu } from "./menu.interface";
import type { INavigationContext } from "./navigation-context.interface";

/**
 * A registered menu — one package's contribution to a location.
 *
 * The registry keys by `location`, orders by `priority` ascending,
 * and applies each `when(ctx)` predicate at render time. Multiple
 * packages CAN register against the same location — the registry
 * merges their `items` arrays honouring `IMenuItem.order`.
 */
export interface IMenuRegistration {
  /** The menu payload (id + items + layout tokens). */
  readonly menu: IMenu;
  /**
   * Registration priority — lower runs first when multiple menus
   * target the same location. Default `100`.
   */
  readonly priority?: number;
  /**
   * Sync visibility predicate — skip the whole registration when
   * this returns `false`.
   */
  readonly when?: (ctx: INavigationContext) => boolean;
  /**
   */
  readonly source?: string;
}
