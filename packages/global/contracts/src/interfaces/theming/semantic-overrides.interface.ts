/**
 * @file semantic-overrides.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Optional per-mode overrides for semantic colors.
 *
 *   Used when a brand ships specific success / warning / danger colors
 *   that don't fit the algorithmic derivation (Netflix red, Spotify
 *   green, Discord blurple, Airbnb magenta). Also carries an optional
 *   accent-foreground override for cases where the auto contrast pick
 *   is wrong.
 *
 *   Applied by the palette engine INSTEAD OF the calculated semantic
 *   colors when set. Missing modes fall back to the calculated pair.
 *
 *   Three interfaces here form one compound family per the
 *   composite-family-grouping exception in code-standards.md §Rule 4.
 */

/**
 * A single semantic color override — one slot from the trio
 * (success / warning / danger) or the accent-foreground.
 */
export interface ISemanticColorOverride {
  /**
   * OKLCH color string. Format: `oklch(L C H)` or `oklch(L% C H)`.
   * Example: `"oklch(0.5148 0.1337 146.82)"` — Netflix's success green.
   */
  readonly color: string;

  /**
   * Optional foreground color for text rendered on top of `color`.
   * When omitted, the palette engine picks one automatically via the
   * OKLCH lightness threshold at 0.65.
   */
  readonly foreground?: string;
}

/**
 * The full slot set a single mode can override. Every field optional
 * — an override that only sets `danger` inherits calculated
 * `success` / `warning` / `accentForeground`.
 */
export interface ISemanticOverridesPerMode {
  /**
   * Override the accent's foreground for this mode. Bypasses the
   * `calculateAccentForeground` contrast pick — useful when the
   * brand insists on white text over a light accent (Airbnb) or
   * black over a dark accent.
   */
  readonly accentForeground?: string;

  /** Override the success color for this mode. */
  readonly success?: ISemanticColorOverride;

  /** Override the warning color for this mode. */
  readonly warning?: ISemanticColorOverride;

  /** Override the danger color for this mode. */
  readonly danger?: ISemanticColorOverride;
}

/**
 * Top-level semantic overrides — split per mode.
 *
 * @example
 *   {
 *     light: { danger: { color: "oklch(0.5509 0.2166 25.29)" } }, // Spotify red
 *     dark:  { danger: { color: "oklch(0.5931 0.2338 25.42)" } },
 *   }
 */
export interface ISemanticOverrides {
  /** Overrides applied only when `resolvedMode === "light"`. */
  readonly light?: ISemanticOverridesPerMode;

  /** Overrides applied only when `resolvedMode === "dark"`. */
  readonly dark?: ISemanticOverridesPerMode;
}
