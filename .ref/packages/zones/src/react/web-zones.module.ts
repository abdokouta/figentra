/**
 * @file web-zones.module.ts
 * @module @stackra/zones/react
 * @description `WebZonesModule` — the React/web-runtime binding
 *   on top of {@link ZonesModule}.
 *
 *   Composes `ZonesModule.forRoot(...)` (optional — see
 *   `IWebZonesModuleOptions.composeCore`).
 */

import { Module, type DynamicModule } from "@stackra/container";

import { WEB_ZONES_MODULE_OPTIONS } from "./constants";

import type { IWebZonesModuleOptions } from "./interfaces";

import { ZonesModule } from "../core/zones.module";

/**
 * Web-runtime binding for `@stackra/zones`.
 */
@Module({})
export class WebZonesModule {
  /**
   * Configure the web-runtime zones module.
   *
   * @param options - Module configuration. Defaults compose the
   *   core zones module as a global provider.
   */
  public static forRoot(options: IWebZonesModuleOptions = {}): DynamicModule {
    const composeCore = options.composeCore !== false;
    const coreGlobal = options.coreGlobal !== false;

    const imports: DynamicModule["imports"] = [];

    if (composeCore) {
      imports.push(ZonesModule.forRoot({ global: coreGlobal }));
    }

    return {
      module: WebZonesModule,
      global: true,
      imports,
      providers: [{ provide: WEB_ZONES_MODULE_OPTIONS, useValue: options }],
      exports: [ZonesModule],
    };
  }
}
