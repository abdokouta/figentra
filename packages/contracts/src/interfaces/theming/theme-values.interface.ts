/**
 * @file theme-values.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description The 7-scalar authoring shape for a theme.
 *
 *   Ported from HeroUI 3's
 *   `apps/docs/src/app/themes/theme-values.ts` `ThemeValues`
 *   record. Every named preset in the workspace stores THESE 7
 *   scalars — the palette engine derives the ~30-variable design
 *   token map from these inputs at runtime.
 *
 *   Rationale: storing full token maps per theme (~30 CSS
 *   variables × 2 modes × N presets) creates a maintenance
 *   burden the algorithm eliminates. HeroUI 3's approach — 7
 *   numbers per preset + a deterministic derivation — is the
 *   canonical model this workspace adopts.
 *
 *   See:
 *   - `.kiro/plans/theming-and-brand-refactor.md` §"The seven
 *     scalars" — the design record.
 *   - `.ref/heroui-3/apps/docs/src/app/themes/utils/generate-theme-colors.ts`
 *     — the reference algorithm the palette engine ports.
 */

import type { IRadiusId } from "./radius-id.type";
import type { ISemanticOverrides } from "./semantic-overrides.interface";

/**
 * The seven scalars that fully define a theme's visual identity.
 *
 * The palette engine expands these into the full design-token map
 * for both light and dark modes on demand.
 */
export interface IThemeValues {
  /**
   * Accent OKLCH lightness. Range 0-1.
   *
   * Anchors the accent color's brightness. Values above 0.65 read
   * as "light" (dark foreground is picked automatically); values
   * below read as "dark" (white foreground). Netflix red uses
   * 0.5814, Spotify green uses 0.7697, default blue uses 0.6204.
   */
  readonly lightness: number;

  /**
   * Accent OKLCH chroma. Range 0-~0.4.
   *
   * Anchors the accent color's saturation. Uber's monochrome uses
   * 0, Discord's blurple uses 0.2091, Coinbase's electric blue
   * uses 0.2628. Chroma above ~0.3 is rarely readable on
   * text-on-color contrast pairs.
   */
  readonly chroma: number;

  /**
   * Accent OKLCH hue. Range 0-360.
   *
   * Anchors the accent color's hue. Semantic colors (success /
   * warning / danger) blend toward this hue at a 12% factor for
   * cohesion. Blue = 250, red = 25, green = 148, purple = 305,
   * orange = 60, pink = 340.
   */
  readonly hue: number;

  /**
   * Gray-chroma bias for neutrals. Range 0-~0.02.
   *
   * Set to 0 for pure gray neutrals (Vercel / Linear taste). Above
   * 0 subtly tints backgrounds / surfaces / borders toward the
   * accent hue. Values above ~0.01 make the tint visible at scale.
   */
  readonly base: number;

  /**
   * Font family identifier. Must match a `IFontConfig.id` known
   * to the theming module's font registry, or the special value
   * `"custom-<hash>"` for a custom Google Fonts URL registered at
   * boot.
   */
  readonly fontFamily: string;

  /**
   * Radius scale anchor for surface elements (cards, popovers,
   * modals, sheets, buttons). Every `--radius-*` scale value the
   * derived layer computes is a multiple of this anchor.
   */
  readonly radius: IRadiusId;

  /**
   * Radius scale anchor for form fields (inputs, selects,
   * textareas, comboboxes). Distinct from `radius` because forms
   * often want a different pill / square aesthetic than the
   * surrounding surfaces.
   */
  readonly formRadius: IRadiusId;

  /**
   * Optional per-mode exact overrides for semantic colors +
   * accent foreground. Applied by the palette engine INSTEAD OF
   * the calculated values when set. Missing slots fall back to
   * the calculated pair.
   *
   * See {@link ISemanticOverrides} for the shape.
   */
  readonly semanticOverrides?: ISemanticOverrides;
}
