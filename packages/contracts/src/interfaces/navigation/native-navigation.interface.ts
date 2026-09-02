/**
 * @file native-navigation.interface.ts
 * @module @stackra/contracts/interfaces/navigation
 * @description Canonical structural narrowing of
 *   `@react-navigation/native`'s `NavigationProp<ParamListBase>` — the
 *   RN navigation seam consumed by every `@stackra/*` package that
 *   ships a `useNavigation()`-backed helper hook.
 *
 *   The interface exists because five `@stackra/*` packages each shipped
 *   an identical local `I<Name>Like` shim of the same shape — a pattern
 *   `.kiro/steering/contract-reexports.md` §"Rule — never define a local
 *   `I*Like` structural shim for a missing contract" explicitly bans.
 *   The multi-consumer test in
 *   `.kiro/steering/contracts-and-decorators-promotion.md` §"Test A" is
 *   met (5 separately-owned packages), so the correct fix is to promote
 *   the interface into `@stackra/contracts` and have every consumer
 *   `import type { INativeNavigation } from "@stackra/contracts"`.
 *
 *   ## Consumers (as of 2026-07-27)
 *
 *   - `@stackra/access-requests/native` — `useRequestNavigation`.
 *   - `@stackra/authorization/native` — `useProtectedRoute` (uses
 *     `reset` for redirect-on-deny).
 *   - `@stackra/delegation/native` — `useDelegationNavigation`.
 *   - `@stackra/rbac/native` — `useRbacNavigation`.
 *   - `@stackra/settings/native` — `useSettingsNavigation`.
 *
 *   ## Why structural narrowing (not the full `NavigationProp`)
 *
 *   `@react-navigation/native`'s `NavigationProp<ParamList, ...>` carries
 *   ~30 methods and a set of generic parameters keyed by the consumer's
 *   route parameter list. Every consumer here narrows to a handful of
 *   methods — `navigate`, `goBack`, and (for
 *   `@stackra/authorization/native`) `reset`. The narrower shape:
 *
 *   - Keeps the peer OPTIONAL — packages that don't ship a React
 *     Navigation-backed hook don't force `@react-navigation/native` into
 *     the consumer's install graph.
 *   - Lets each package's navigator type vary (stack / tab / drawer) —
 *     each concrete `NavigationProp` returned by
 *     `useNavigation()` is structurally assignable to this superset.
 *   - Documents the exact surface every consumer relies on — future
 *     drift shows up here in one place instead of five.
 *
 *   ## Third-party narrowing exemption
 *
 *   `contract-reexports.md`'s `I<Name>Like` ban targets structural shims
 *   that mirror an EXISTING RUNTIME TYPE inside the workspace. RN's
 *   `NavigationProp` is a third-party generic type, not a workspace
 *   contract — narrowing it via a purpose-built named interface (with
 *   this docblock naming the consumers + the drift concern the audit
 *   raised) is the correct promotion outcome, not a violation. See
 *   `.kiro/reports/container-di-architecture-reviewer/2026-07-27-phase-2-audit.md`
 *   §F2 for the audit finding + fix recommendation.
 */

/**
 * The subset of `@react-navigation/native`'s
 * `NavigationProp<ParamListBase>` consumed by every `@stackra/*`
 * package's `useNavigation()`-backed helper hook.
 *
 * Every method on this interface routes 1:1 to the corresponding
 * method on the concrete `NavigationProp` returned by
 * `useNavigation()`. The narrower shape keeps `@react-navigation/native`
 * OPTIONAL in every consumer's peer dependency table + lets each
 * consumer's concrete navigator type (stack / tab / drawer) vary
 * without changing this contract.
 *
 * @example
 * ```typescript
 * import type { INativeNavigation } from "@stackra/contracts";
 * import { useNavigation } from "@react-navigation/native";
 *
 * export function useMyPackageNavigation(): void {
 *   const navigation = useNavigation() as unknown as INativeNavigation;
 *   navigation.navigate("SomeScreen", { id: "..." });
 * }
 * ```
 */
export interface INativeNavigation {
  /**
   * Navigate to a named screen, optionally passing route params.
   *
   * Matches `NavigationProp.navigate(screen: string, params?: object)`.
   * Consumers that need typed route params on top of this narrow
   * signature can layer their own `ParamList` generic on their
   * hook's public API and cast internally — the on-wire call to
   * `@react-navigation/native` is identical either way.
   */
  readonly navigate: (
    screen: string,
    params?: Readonly<Record<string, unknown>>,
  ) => void;

  /**
   * Pop the current route off the stack. No-op on non-stack
   * navigators (tab / drawer) — matches
   * `@react-navigation/native`'s runtime contract.
   */
  readonly goBack: () => void;

  /**
   * Reset the navigator to a fresh state. Used by guard hooks
   * (`useProtectedRoute` in `@stackra/authorization/native`) to
   * redirect a denied user to a fallback screen with an empty
   * back-stack so the user can't press back into the protected
   * route.
   *
   * Matches
   * `NavigationProp.reset(state: { index: number; routes: ... })`.
   */
  readonly reset: (state: {
    readonly index: number;
    readonly routes: readonly {
      readonly name: string;
      readonly params?: Readonly<Record<string, unknown>>;
    }[];
  }) => void;
}
