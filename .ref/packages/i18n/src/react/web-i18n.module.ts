/**
 * @file web-i18n.module.ts
 * @module @stackra/i18n/react
 * @description Web-platform composition of `I18nModule.forRoot()`
 *   with the browser DOM direction adapter registered under
 *   `I18N_DIRECTION_ADAPTER`.
 *
 *   Locale persistence is handled by the core `I18nModule.forRoot`
 *   via the `storage` config field (delegated to
 *   `@stackra/storage`). This module is a thin composition that
 *   layers the DOM direction adapter + a locale-picker zone
 *   contribution on top of the core module.
 *
 *   ## Header / footer zone contributions
 *
 *   Which control the module contributes to
 *   `NAVIGATION_ZONES.HEADER_END` (+ optional footer) is chosen
 *   via the `control` option:
 *
 *   - `"selector"` (default) — button-triggered dropdown.
 *     Registers `languageSelectorHeaderZone` (header) +
 *     `languageSelectorFooterZone` (footer). Best for two or
 *     three locales; matches the workspace's marketing pair
 *     shape.
 *   - `"combobox"` — text-input + filterable popover with
 *     search on focus. Registers `languageComboboxHeaderZone`
 *     (header only — a combobox in the footer reads too
 *     search-first for a legal / copyright row). Best for
 *     settings screens and apps with 5+ locales.
 *   - `"toggle"` — compact pill `ToggleButtonGroup`. Registers
 *     `languageToggleHeaderZone` + `languageToggleFooterZone`.
 *     Best for exactly two locales.
 *   - `"none"` — opt out of framework auto-registration.
 *     Consumers using this variant own the header / footer
 *     contribution entirely via their own
 *     `ZonesModule.forFeature({ zones: [...] })`.
 *
 *   Registration uses `ZonesModule.forFeature(...)` — the
 *   declarative `defineZone(...)`-based contribution shape
 *   codified in `.kiro/steering/zones-catalog.md` §Rule 8 and
 *   `.kiro/steering/module-lifecycle.md` §"`forFeature` — always
 *   via an `@Injectable()` registrar class" (ADR-0052).
 *
 *   `@stackra/zones` is an optional peer — headless consumers
 *   still boot cleanly.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { I18N_DIRECTION_ADAPTER } from "@stackra/contracts";
import { ZonesModule } from "@stackra/zones";

import { I18nModule } from "../core/i18n.module";

import { WebDirectionAdapter } from "./adapters/web-direction.adapter";
import {
  languageComboboxHeaderZone,
  languageSelectorFooterZone,
  languageSelectorHeaderZone,
  languageToggleFooterZone,
  languageToggleHeaderZone,
} from "./zones";

import type { II18nConfig } from "../core/interfaces";

/**
 * Which locale-picker variant `WebI18nModule` auto-registers as
 * zone contributions. See file docblock for the full rundown of
 * each variant's shape + slot placement.
 */
export type WebI18nControl = "selector" | "combobox" | "toggle" | "none";

/**
 * Options accepted by `WebI18nModule.forRoot`. Extends
 * `Partial<II18nConfig>` with the `control` opt-in for
 * framework auto-registration of the header / footer locale
 * picker.
 */
export type WebI18nOptions = Partial<II18nConfig> & {
  /**
   * Which locale-picker variant the module contributes to the
   * navigation zones. `"none"` opts out of auto-registration
   * entirely so consumers own the contribution via their own
   * `ZonesModule.forFeature({ zones: [...] })`.
   *
   * @default "selector"
   */
  readonly control?: WebI18nControl;
};

/**
 * Web i18n module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebI18nModule.forRoot({
 *       defaultLocale: "en",
 *       supportedLocales: ["en", "ar"],
 *       loader: StaticLoader,
 *       loaderOptions: { translations },
 *       storage: "localStorage",
 *       // Optional — swap the auto-registered picker variant.
 *       control: "combobox",
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebI18nModule {
  /**
   * Compose `I18nModule.forRoot(config)` with the DOM direction
   * adapter and the picker-variant zone contributions.
   *
   * @param options - I18n config + optional `control` variant
   *   selector. Every field optional.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: WebI18nOptions = {}): DynamicModule {
    // Peel `control` off the options bag before forwarding the
    // rest to `I18nModule.forRoot(...)` — that field is a
    // web-only concept the core module doesn't recognize.
    const { control = "selector", ...i18nConfig } = options;

    const imports: DynamicModule["imports"] = [I18nModule.forRoot(i18nConfig)];

    // Resolve which zones to register. `"none"` skips the block
    // entirely so the consumer's own `ZonesModule.forFeature`
    // stands alone.
    const zones = pickZonesForControl(control);
    if (zones.length > 0) {
      imports.push(
        ZonesModule.forFeature({
          source: "@stackra/i18n",
          zones,
        }),
      );
    }

    return {
      module: WebI18nModule,
      global: true,
      imports,
      providers: [
        WebDirectionAdapter,
        { provide: I18N_DIRECTION_ADAPTER, useExisting: WebDirectionAdapter },
      ],
      exports: [I18N_DIRECTION_ADAPTER],
    };
  }
}

/**
 * Resolve the zone contributions for a given `control` variant.
 *
 * @param control - The variant selected via `WebI18nOptions.control`.
 * @returns The zones the module should auto-register. Empty
 *   array when `control === "none"`.
 */
function pickZonesForControl(
  control: WebI18nControl,
): readonly (typeof languageSelectorHeaderZone)[] {
  switch (control) {
    case "selector":
      return [languageSelectorHeaderZone, languageSelectorFooterZone];
    case "combobox":
      // Combobox in the footer reads too search-first for a
      // legal / copyright row — header only.
      return [languageComboboxHeaderZone];
    case "toggle":
      return [languageToggleHeaderZone, languageToggleFooterZone];
    case "none":
      return [];
  }
}
