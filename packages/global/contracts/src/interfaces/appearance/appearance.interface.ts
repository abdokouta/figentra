/**
 * @file appearance.interface.ts
 * @module @stackra/contracts/interfaces/appearance
 * @description Canonical structural narrowing of React Native's
 *   `Appearance` module surface — the OS-level color-scheme signal
 *   consumed by every `@stackra/*` package that reads the user's
 *   system light/dark preference.
 *
 *   The interface exists because `@stackra/theming/native` shipped a
 *   local `AppearanceLike` shim of the same shape — a pattern
 *   `.kiro/steering/contract-reexports.md` §"Rule — never define a
 *   local `I*Like` structural shim for a missing contract"
 *   explicitly bans. The audit at
 *   `.kiro/reports/code-standards-steward/2026-07-27-bulk-export-audit.md`
 *   §"Cross-cutting patterns" grouped this alongside the sibling
 *   `IAppState` promotion because both interfaces sit at the same
 *   layer (RN system module surfaces consumed as optional peers).
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/theming/native` — `NativeThemeBindings` (reads
 *     `getColorScheme()` for the initial theme + subscribes via
 *     `addChangeListener` for live OS preference changes).
 *
 *   Single-consumer today; promoted alongside `IAppState` under the
 *   Family-1 grouping because both interfaces describe RN system
 *   modules and the audit consolidated the group intentionally so a
 *   second future consumer (e.g. a future
 *   `@stackra/status-bar/native` package) drops in without another
 *   contract promotion dance.
 *
 *   ## Why structural narrowing (not the full `Appearance` type)
 *
 *   `react-native`'s `Appearance` module carries more surface than
 *   `NativeThemeBindings` needs — `setColorScheme`, memory-related
 *   utilities on newer RN versions, etc. Narrowing to the two-method
 *   surface every consumer touches keeps `react-native` OPTIONAL in
 *   the consumer's peer dependency table + documents the exact
 *   contract the theming layer depends on.
 *
 *   ## Third-party narrowing exemption
 *
 *   `contract-reexports.md`'s `I<Name>Like` ban targets structural
 *   shims that mirror an EXISTING RUNTIME TYPE inside the workspace.
 *   RN's `Appearance` is a third-party module surface, not a
 *   workspace contract — narrowing it via a purpose-built named
 *   interface is the correct promotion outcome, not a violation.
 *   Same pattern as the sibling `IAppState` promotion.
 */

/**
 * Nullable variant of React Native's `ColorSchemeName`. Values
 * mirror RN's own vocabulary: `"dark"` / `"light"` when the OS
 * reports a preference, `null` when the app is running in an
 * environment that can't answer (older RN versions, tests, SSR),
 * and `undefined` on some RN versions that return `undefined`
 * instead of `null` — every consumer treats the two the same way.
 */
export type NativeColorScheme = "dark" | "light" | null | undefined;

/**
 * Structural view of the subset of `react-native`'s `Appearance`
 * module consumed by every `@stackra/*` package that reads the
 * OS-level color scheme.
 *
 * Every method routes 1:1 to the corresponding call on the concrete
 * `Appearance` module returned by
 * `require('react-native').Appearance`. The narrower shape keeps
 * `react-native` OPTIONAL in every consumer's peer dependency table.
 *
 * @example Read the current color scheme + subscribe to changes
 * ```typescript
 * import type { IAppearance } from "@stackra/contracts";
 *
 * async function loadAppearance(): Promise<IAppearance | null> {
 *   try {
 *     const spec = "react-native";
 *     const rn = (await import(spec)) as { Appearance?: IAppearance };
 *     return rn.Appearance ?? null;
 *   } catch {
 *     return null;
 *   }
 * }
 *
 * const appearance = await loadAppearance();
 * if (appearance) {
 *   const initial = appearance.getColorScheme();
 *   const sub = appearance.addChangeListener(({ colorScheme }) => {
 *     console.log("scheme changed to", colorScheme);
 *   });
 *   // …later: sub.remove();
 * }
 * ```
 */
export interface IAppearance {
  /**
   * Read the OS-level color scheme.
   *
   * Returns `null` (or `undefined` on some RN versions) when the
   * environment can't answer — every consumer falls back to a safe
   * default (`"light"`) in that case.
   */
  getColorScheme(): NativeColorScheme;

  /**
   * Register a native change listener. The returned subscription
   * exposes a `.remove()` method that MUST be called on teardown to
   * avoid leaking the listener across HMR reloads or module
   * re-registration.
   *
   * @param listener - Callback invoked with a `{ colorScheme }`
   *   payload on every OS-level appearance change. Called
   *   asynchronously — never synchronously with the current value.
   * @returns Subscription handle with `remove()` for detach.
   */
  addChangeListener(
    listener: (preferences: { colorScheme: NativeColorScheme }) => void,
  ): {
    remove(): void;
  };
}
