/**
 * @file zones-module-options.interface.ts
 * @module @stackra/zones/core/interfaces
 * @description Options accepted by `ZonesModule.forRoot(options?)`.
 *
 *   Kept intentionally tiny — the root module only owns the
 *   registry lifecycle; every actual contribution flows through a
 *   consumer module's own `<Host>Module.forFeature({ zones })`.
 */

/**
 * Configuration for `ZonesModule.forRoot(...)`.
 *
 * @example
 * ```ts
 * ZonesModule.forRoot({ global: true });
 * ```
 */
export interface IZonesModuleOptions {
  /**
   * Whether the module registers as a global module — meaning its
   * `ZONE_REGISTRY` binding reaches every child injector without
   * an explicit `imports: [ZonesModule]`. Defaults to `true`
   * because a workspace typically has ONE zone registry that
   * every host page + every contribution routes through.
   */
  readonly global?: boolean;
}
