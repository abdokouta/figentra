/**
 * @file web-zones-module-options.interface.ts
 * @module @stackra/zones/react/interfaces
 * @description Options bag consumed by
 *   `WebZonesModule.forRoot(...)`.
 */

/**
 * Options for the react (web) zones module.
 */
export interface IWebZonesModuleOptions {
  /**
   * Whether the module should also compose
   * `ZonesModule.forRoot(...)` — i.e. seed the core zones runtime.
   *
   * `true` (default) — the web module registers the core zones
   * module too. Set `false` when the consumer already imports
   * `ZonesModule.forRoot(...)` separately (e.g. inside an existing
   * setup that predates `WebZonesModule`).
   *
   * @default true
   */
  readonly composeCore?: boolean;

  /**
   * Whether the core zones module is registered as `global`
   * (workspace default) when `composeCore` is true.
   *
   * Ignored when `composeCore: false`.
   *
   * @default true
   */
  readonly coreGlobal?: boolean;
}
