/**
 * @file kbd.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/kbd` command-palette runtime.
 *
 *   These tokens are the seam between the concrete implementations
 *   (which live in `@stackra/kbd/core/services` + the reactive
 *   stores under `@stackra/kbd/core/registries`) and their consumers
 *   (the React hooks under `@stackra/kbd/react`, plus any feature
 *   package that injects a kbd primitive). Per
 *   `.kiro/steering/contracts-and-decorators-promotion.md` §Test B,
 *   seam tokens live in `@stackra/contracts` from day one — even
 *   before a second consumer appears.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms — a necessary property for the
 *   DI graph to resolve tokens through re-exports and dynamic
 *   imports.
 *
 *   Identifiers are `KBD_`-prefixed where the short name could
 *   collide with a sibling package's token (`ANALYTICS_SERVICE`,
 *   `THEME_SERVICE`, ...). Kbd-unique names (`PALETTE_SERVICE`,
 *   `SHORTCUT_SERVICE`, `WALKTHROUGH_SERVICE`, `PALETTE_STORE`,
 *   ...) stay short.
 */

// ── Config ─────────────────────────────────────────────────────

/** DI token for the merged `IKbdConfig` (module-options + defaults). */
export const KBD_CONFIG = "kbd" as const;

// ── Service tokens ────────────────────────────────────────────

/** DI token for the kbd `AnalyticsService` — palette + command telemetry. */
export const KBD_ANALYTICS_SERVICE = Symbol.for("KBD_ANALYTICS_SERVICE");

/** DI token for the kbd `FavoritesService` — starred command index. */
export const KBD_FAVORITES_SERVICE = Symbol.for("KBD_FAVORITES_SERVICE");

/** DI token for the `PaletteService` — palette state machine + executor. */
export const PALETTE_SERVICE = Symbol.for("KBD_PALETTE_SERVICE");

/** DI token for the kbd `RecentsService` — recently-executed command list. */
export const KBD_RECENTS_SERVICE = Symbol.for("KBD_RECENTS_SERVICE");

/** DI token for the `ShortcutService` — global keydown dispatcher + scope registry. */
export const SHORTCUT_SERVICE = Symbol.for("KBD_SHORTCUT_SERVICE");

/** DI token for the kbd `ThemeService` — active palette theme selector. */
export const KBD_THEME_SERVICE = Symbol.for("KBD_THEME_SERVICE");

/** DI token for the `WalkthroughService` — onboarding step tracker. */
export const WALKTHROUGH_SERVICE = Symbol.for("KBD_WALKTHROUGH_SERVICE");

// ── Store tokens ──────────────────────────────────────────────

/** DI token for the palette reactive `Store<IPaletteState>`. */
export const PALETTE_STORE = Symbol.for("KBD_PALETTE_STORE");

/** DI token for the recents reactive `Store<IRecentsState>`. */
export const RECENTS_STORE = Symbol.for("KBD_RECENTS_STORE");

/** DI token for the favorites reactive `Store<IFavoritesState>`. */
export const FAVORITES_STORE = Symbol.for("KBD_FAVORITES_STORE");

/** DI token for the theme reactive `Store<IThemeState>`. */
export const THEME_STORE = Symbol.for("KBD_THEME_STORE");

/** DI token for the walkthrough reactive `Store<IWalkthroughState>`. */
export const WALKTHROUGH_STORE = Symbol.for("KBD_WALKTHROUGH_STORE");
