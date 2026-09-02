/**
 * @file dynamic-module.interface.ts
 * @module @stackra/contracts/interfaces/modules
 * @description Interface defining a Dynamic Module — the return shape of
 *   `Module.forRoot()` / `Module.forRootAsync()`.
 *
 * @see Dynamic module contract used by `Module.forRoot()` / `Module.forRootAsync()`
 *
 * @publicApi
 */

import { Type } from "../type.interface";
import type { ModuleMetadata } from "./module-metadata.interface";

/**
 * The return shape of `<Name>Module.forRoot(...)` /
 * `.forRootAsync(...)` / `.forFeature(...)` — a `ModuleMetadata`
 * augmented with the runtime module class it re-declares plus an
 * optional global-scope flag.
 */
export interface DynamicModule extends ModuleMetadata {
  /**
   * A module reference
   */
  module: Type<any>;

  /**
   * When "true", makes a module global-scoped.
   *
   * Once imported into any module, a global-scoped module will be visible
   * in all modules. Thereafter, modules that wish to inject a service exported
   * from a global module do not need to import the provider module.
   *
   * @default false
   */
  global?: boolean;
}
