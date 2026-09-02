/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Barrel export for theming interfaces + types.
 *
 *   The canonical theme shape is `ITheme` (see `theme.interface.ts`) —
 *   a 7-scalar `IThemeValues` bag plus optional metadata. The palette
 *   engine in `@stackra/theming/core/utils/palette` expands the values
 *   into the full CSS variable map at runtime; the workspace never
 *   stores full token maps per preset.
 *
 *   Wire shape between backend + frontend is `IThemingPayload` —
 *   carries a `values` bag, a `presetId` reference, or a fully
 *   authored `tokens` map, plus an optional mode preference.
 */

export type { ColorMode } from "./color-mode.type";
export type { ResolvedMode } from "./resolved-mode.type";
export type { IRadiusId } from "./radius-id.type";
export type { IDesignTokenMap } from "./design-token-map.interface";
export type { IFontConfig } from "./font-config.interface";
export type {
  ISemanticColorOverride,
  ISemanticOverridesPerMode,
  ISemanticOverrides,
} from "./semantic-overrides.interface";
export type { ISSRScriptOptions } from "./ssr-script-options.interface";
export type { IThemeValues } from "./theme-values.interface";
export type { ITheme } from "./theme.interface";
export type { IThemingPayload } from "./theming-payload.interface";
export type { IActiveThemeState } from "./active-theme-state.interface";
export type { IThemeBindings } from "./theme-bindings.interface";
export type {
  IThemeRegistry,
  IThemeRegisterOptions,
  ThemeConflictStrategy,
  ThemeRegistryListener,
} from "./theme-registry.interface";
export type { IThemeService } from "./theme-service.interface";
