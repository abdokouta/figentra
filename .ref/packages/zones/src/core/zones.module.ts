/**
 * @file zones.module.ts
 * @module @stackra/zones/core
 * @description `ZonesModule` — DI module for the zone/slot
 *   extensibility runtime.
 *
 *   `forRoot(options?)` binds:
 *
 *   - `ZoneRegistry` as a concrete class (singleton).
 *   - `ZONE_REGISTRY` token — `useExisting` alias for the class,
 *     so cross-package consumers `@Inject(ZONE_REGISTRY)` and
 *     resolve the same instance.
 *
 *   NO `forFeature(...)` on the root module — contributions land
 *   through consumer modules' own `<Host>Module.forFeature({ zones })`
 *   per design.md §4 and §10. The registrar-class pattern for those
 *   consumer-side `forFeature` calls is codified in
 *   `.kiro/steering/module-lifecycle.md` +
 *   [ADR-0052](../../../../docs/adr/0052-forfeature-registrar-class-pattern.md).
 *
 *   The module is `@Global()` by default — a workspace typically
 *   has ONE zone registry that every host page + every
 *   contribution routes through, so the binding must reach every
 *   child injector without explicit `imports: [ZonesModule]`.
 */

import {
  Global,
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
} from "@stackra/container";
import {
  ZONE_REGISTRY,
  type IZoneContribution,
  type IZoneRegistry,
} from "@stackra/contracts";

import { ZoneRegistry } from "./services";

import type { IZonesModuleOptions } from "./interfaces";

/**
 * DI module for `@stackra/zones/core`.
 *
 * @example Consumer app
 * ```ts
 * @Module({
 *   imports: [ZonesModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class ZonesModule {
  /**
   * Configure the module with an optional `global` flag.
   *
   * Defaults `global: true` — a workspace typically has one zone
   * registry the whole app reads from + writes to. Set `false` to
   * scope the registry to a sub-tree (rare — testing / multi-tenant
   * sandboxes with isolated zone graphs).
   *
   * @param options - Module configuration.
   */
  public static forRoot(options: IZonesModuleOptions = {}): DynamicModule {
    return {
      module: ZonesModule,
      global: options.global !== false,
      providers: [
        ZoneRegistry,
        { provide: ZONE_REGISTRY, useExisting: ZoneRegistry },
      ],
      exports: [ZoneRegistry, ZONE_REGISTRY],
    };
  }

  /**
   * Declaratively register zone contributions from a consumer
   * package.
   *
   * Every feature package that owns zone contributions authors
   * one `.zone.tsx` file per contribution under
   * `src/react/zones/`, exports the `defineZone(...)` result, and
   * imports them here:
   *
   * ```tsx
   * // packages/frontend/theming/src/react/web-theming.module.ts
   * imports: [
   *   ThemingModule.forRoot(options),
   *   ZonesModule.forFeature({
   *     source: "@stackra/theming",
   *     zones: [themeSwitcherZone],
   *   }),
   * ]
   * ```
   *
   * ## Registration timing
   *
   * The inline `@Injectable() ZonesFeatureRegistrar` class fires
   * at `OnApplicationBootstrap` per ADR-0052. Every registrar
   * class is a fresh identity per `forFeature` call so multiple
   * calls from different packages never collide — the container
   * tracks providers by class identity.
   *
   * ## Empty arrays
   *
   * `zones: []` is valid — the registrar registers zero
   * contributions and returns. Same "empty scaffold" tolerance as
   * `DashboardModule.forFeature({ widgets: [] })` per
   * `.kiro/steering/subpath-layering.md` §"Accepted exception —
   * empty widget-scaffold `forFeature`".
   */
  public static forFeature(options: {
    readonly zones?: readonly IZoneContribution[];
    readonly source?: string;
  }): DynamicModule {
    @Injectable()
    class ZonesFeatureRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(ZONE_REGISTRY) private readonly registry: IZoneRegistry,
      ) {}

      public onApplicationBootstrap(): void {
        for (const zone of options.zones ?? []) {
          this.registry.register(zone);
        }
      }
    }

    return {
      module: ZonesModule,
      providers: [ZonesFeatureRegistrar],
      exports: [],
    };
  }
}
